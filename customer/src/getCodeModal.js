import { productService, authService, customerService, orderService, cartService } from './services.js';

import { icons, toast, priceBlock, imgWithFallback } from './components.js';

let state = null;

function initialState(product) {
  const session = authService.getSession();
  const savedAddr = customerService.getAddresses()[0] || {};
  return {
    product,
    step: 1,
    customer: { name: session?.name || '', email: session?.email || '', mobile: session?.mobile || '' },
    address: { line1: savedAddr.line1 || '', city: savedAddr.city || '', state: savedAddr.state || '', pincode: savedAddr.pincode || '' },
    quantity: 1,
    configuration: product.specifications?.[0] ? `${product.specifications[0].label}: ${product.specifications[0].value}` : '',
    // How the customer wants to complete the order — sent to the backend
    // as `order_method` ('delivery' for Cash on Delivery, 'visit_company'
    // for Visit Company). This is NOT an online payment method / gateway;
    // Cash on Delivery remains the only payment method.
    orderMethod: 'delivery',
  };
}

export function openGetCodeModal(productId) {
  if (!authService.isLoggedIn()) {
    toast('Please log in to get a purchase code', { type: 'error' });
    window.location.hash = '#/login';
    return;
  }
  const product = productService.list().find(p => p.id === productId);
  if (!product) return;
  if (!product.stock || product.stock <= 0) {
    toast('This product is currently out of stock', { type: 'error' });
    return;
  }
  state = initialState(product);
  render();
}

function closeModal() {
  const root = document.getElementById('getcode-modal-root');
  if (root) root.remove();
  state = null;
}

function stepLabel(n) {
  return ['Customer Details', 'Delivery Address', 'Product', 'Order Method'][n - 1];
}

function stepper() {
  return `
  <div class="flex items-center gap-2 mb-6">
    ${[1,2,3,4].map(n => `
      <div class="flex-1 flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
          n < state.step ? 'bg-fc-green text-white' : n === state.step ? 'bg-fc-green text-white' : 'bg-fc-offwhite text-fc-slate/50 border border-fc-line'
        }">${n < state.step ? '<i data-lucide=\"check\" class=\"w-3.5 h-3.5\"></i>' : n}</div>
        ${n < 4 ? `<div class="h-0.5 flex-1 ${n < state.step ? 'bg-fc-green' : 'bg-fc-line'}"></div>` : ''}
      </div>`).join('')}
  </div>
  <p class="text-xs uppercase tracking-wide text-fc-green font-semibold mb-4">Step ${state.step} of 4 &middot; ${stepLabel(state.step)}</p>`;
}

function stepCustomer() {
  const c = state.customer;
  return `
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1.5">Name</label>
      <input data-field="name" value="${c.name}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1.5">Email</label>
      <input data-field="email" type="email" value="${c.email}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1.5">Mobile Number</label>
      <input data-field="mobile" value="${c.mobile}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
    </div>
  </div>`;
}

function stepAddress() {
  const a = state.address;
  return `
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1.5">Address</label>
      <textarea data-field="line1" rows="2" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green resize-none">${a.line1}</textarea>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1.5">City</label>
        <input data-field="city" value="${a.city}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1.5">State</label>
        <input data-field="state" value="${a.state}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium mb-1.5">Pincode</label>
      <input data-field="pincode" value="${a.pincode}" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
    </div>
  </div>`;
}

