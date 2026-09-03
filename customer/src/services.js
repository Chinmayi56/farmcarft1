// Farm Craft service layer — business data is provided by the FastAPI backend.

import { COMPANY } from './data.js';

/* ---------------- API-backed services ---------------- */
// Resolve the backend base URL the same way the Admin app does
// (admin/src/lib/apiClient.ts): VITE_API_BASE_URL when set (e.g. on
// Vercel, pointed at the deployed FastAPI backend), falling back to the
// local-dev `/api` path that Vite proxies to http://127.0.0.1:8000.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const KEYS = { auth:'fc_auth_session', token:'fc_auth_token', wishlist:'fc_wishlist', addresses:'fc_addresses' };
function read(key, fallback){ try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):fallback; }catch{return fallback;} }
function write(key,value){ localStorage.setItem(key,JSON.stringify(value)); }
async function api(path, options={}){
  const token=localStorage.getItem(KEYS.token);
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`,{...options,headers});
  } catch {
    throw new Error('Could not reach the Farm Craft server. Start the backend at http://127.0.0.1:8000 and try again.');
  }
  if(res.status===204) return null;
  let body=null; try{body=await res.json();}catch{}
  if(!res.ok){
    // A stale/expired token should not keep failing silently forever —
    // clear it so isLoggedIn() reflects reality and the UI can prompt a
    // fresh login instead of repeating a confusing 401 on every action.
    if(res.status===401){
      localStorage.removeItem(KEYS.token);
      localStorage.removeItem(KEYS.auth);
    }
    // FastAPI already returns safe, user-facing text in `detail` for the
    // errors this app raises deliberately (validation, not-found, auth,
    // conflict). Never surface raw tracebacks/db errors — fall back to a
    // generic, status-appropriate message instead of exposing internals.
    const FALLBACK_BY_STATUS = {
      400:'That request was not valid. Please check the details and try again.',
      401:'Please log in to continue.',
      403:'You do not have permission to do that.',
      404:'We could not find what you were looking for.',
      409:'That could not be completed due to a conflict with existing data.',
      422:'Please check the details you entered and try again.',
    };
    const message = (typeof body?.detail === 'string' && body.detail)
      ? body.detail
      : (FALLBACK_BY_STATUS[res.status] || 'Something went wrong on the Farm Craft server. Please try again.');
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body;
}
function saveAuth(data){ write(KEYS.auth,data.user); localStorage.setItem(KEYS.token,data.access_token); }
export const authService={
  async sendOtp(email){ await api('/auth/customer/send-otp',{method:'POST',body:JSON.stringify({email})}); return {ok:true}; },
  async verifyOtp(email,otp){ try{const data=await api('/auth/customer/verify-otp',{method:'POST',body:JSON.stringify({email,otp})}); saveAuth(data); return {ok:true,session:data.user};}catch(e){return {ok:false,error:e.message};} },
  logout(){ localStorage.removeItem(KEYS.token); localStorage.removeItem(KEYS.auth); },
  getSession(){ return read(KEYS.auth,null); },
  isLoggedIn(){ return !!localStorage.getItem(KEYS.token) && !!read(KEYS.auth,null); },
};

function normalizeProduct(p){
  const imgs=(p.images&&p.images.length?p.images:[p.image]).filter(Boolean);
  const specs=[];
  for(const [label,key] of [['Motor','motor'],['Capacity','capacity'],['Length','length'],['Height','height'],['Pipe Material','pipe_material'],['Screw Material','screw_material'],['Usage','usage']]) if(p[key]) specs.push({label,value:p[key]});
  if(!specs.length) specs.push({label:'SKU',value:p.sku});
  const slug=p.slug || p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  // Preserve the original list price (listPrice/mrp) BEFORE it gets
  // overwritten below by the effective selling price — otherwise a
  // discounted product loses its "was ₹X" reference price entirely.
  const listPrice=Number(p.price ?? 0);
  const discountPrice=p.discount_price==null?undefined:Number(p.discount_price);
  const price=discountPrice!=null?discountPrice:listPrice;
  const hasDiscount=discountPrice!=null&&discountPrice<listPrice;
  const stockStatus=p.stock<=0?'Out of Stock':p.stock<=5?'Low Stock':'In Stock';
  return {...p,slug,price,listPrice,discountPrice,hasDiscount,images:imgs.length?imgs:['assets/products/collector-diagram.jpeg'],specifications:specs,features:p.features||[],applications:p.applications||[],stockStatus,rating:null,reviews:0};
}
export const productService={
  cache:[],
  loading:false,
  loaded:false,
  error:null,
  // Fetches every page the backend has (not just the first 50) so the
  // customer catalog always mirrors the full Admin product set.
  // Tracks loading/error state itself so pages can tell "still loading",
  // "the API failed" and "the API returned zero products" apart instead
  // of collapsing all three into the same empty-grid UI.
  async load(){
    this.loading=true;
    try{
      // Customers must only ever see active products — draft (and any
      // future non-active) products are excluded at the API level via
      // ?status=active, not filtered client-side, so they never even
      // reach the browser.
      const first=await api('/products?status=active&skip=0&limit=200');
      let items=first.items||[];
      const total=first.total ?? items.length;
      while(items.length<total){
        const page=await api(`/products?status=active&skip=${items.length}&limit=200`);
        if(!page.items || !page.items.length) break;
        items=items.concat(page.items);
      }
      this.cache=items.map(normalizeProduct);
      this.error=null;
    }catch(e){
      // Keep whatever was already cached (e.g. a transient refetch on
      // navigation) and surface the failure instead of silently showing
      // an empty catalog.
      this.error=e.message||'Could not load products.';
    }finally{
      this.loading=false;
      this.loaded=true;
    }
    return this.cache;
  },
  list(){return this.cache;},
  search(query,{category,availability}={}){const q=(query||'').trim().toLowerCase(); return this.cache.filter(p=>{if(category&&p.category!==category)return false;if(availability==='in-stock'&&p.stockStatus!=='In Stock')return false;if(availability==='low-stock'&&p.stockStatus!=='Low Stock')return false;if(!q)return true; return [p.name,p.description,p.category,p.sku,...p.applications,...p.features].join(' ').toLowerCase().includes(q);});},
  bySlug(slug){return this.cache.find(p=>p.slug===slug)||null;},
};
export const customerService={
  getProfile(){const s=authService.getSession(); return s?{...s,addresses:read(KEYS.addresses,[])}:null;},
  saveAddress(a){const list=read(KEYS.addresses,[]); list.unshift({id:'addr_'+Date.now(),...a}); write(KEYS.addresses,list); return list;},
  getAddresses(){return read(KEYS.addresses,[]);},
  toggleWishlist(id){const list=read(KEYS.wishlist,[]); const i=list.indexOf(id); if(i>=0)list.splice(i,1);else list.unshift(id);write(KEYS.wishlist,list);return list;},
  getWishlist(){return read(KEYS.wishlist,[]);},
};
export const cartService={
  async get(){return api('/cart');},
  async add(productId,quantity=1){return api('/cart/items',{method:'POST',body:JSON.stringify({product_id:productId,quantity})});},
  async update(itemId,quantity){return api(`/cart/items/${itemId}`,{method:'PUT',body:JSON.stringify({quantity})});},
  async remove(itemId){return api(`/cart/items/${itemId}`,{method:'DELETE'});},
  async clear(){return api('/cart',{method:'DELETE'});},
};
export const orderService={
  cache:[],
  async create(payload){const o=await api('/orders',{method:'POST',body:JSON.stringify({address:payload.address,mobile:payload.customer?.mobile||null,configuration:payload.configuration||null,order_method:payload.orderMethod||'delivery'})}); this.cache.unshift(o); return o;},
  async load(){this.cache=await api('/orders'); return this.cache;},
  list(){return this.cache;},
  byId(id){return this.cache.find(o=>o.id===id||o.order_number===id||o.orderId===id)||null;},
};

/* ---------------- invoiceService ---------------- */


// A tiny green-leaf SVG used if the real logo file can't be fetched/embedded
// (e.g. opened from an unusual context). Keeps the invoice looking finished
// either way instead of showing a broken image icon.
const LOGO_FALLBACK_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
     <rect width="64" height="64" rx="12" fill="#1E7A3D"/>
     <path d="M32 14 C20 14 14 24 14 34 C14 44 22 50 32 50 C42 50 50 44 50 34 C50 24 44 14 32 14 Z"
           fill="none" stroke="#ffffff" stroke-width="2.4"/>
     <path d="M32 20 V44 M32 44 L24 36 M32 38 L40 30" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
   </svg>`
);

