import { authService, customerService } from './services.js';
import { COMPANY, CATEGORIES } from './data.js';

// Re-run lucide icon replacement after any DOM update
export function icons() {
  if (window.lucide) window.lucide.createIcons();
}

export function toast(message, opts = {}) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  const isError = opts.type === 'error';
  el.className = `toast-enter flex items-center gap-2 px-4 py-3 rounded-xl shadow-soft text-sm font-medium ${
    isError ? 'bg-fc-charcoal text-white' : 'bg-fc-green text-white'
  }`;
  el.innerHTML = `<i data-lucide="${isError ? 'alert-circle' : 'check-circle-2'}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
  root.appendChild(el);
  icons();
  setTimeout(() => {
    el.style.transition = 'opacity .3s ease, transform .3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

// Renders the selling price, and — when a discount actually applies —
// the original list price struck through alongside it, so "discount
// price where applicable" is visibly distinct from a plain price.
export function priceBlock(p, { size = 'text-fc-charcoal font-display font-semibold' } = {}) {
  if (!p.price) return `<span class="${size}">Contact for Price</span>`;
  if (p.hasDiscount) {
    return `<span class="flex items-center gap-2 flex-wrap">
      <span class="${size}">₹${Number(p.price).toLocaleString('en-IN')}</span>
      <span class="text-sm text-fc-slate/50 line-through">₹${Number(p.listPrice).toLocaleString('en-IN')}</span>
    </span>`;
  }
  return `<span class="${size}">₹${Number(p.price).toLocaleString('en-IN')}</span>`;
}

// A small inline SVG placeholder shown if a product photo fails to load —
// keeps product cards, galleries and the invoice looking finished instead of
// showing a browser's broken-image icon.
export const IMG_FALLBACK = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
     <rect width="400" height="300" fill="#E8F3EC"/>
     <g fill="none" stroke="#1E7A3D" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.55">
       <rect x="130" y="108" width="140" height="100" rx="10"/>
       <path d="M130 150 L170 108 L230 108 L270 150"/>
       <circle cx="200" cy="172" r="16"/>
     </g>
   </svg>`
);

export function imgWithFallback(src, alt, cls = '') {
  return `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy"
    onerror="this.onerror=null;this.src='${IMG_FALLBACK}';this.className='${cls} object-contain p-10 bg-fc-greenlight';" />`;
}