function stepProduct() {
  const p = state.product;
  const unitPrice = p.discountPrice != null ? Number(p.discountPrice) : Number(p.price || 0);
  const total = unitPrice * state.quantity;
  return `
  <div class="flex gap-4 mb-5">
    ${imgWithFallback(p.images[0], p.name, 'w-20 h-20 rounded-xl object-cover border border-fc-line shrink-0')}
    <div>
      <div class="font-display font-semibold">${p.name}</div>
      <div class="text-xs text-fc-slate/50 mt-0.5">SKU: ${p.sku}</div>
      <div class="text-sm text-fc-slate/60 mt-1">${priceBlock(p, { size: 'text-fc-slate/80 font-medium' })}</div>
      <div class="text-xs mt-1 ${p.stock > 0 ? 'text-fc-green' : 'text-red-600'}">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
    </div>
  </div>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1.5">Quantity</label>
      <div class="flex items-center gap-3">
        <button data-qty="dec" type="button" class="w-9 h-9 rounded-lg border border-fc-line flex items-center justify-center hover:border-fc-green">−</button>
        <span class="w-8 text-center font-medium" id="qty-value">${state.quantity}</span>
        <button data-qty="inc" type="button" class="w-9 h-9 rounded-lg border border-fc-line flex items-center justify-center hover:border-fc-green">+</button>
        <span class="text-xs text-fc-slate/50">Max ${p.stock} available</span>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium mb-1.5">Selected Configuration</label>
      <select data-field="configuration" class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green">
        ${p.specifications.map(s => `<option value="${s.label}: ${s.value}" ${state.configuration === `${s.label}: ${s.value}` ? 'selected' : ''}>${s.label}: ${s.value}</option>`).join('')}
      </select>
    </div>
    <div class="flex items-center justify-between rounded-xl bg-fc-offwhite px-4 py-3 text-sm">
      <span class="text-fc-slate/60">Total Amount</span>
      <span class="font-display font-semibold text-base" data-total-amount>₹${total.toLocaleString('en-IN')}</span>
    </div>
  </div>`;
}

const ORDER_METHOD_OPTIONS = [
  { value: 'delivery', icon: 'banknote', title: 'Cash on Delivery', desc: 'Pay in cash when your order is delivered.' },
  { value: 'visit_company', icon: 'building-2', title: 'Visit Company', desc: 'Visit our office to complete the purchase and payment in person.' },
];

function stepPayment() {
  // Choose how to complete the order: Cash on Delivery (existing flow) or
  // Visit Company (new). Neither is an online payment method — no card,
  // gateway, or online payment is collected here.
  return `
  <div class="space-y-3">
    ${ORDER_METHOD_OPTIONS.map(opt => `
    <button type="button" data-order-method="${opt.value}" class="w-full flex items-center gap-4 border-2 rounded-xl p-4 text-left transition-colors ${
      state.orderMethod === opt.value ? 'border-fc-green bg-fc-greenlight/50' : 'border-fc-line hover:border-fc-green/50'
    }">
      <div class="w-10 h-10 rounded-lg bg-white border border-fc-line flex items-center justify-center shrink-0">
        <i data-lucide="${opt.icon}" class="w-5 h-5 text-fc-green"></i>
      </div>
      <div class="flex-1">
        <div class="font-medium text-sm">${opt.title}</div>
        <div class="text-xs text-fc-slate/60">${opt.desc}</div>
      </div>
      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        state.orderMethod === opt.value ? 'border-fc-green bg-fc-green' : 'border-fc-line'
      }">
        ${state.orderMethod === opt.value ? '<div class="w-2 h-2 rounded-full bg-white"></div>' : ''}
      </div>
    </button>`).join('')}
    <p class="text-xs text-fc-slate/55 px-1">Choose Cash on Delivery to pay when your order arrives, or Visit Company to complete the purchase in person.</p>
  </div>`;
}

function footerButtons() {
  if (state.step === 4) {
    return `
    <button data-action="back" class="flex-1 border border-fc-line font-medium py-2.5 rounded-xl hover:border-fc-green">Back</button>
    <button data-action="confirm" class="flex-1 bg-fc-green text-white font-medium py-2.5 rounded-xl hover:bg-fc-greendark">Confirm Purchase</button>`;
  }
  return `
    ${state.step > 1 ? `<button data-action="back" class="flex-1 border border-fc-line font-medium py-2.5 rounded-xl hover:border-fc-green">Back</button>` : `<div class="flex-1"></div>`}
    <button data-action="next" class="flex-1 bg-fc-green text-white font-medium py-2.5 rounded-xl hover:bg-fc-greendark">Continue</button>`;
}