let logoDataUrlPromise = null;
// Fetches the bundled logo and inlines it as a base64 data URL so the
// downloaded invoice file still shows the logo correctly when opened later,
// from a different folder, or offline — a relative "assets/logo.jpeg" path
// would break once the file leaves the project folder.
function getLogoDataUrl() {
  if (logoDataUrlPromise) return logoDataUrlPromise;
  logoDataUrlPromise = fetch(COMPANY.logoMark)
    .then(res => { if (!res.ok) throw new Error('logo fetch failed'); return res.blob(); })
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }))
    .catch(() => LOGO_FALLBACK_SVG);
  return logoDataUrlPromise;
}

function invoiceNumber(order) {
  return `INV-${order.order_number || order.id}`;
}

export const invoiceService = {
  async buildInvoiceHtml(order) {
    const logoSrc = await getLogoDataUrl();
    const total = Number(order.total_amount || 0);
    const qty = order.items?.reduce((n,i)=>n+i.quantity,0) || 0;
    const unitPrice = qty ? total / qty : 0;
    const priceLabel = `₹${total.toLocaleString('en-IN')}`;
    const unitPriceLabel = `₹${unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const totalLabel = priceLabel;
    const issueDate = new Date(order.created_at);

    return `
    <div style="font-family: 'Inter', Arial, sans-serif; color:#2A2E29; max-width:720px; margin:0 auto; background:#FCFBF8;">

      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; padding:36px 40px 24px; border-bottom:4px solid #1E7A3D;">
        <div style="display:flex; align-items:center; gap:14px;">
          <img src="${logoSrc}" alt="Farm Craft logo" width="56" height="56" style="width:56px; height:56px; border-radius:12px; object-fit:contain; display:block;" />
          <div>
            <div style="font-size:22px; font-weight:700; letter-spacing:0.5px; color:#134A26;">FARM CRAFT</div>
            <div style="font-size:11px; color:#666; margin-top:2px;">Agricultural Machinery &amp; Grain Handling Equipment</div>
            <div style="font-size:11px; color:#666; margin-top:2px;">GSTIN: ${COMPANY.gstin}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px; font-weight:700; color:#1E7A3D; letter-spacing:1px;">INVOICE</div>
          <div style="font-size:12px; color:#666; margin-top:6px;">Invoice No: <strong style="color:#2A2E29;">${invoiceNumber(order)}</strong></div>
          <div style="font-size:12px; color:#666;">Order ID: <strong style="color:#2A2E29;">${order.order_number || order.id}</strong></div>
          <div style="font-size:12px; color:#666;">Date: <strong style="color:#2A2E29;">${issueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
        </div>
      </div>

      <div style="padding:24px 40px 0;">
        <div style="background:#134A26; color:#fff; border-radius:14px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <div>
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.6);">Purchase Code</div>
            <div style="font-size:20px; font-weight:700; letter-spacing:2px; margin-top:2px;">${order.purchase_code}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.6);">Status</div>
            <div style="font-size:13px; font-weight:600; margin-top:2px;">${order.status}</div>
          </div>
        </div>

        <div style="display:flex; gap:32px; margin-bottom:24px;">
          <div style="flex:1;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:6px; font-weight:600;">Billed To</div>
            <div style="font-size:13px; line-height:1.6;">
              <div style="font-weight:600;">${order.customer_snapshot?.name || ''}</div>
              <div>${order.customer_snapshot?.email || ''}</div>
              <div>${order.customer_snapshot?.mobile || ''}</div>
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:6px; font-weight:600;">Delivery Address</div>
            <div style="font-size:13px; line-height:1.6;">
              <div>${order.shipping_address?.line1 || order.shipping_address?.address || '—'}</div>
              <div>${[order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.pincode].filter(Boolean).join(', ') || ''}</div>
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:6px; font-weight:600;">From</div>
            <div style="font-size:13px; line-height:1.6;">
              <div style="font-weight:600;">${COMPANY.name}</div>
              <div>${COMPANY.email}</div>
              <div>${COMPANY.phone}</div>
            </div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:4px;">
          <thead>
            <tr style="background:#E8F3EC; text-align:left;">
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#134A26; border-radius:8px 0 0 8px;">Product</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#134A26;">Configuration</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#134A26; text-align:center;">Qty</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#134A26; text-align:right;">Unit Price</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#134A26; text-align:right; border-radius:0 8px 8px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px; border-bottom:1px solid #E4E2D9; font-size:13px; font-weight:600;">${order.items?.[0]?.product_name || ''}</td>
              <td style="padding:12px; border-bottom:1px solid #E4E2D9; font-size:12px; color:#666;">${order.configuration || '—'}</td>
              <td style="padding:12px; border-bottom:1px solid #E4E2D9; font-size:13px; text-align:center;">${qty}</td>
              <td style="padding:12px; border-bottom:1px solid #E4E2D9; font-size:13px; text-align:right;">${unitPriceLabel}</td>
              <td style="padding:12px; border-bottom:1px solid #E4E2D9; font-size:13px; text-align:right; font-weight:600;">${priceLabel}</td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-bottom:28px;">
          <div style="width:260px;">
            <div style="display:flex; justify-content:space-between; padding:8px 12px; font-size:13px; color:#666;">
              <span>Subtotal</span><span>${totalLabel}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px 12px; font-size:13px; color:#666;">
              <span>Taxes</span><span>${total > 0 ? 'Included' : '—'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:12px; background:#E8F3EC; border-radius:10px; font-size:15px; font-weight:700; color:#134A26; margin-top:4px;">
              <span>Total</span><span>${totalLabel}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:32px; margin-bottom:28px; font-size:12px; color:#666;">
          <div><span style="color:#888;">Payment Method:</span> <strong style="color:#2A2E29;">${order.payment_method || '—'}</strong></div>
          <div><span style="color:#888;">Order Date:</span> <strong style="color:#2A2E29;">${issueDate.toLocaleDateString('en-IN')}</strong></div>
        </div>
      </div>

      <div style="border-top:1px solid #E4E2D9; padding:20px 40px 32px; font-size:11px; color:#999; text-align:center; line-height:1.7;">
        Thank you for choosing Farm Craft. Our team will contact you regarding order confirmation and delivery.<br />
        This is a demo invoice generated for preview purposes — no real payment has been processed.<br />
        Farm Craft &middot; ${COMPANY.address} &middot; ${COMPANY.email} &middot; ${COMPANY.phone}
      </div>
    </div>
    `;
  },

  async downloadInvoice(order) {
    const body = await this.buildInvoiceHtml(order);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>Invoice ${invoiceNumber(order)} — Farm Craft</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { margin:0; padding:32px 16px; background:#F1EFE7; font-family: Inter, Arial, sans-serif; }
        @media print { body { background:#fff; padding:0; } }
        table { width:100%; }
      </style>
      </head><body>${body}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FarmCraft-Invoice-${order.order_number || order.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const contactService = {
  // POST /api/contact — public endpoint, no auth required. Uses the
  // shared `api()` helper so network/server errors surface the same
  // safe, user-facing messages as the rest of the app.
  async submit({ name, email, phone, message }) {
    return api('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, message }),
    });
  },
};