export function stockBadge(status) {
  const map = {
    'In Stock': 'bg-fc-greenlight text-fc-green',
    'Low Stock': 'bg-amber-50 text-amber-700',
    'Out of Stock': 'bg-red-50 text-red-600',
  };
  return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}">
    <span class="w-1.5 h-1.5 rounded-full ${status === 'In Stock' ? 'bg-fc-green' : status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}"></span>
    ${status}
  </span>`;
}

export function productCard(p, { showRemoveFromFavorites = false } = {}) {
  const wishlisted = customerService.getWishlist().includes(p.id);
  return `
  <article class="group bg-white rounded-2xl border border-fc-line shadow-card hover:shadow-soft transition-shadow duration-300 overflow-hidden flex flex-col">
    <a href="#/product/${p.slug}" class="zoom-wrap block relative aspect-[4/3] bg-fc-greenlight">
      ${imgWithFallback(p.images[0], p.name, 'w-full h-full object-cover')}
      <button data-wishlist="${p.id}" aria-label="Toggle wishlist" aria-pressed="${wishlisted}"
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card hover:scale-105 transition-transform">
        <i data-lucide="heart" class="w-4 h-4 ${wishlisted ? 'text-fc-wheat fill-fc-wheat' : 'text-fc-charcoal'}"></i>
      </button>
    </a>
    <div class="p-4 flex flex-col gap-2 flex-1">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] uppercase tracking-wide text-fc-green font-semibold">${p.category.replace(/-/g,' ')}</span>
        ${stockBadge(p.stockStatus)}
      </div>
      <a href="#/product/${p.slug}" class="font-display font-semibold text-base leading-snug hover:text-fc-green transition-colors">${p.name}</a>
      <p class="text-sm text-fc-slate/80 clamp-2">${p.description}</p>
      <div class="text-xs text-fc-slate/70">${p.specifications[0]?.label}: <strong class="text-fc-charcoal">${p.specifications[0]?.value}</strong></div>
      <div class="mt-auto pt-3 flex items-center justify-between">
        ${priceBlock(p)}
      </div>
      <div class="flex gap-2 pt-1">
        <a href="#/product/${p.slug}" class="flex-1 text-center text-sm font-medium border border-fc-line rounded-xl py-2 hover:border-fc-green hover:text-fc-green transition-colors">View Details</a>
        <button data-cart-add="${p.id}" ${p.stockStatus === 'Out of Stock' ? 'disabled' : ''} class="flex-1 text-sm font-medium border border-fc-green text-fc-green rounded-xl py-2 hover:bg-fc-greenlight transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">Add to Cart</button><button data-getcode="${p.id}" ${p.stockStatus === 'Out of Stock' ? 'disabled' : ''} class="flex-1 text-sm font-medium bg-fc-green text-white rounded-xl py-2 hover:bg-fc-greendark transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-fc-green">Get a Code</button>
      </div>
      ${showRemoveFromFavorites ? `<button data-wishlist="${p.id}" class="text-xs font-medium text-fc-slate/60 hover:text-red-600 transition-colors mt-1 text-left">Remove from Favorites</button>` : ''}
    </div>
  </article>`;
}

export function header() {
  const session = authService.getSession();
  const wishCount = customerService.getWishlist().length;
  return `
  <header id="site-header" class="sticky top-0 z-50 hdr-blur bg-white/80 border-b border-fc-line transition-shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="h-16 flex items-center justify-between gap-4">
        <a href="#/" class="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
           <img src="${COMPANY.logoMark}" alt="Farm Craft" class="h-10 w-[112px] sm:h-11 sm:w-[128px] rounded-xl bg-white object-contain p-0.5 shrink-0 -translate-x-[35px]" />
          <span class="font-display font-bold text-base sm:text-lg tracking-tight leading-none">FARM CRAFT</span>
        </a>

        <nav class="hidden lg:flex items-center gap-7 text-sm font-medium text-fc-slate">
          <a href="#/" class="hover:text-fc-green transition-colors">Home</a>
          <a href="#/shop" class="hover:text-fc-green transition-colors">Products</a>
          <a href="#/about" class="hover:text-fc-green transition-colors">About Us</a>
          <a href="#/services" class="hover:text-fc-green transition-colors">Services</a>
          <a href="#/contact" class="hover:text-fc-green transition-colors">Contact</a>
        </nav>

        <form id="header-search" class="hidden md:flex items-center flex-1 max-w-xs bg-fc-offwhite border border-fc-line rounded-full px-3 py-2 focus-within:border-fc-green transition-colors">
          <i data-lucide="search" class="w-4 h-4 text-fc-slate/60 shrink-0"></i>
          <input name="q" type="search" placeholder="Search grain machinery…" class="bg-transparent outline-none text-sm px-2 w-full placeholder:text-fc-slate/50" />
        </form>

        <div class="flex items-center gap-1 sm:gap-2">
          <a href="#/cart" class="relative w-10 h-10 rounded-full hover:bg-fc-greenlight flex items-center justify-center transition-colors" aria-label="Cart"><i data-lucide="shopping-cart" class="w-5 h-5"></i></a>
          <a href="#/wishlist" class="relative w-10 h-10 rounded-full hover:bg-fc-greenlight flex items-center justify-center transition-colors" aria-label="Wishlist">
            <i data-lucide="heart" class="w-5 h-5"></i>
            <span id="wishlist-count-badge" class="absolute -top-0.5 -right-0.5 bg-fc-wheat text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${wishCount ? '' : 'hidden'}">${wishCount}</span>
          </a>
          <a href="#/${session ? 'profile' : 'login'}" class="hidden sm:flex w-10 h-10 rounded-full hover:bg-fc-greenlight items-center justify-center transition-colors" aria-label="Account">
            <i data-lucide="user" class="w-5 h-5"></i>
          </a>
          <a href="#/shop" class="hidden md:inline-flex ml-1 bg-fc-green text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-fc-greendark transition-colors">
            Explore Products
          </a>
          <button id="mobile-menu-btn" class="lg:hidden w-10 h-10 rounded-full hover:bg-fc-greenlight flex items-center justify-center" aria-label="Open menu">
            <i data-lucide="menu" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <form id="header-search-mobile" class="md:hidden pb-3 flex items-center bg-fc-offwhite border border-fc-line rounded-full px-3 py-2">
        <i data-lucide="search" class="w-4 h-4 text-fc-slate/60 shrink-0"></i>
        <input name="q" type="search" placeholder="Search grain machinery…" class="bg-transparent outline-none text-sm px-2 w-full placeholder:text-fc-slate/50" />
      </form>
    </div>

    <div id="mobile-menu" class="hidden lg:hidden border-t border-fc-line bg-white">
      <nav class="max-w-7xl mx-auto px-4 py-3 flex flex-col text-sm font-medium text-fc-slate">
        <a href="#/" class="py-2.5 border-b border-fc-line/70">Home</a>
        <a href="#/shop" class="py-2.5 border-b border-fc-line/70">Products</a>
        <a href="#/about" class="py-2.5 border-b border-fc-line/70">About Us</a>
        <a href="#/services" class="py-2.5 border-b border-fc-line/70">Services</a>
        <a href="#/contact" class="py-2.5 border-b border-fc-line/70">Contact</a>
        <a href="#/wishlist" class="py-2.5 border-b border-fc-line/70">Wishlist</a>
        <a href="#/cart" class="py-2.5 border-b border-fc-line/70">Cart</a>
        <a href="#/${session ? 'profile' : 'login'}" class="py-2.5 border-b border-fc-line/70">${session ? 'My Profile' : 'Login'}</a>
        <a href="#/orders" class="py-2.5">My Orders</a>
      </nav>
    </div>
  </header>`;
}

export function mobileTabBar() {
  const wishCount = customerService.getWishlist().length;
  return `
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-fc-line grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
    <a href="#/" class="flex flex-col items-center justify-center gap-0.5 py-2.5 text-fc-slate">
      <i data-lucide="home" class="w-5 h-5"></i><span class="text-[11px]">Home</span>
    </a>
    <a href="#/shop" class="flex flex-col items-center justify-center gap-0.5 py-2.5 text-fc-slate">
      <i data-lucide="layout-grid" class="w-5 h-5"></i><span class="text-[11px]">Shop</span>
    </a>
    <a href="#/wishlist" class="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-fc-slate">
      <i data-lucide="heart" class="w-5 h-5"></i><span class="text-[11px]">Wishlist</span>
      ${wishCount ? `<span class="absolute top-1 right-[calc(50%-18px)] bg-fc-wheat text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">${wishCount}</span>` : ''}
    </a>
    <a href="#/orders" class="flex flex-col items-center justify-center gap-0.5 py-2.5 text-fc-slate">
  <i data-lucide="package" class="w-5 h-5"></i>
  <span class="text-[11px]">Orders</span>
 </a>
    <a href="#/profile" class="flex flex-col items-center justify-center gap-0.5 py-2.5 text-fc-slate">
      <i data-lucide="user" class="w-5 h-5"></i><span class="text-[11px]">Profile</span>
    </a>
  </nav>`;
}

export function footer() {
  return `
  <footer class="bg-fc-charcoal text-white/90 mt-24 pb-20 lg:pb-0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 lg:grid-cols-6 gap-10">
      <div class="col-span-2 lg:col-span-2">
        <div class="flex items-center gap-2.5 mb-4">
          <img src="${COMPANY.logoMark}" alt="Farm Craft" class="h-11 w-28 rounded-xl bg-white object-contain p-0.5 shrink-0" />
          <span class="font-display font-bold text-lg">FARM CRAFT</span>
        </div>
        <p class="text-sm text-white/60 max-w-xs leading-relaxed">Agricultural machinery and grain handling equipment engineered for farms, mills and agri-businesses.</p>
        <div class="flex gap-3 mt-5">
          ${['facebook','instagram','twitter','youtube'].map(s => `
            <span class="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors cursor-default">
              <i data-lucide="${s}" class="w-4 h-4"></i>
            </span>`).join('')}
        </div>
      </div>
      <div>
        <h4 class="font-display font-semibold mb-4 text-sm">Quick Links</h4>
        <ul class="space-y-2.5 text-sm text-white/60">
          <li><a href="#/" class="hover:text-white transition-colors">Home</a></li>
          <li><a href="#/shop" class="hover:text-white transition-colors">Products</a></li>
          <li><a href="#/services" class="hover:text-white transition-colors">Services</a></li>
          <li><a href="#/about" class="hover:text-white transition-colors">About</a></li>
          <li><a href="#/contact" class="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-display font-semibold mb-4 text-sm">Products</h4>
        <ul class="space-y-2.5 text-sm text-white/60">
          ${CATEGORIES.slice(0,4).map(c => `<li><a href="#/shop?category=${c.id}" class="hover:text-white transition-colors">${c.name}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h4 class="font-display font-semibold mb-4 text-sm">Customer</h4>
        <ul class="space-y-2.5 text-sm text-white/60">
          <li><a href="#/profile" class="hover:text-white transition-colors">My Account</a></li>
          <li><a href="#/orders" class="hover:text-white transition-colors">My Orders</a></li>
          <li><a href="#/orders" class="hover:text-white transition-colors">Purchase Codes</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-display font-semibold mb-4 text-sm">Contact Us</h4>
        <ul class="space-y-2.5 text-sm text-white/60">
          <li><a href="tel:+919440436868" class="hover:text-white transition-colors">${COMPANY.phone}</a></li>
          <li><a href="tel:+919490436868" class="hover:text-white transition-colors">${COMPANY.phone2}</a></li>
          <li><a href="mailto:${COMPANY.email}" class="hover:text-white transition-colors break-all">${COMPANY.email}</a></li>
          <li class="flex items-start gap-2 text-white/55 leading-relaxed"><i data-lucide="map-pin" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i><span>${COMPANY.address}</span></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-white/45">
        <span>© ${new Date().getFullYear()} Farm Craft. All rights reserved.</span>
        <span>GSTIN: ${COMPANY.gstin}</span>
      </div>
    </div>
  </footer>`;
}

export function skeletonCard() {
  return `<div class="bg-white rounded-2xl border border-fc-line overflow-hidden">
    <div class="skel aspect-[4/3]"></div>
    <div class="p-4 space-y-2">
      <div class="skel h-3 w-20 rounded"></div>
      <div class="skel h-4 w-3/4 rounded"></div>
      <div class="skel h-3 w-full rounded"></div>
      <div class="skel h-9 w-full rounded-xl mt-2"></div>
    </div>
  </div>`;
}

export function emptyState({ icon = 'inbox', title, body, actionHref, actionLabel }) {
  return `
  <div class="flex flex-col items-center justify-center text-center py-20 px-4">
    <div class="w-16 h-16 rounded-2xl bg-fc-greenlight flex items-center justify-center mb-5">
      <i data-lucide="${icon}" class="w-7 h-7 text-fc-green"></i>
    </div>
    <h3 class="font-display font-semibold text-lg mb-1.5">${title}</h3>
    <p class="text-sm text-fc-slate/70 max-w-sm mb-6">${body}</p>
    ${actionHref ? `<a href="${actionHref}" class="bg-fc-green text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-fc-greendark transition-colors">${actionLabel}</a>` : ''}
  </div>`;
}

export function initRevealObserver() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

export function attachHeaderBehaviour(router) {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));

  ['header-search', 'header-search-mobile'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new FormData(form).get('q');
      window.location.hash = `#/shop?q=${encodeURIComponent(q || '')}`;
    });
  });
  // Wishlist buttons are bound once, centrally, in main.js's bindGlobalDelegates
  // — binding them here too used to double-toggle every heart click.
}