function render() {
  let existing = document.getElementById('getcode-modal-root');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'getcode-modal-root';
    document.body.appendChild(existing);
  }
  const body = state.step === 1 ? stepCustomer() : state.step === 2 ? stepAddress() : state.step === 3 ? stepProduct() : stepPayment();

  existing.innerHTML = `
  <div class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-black/50 modal-backdrop" data-close></div>
    <div class="modal-panel relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto thin-scroll">
      <div class="sticky top-0 bg-white border-b border-fc-line px-6 pt-5 pb-4 flex items-center justify-between">
        <h2 class="font-display font-semibold text-lg">Get Your Farm Craft Purchase Code</h2>
        <button data-close aria-label="Close" class="w-8 h-8 rounded-full hover:bg-fc-offwhite flex items-center justify-center">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div class="px-6 pt-5">
        ${stepper()}
        ${body}
      </div>
      <div class="px-6 py-5 flex gap-3 mt-2">
        ${footerButtons()}
      </div>
    </div>
  </div>`;
  icons();
  bind(existing);
}

function readFields(container) {
  container.querySelectorAll('[data-field]').forEach(el => {
    const key = el.getAttribute('data-field');
    if (state.step === 1) state.customer[key] = el.value;
    if (state.step === 2) state.address[key] = el.value;
    if (state.step === 3 && key === 'configuration') state.configuration = el.value;
  });
}

function validateStep() {
  if (state.step === 1) {
    const { name, email, mobile } = state.customer;
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !mobile.trim()) {
      toast('Please fill in all customer details correctly', { type: 'error' });
      return false;
    }
  }
  if (state.step === 2) {
    const { line1, city, state: st, pincode } = state.address;
    if (!line1.trim() || !city.trim() || !st.trim() || !pincode.trim()) {
      toast('Please complete the delivery address', { type: 'error' });
      return false;
    }
  }
  return true;
}

function bind(root) {
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

  root.querySelectorAll('[data-order-method]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.orderMethod = btn.getAttribute('data-order-method');
      render();
    });
  });

  root.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-qty');
      const maxStock = state.product.stock || 0;
      const next = state.quantity + (dir === 'inc' ? 1 : -1);
      if (dir === 'inc' && next > maxStock) {
        toast(`Only ${maxStock} in stock`, { type: 'error' });
        return;
      }
      state.quantity = Math.max(1, Math.min(next, maxStock));
      root.querySelector('#qty-value').textContent = state.quantity;
      const total = (state.product.discountPrice != null ? Number(state.product.discountPrice) : Number(state.product.price || 0)) * state.quantity;
      const totalEl = root.querySelector('[data-total-amount]');
      if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    });
  });

  root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
    state.step = Math.max(1, state.step - 1);
    render();
  });

  root.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    const panel = root.querySelector('.modal-panel');
    readFields(panel);
    if (!validateStep()) return;
    state.step = Math.min(4, state.step + 1);
    render();
  });

  root.querySelector('[data-action="confirm"]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    if (state.quantity < 1) {
      toast('Please select a valid quantity', { type: 'error' });
      return;
    }
    if (state.quantity > (state.product.stock || 0)) {
      toast('Requested quantity exceeds available stock', { type: 'error' });
      return;
    }
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Placing order…';
    customerService.saveAddress(state.address);
    try {
      // The backend builds an order strictly from the customer's current
      // server-side cart (POST /api/orders has no product/quantity of its
      // own) — it even rejects the request with "Cart is empty" if the
      // cart has nothing in it. "Get a Code" is presented as a request for
      // ONE selected product, so make the cart match exactly that product
      // and quantity right before creating the order. Otherwise this would
      // fail outright, or silently fold in unrelated items the customer
      // added to their cart separately.
      await cartService.clear();
      await cartService.add(state.product.id, state.quantity);
      const order = await orderService.create({ customer: state.customer, address: state.address, configuration: state.configuration, orderMethod: state.orderMethod });
      closeModal();
      toast('Purchase order created!');
      window.location.hash = `#/success/${order.order_number || order.id}`;
    } catch (err) {
      toast(err.message || 'Could not create order', { type: 'error' });
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}
