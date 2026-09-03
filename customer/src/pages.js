import { COMPANY, CATEGORIES, HIGHLIGHTS, SERVICES } from './data.js';
import { authService, productService, orderService, customerService, cartService, invoiceService, contactService } from './services.js';
import { productCard, stockBadge, emptyState, skeletonCard, toast, icons, imgWithFallback, priceBlock } from './components.js';

/* ============================= LOGIN ============================= */
export function loginPage() {
  return `
  <div class="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
    <div class="hidden lg:block relative bg-fc-charcoal">
      <img src="assets/products/collector-field.jpeg" class="absolute inset-0 w-full h-full object-cover opacity-70" alt="Farm Craft machinery in a field" />
      <div class="absolute inset-0 bg-gradient-to-t from-fc-charcoal via-fc-charcoal/30 to-transparent"></div>
      <div class="relative h-full flex flex-col justify-end p-12 text-white">
        <span class="text-xs uppercase tracking-wide text-fc-wheat font-semibold mb-3">Grain Handling, Engineered</span>
        <h2 class="font-display text-3xl font-semibold leading-tight max-w-md">Built for the fields, trusted by farms and mills.</h2>
      </div>
    </div>

    <div class="flex items-center justify-center px-6 py-14 sm:py-20">
      <div class="w-full max-w-sm">
        <img src="${COMPANY.logo}" alt="Farm Craft" class="h-24 w-40 rounded-2xl bg-white object-contain p-1 mb-6" />
        <h1 class="font-display text-2xl font-semibold mb-1.5">Welcome to Farm Craft</h1>
        <p class="text-sm text-fc-slate/70 mb-7">Explore powerful agricultural machinery built for efficient grain handling.</p>

        <!-- Step 1: Email entry -->
        <div id="email-step">
          <form id="email-form" class="space-y-4" novalidate>
            <div>
              <label for="login-email" class="block text-sm font-medium mb-1.5">Email</label>
              <input id="login-email" name="email" type="email" required autocomplete="email"
                class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green transition-colors" placeholder="you@example.com" />
              <p class="text-xs text-red-500 mt-1 hidden" data-error-for="email">Enter a valid email address.</p>
            </div>
            <button type="submit" class="w-full bg-fc-green text-white font-medium py-2.5 rounded-xl hover:bg-fc-greendark transition-colors">
              Send OTP
            </button>
          </form>
        </div>

        <!-- Step 2: OTP verification -->
        <div id="otp-step" class="hidden">
          <form id="otp-form" class="space-y-4" novalidate>
            <div>
              <p class="text-sm text-fc-slate/70 mb-1.5">Enter the 4-digit OTP sent to</p>
              <p class="text-sm font-semibold mb-4" id="otp-target-email"></p>
              <label for="login-otp" class="block text-sm font-medium mb-1.5">OTP</label>
              <input id="login-otp" name="otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" required autocomplete="one-time-code"
                class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm tracking-[0.5em] text-center font-mono outline-none focus:border-fc-green transition-colors" placeholder="••••" />
              <p class="text-xs text-red-500 mt-1 hidden" data-error-for="otp">Incorrect OTP. Please try again.</p>
            </div>
            <button type="submit" class="w-full bg-fc-green text-white font-medium py-2.5 rounded-xl hover:bg-fc-greendark transition-colors">
              Verify OTP
            </button>
            <button type="button" id="change-email" class="w-full text-sm font-medium text-fc-slate/70 hover:text-fc-charcoal transition-colors">
              Change email
            </button>
          </form>
        </div>

        <div class="mt-7 rounded-2xl border border-fc-wheat/40 bg-amber-50/50 p-4">
          <div class="flex items-center gap-2 mb-2.5">
            <i data-lucide="sparkles" class="w-4 h-4 text-fc-wheat"></i>
            <span class="text-sm font-semibold">Demo Login</span>
          </div>
          <p class="text-xs text-fc-slate/70 mb-3">Enter any valid-looking email, then use this demo OTP to sign in — no real account or SMS needed.</p>
          <div class="text-xs bg-white rounded-lg border border-fc-line p-3 space-y-1 font-mono">
            <div>Demo OTP: <strong>1234</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function attachLoginPage(router) {
  const emailStep = document.getElementById('email-step');
  const otpStep = document.getElementById('otp-step');
  const emailForm = document.getElementById('email-form');
  const otpForm = document.getElementById('otp-form');
  const otpTargetEmail = document.getElementById('otp-target-email');
  const otpInput = document.getElementById('login-otp');

  let pendingEmail = '';

  function showOtpStep(email) {
    pendingEmail = email;
    otpTargetEmail.textContent = email;
    emailStep.classList.add('hidden');
    otpStep.classList.remove('hidden');
    otpForm.querySelector('[data-error-for="otp"]').classList.add('hidden');
    otpForm.reset();
    otpInput.focus();
  }

  function showEmailStep() {
    pendingEmail = '';
    otpStep.classList.add('hidden');
    emailStep.classList.remove('hidden');
  }

  document.getElementById('change-email')?.addEventListener('click', () => {
    showEmailStep();
  });

  emailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(emailForm);
    const email = String(data.get('email') || '').trim();
    const emailErr = emailForm.querySelector('[data-error-for="email"]');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailErr.classList.remove('hidden');
      return;
    }
    emailErr.classList.add('hidden');

    try { await authService.sendOtp(email); toast(`OTP sent to ${email}`); } catch (err) { toast(err.message || 'Could not send OTP', {type:'error'}); return; }
    showOtpStep(email);
  });

  otpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(otpForm);
    const otp = String(data.get('otp') || '').trim();
    const otpErr = otpForm.querySelector('[data-error-for="otp"]');

    const result = await authService.verifyOtp(pendingEmail, otp);
    if (result.ok) {
      otpErr.classList.add('hidden');
      toast('Welcome back!');
      window.location.hash = '#/';
    } else {
      otpErr.textContent = result.error;
      otpErr.classList.remove('hidden');
    }
  });
}

/* ============================= HOME ============================= */
export function homePage() {
  const featured = productService.list().slice(0, 8);
  return `
  <section class="relative overflow-hidden bg-fc-charcoal text-white">
    <div class="absolute inset-0">
      <img src="assets/products/collector-field.jpeg" class="w-full h-full object-cover opacity-40" alt="" />
      <div class="absolute inset-0 bg-gradient-to-r from-fc-charcoal via-fc-charcoal/85 to-fc-charcoal/40"></div>
    </div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fc-wheat mb-5">
          <i data-lucide="leaf" class="w-3.5 h-3.5"></i> Agricultural Machinery
        </span>
        <h1 class="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] mb-6">
          Powering Smarter<br class="hidden sm:block" /> Grain Handling
        </h1>
        <p class="text-white/70 text-base sm:text-lg max-w-lg mb-9 leading-relaxed">
          Reliable grain transferring, collecting and bagging solutions engineered for farms, mills and agricultural businesses.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="#/shop" class="bg-fc-green hover:bg-fc-greendark transition-colors text-white font-medium px-6 py-3 rounded-full">Explore Products</a>
          <a href="#/contact" class="border border-white/25 hover:border-white/60 transition-colors text-white font-medium px-6 py-3 rounded-full">Get in Touch</a>
        </div>
      </div>
      <div class="hidden lg:block reveal">
        <div class="relative rounded-3xl overflow-hidden shadow-soft border border-white/10">
          <img src="assets/products/pipe-studio-1.jpeg" alt="Farm Craft grain transfer machine" class="w-full h-[420px] object-cover" />
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-10">
    <div class="bg-white rounded-2xl shadow-soft border border-fc-line grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-fc-line overflow-hidden">
      ${HIGHLIGHTS.map(h => `
        <div class="p-5 sm:p-6 flex flex-col items-start gap-2">
          <div class="w-9 h-9 rounded-lg bg-fc-greenlight flex items-center justify-center">
            <i data-lucide="${h.icon}" class="w-4.5 h-4.5 text-fc-green"></i>
          </div>
          <div class="font-display font-semibold text-lg">${h.value}</div>
          <div class="text-xs text-fc-slate/60 leading-snug">${h.label}</div>
        </div>`).join('')}
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
    <div class="flex items-end justify-between mb-10">
      <div>
        <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">Browse by category</span>
        <h2 class="font-display text-2xl sm:text-3xl font-semibold mt-2">What are you looking for?</h2>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      ${CATEGORIES.map(c => `
        <a href="#/shop?category=${c.id}" class="reveal group relative rounded-2xl overflow-hidden aspect-square border border-fc-line">
          <img src="${c.img}" alt="${c.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-fc-charcoal/85 via-fc-charcoal/10 to-transparent"></div>
          <div class="absolute bottom-0 p-3 sm:p-4">
            <span class="text-white text-sm font-medium leading-tight block">${c.name}</span>
          </div>
        </a>`).join('')}
    </div>
  </section>

  <section class="bg-fc-greenlight/60 py-20 sm:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between mb-10">
        <div>
          <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">Featured</span>
          <h2 class="font-display text-2xl sm:text-3xl font-semibold mt-2">Popular grain machinery</h2>
        </div>
        <a href="#/shop" class="hidden sm:inline-flex text-sm font-medium text-fc-green hover:text-fc-greendark items-center gap-1">
          View all <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </a>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        ${featured.length ? featured.map(p => productCard(p)).join('') : (
          productService.error
            ? `<div class="col-span-full text-center py-10 text-sm text-fc-slate/60">Could not load products right now. Please refresh the page.</div>`
            : `<div class="col-span-full text-center py-10 text-sm text-fc-slate/60">No products available yet.</div>`
        )}
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
    <div class="reveal order-2 lg:order-1 rounded-3xl overflow-hidden border border-fc-line shadow-card">
      <img src="assets/products/pipe-mounted-1.jpeg" alt="Farm Craft machine in use" class="w-full h-[380px] object-cover" />
    </div>
    <div class="order-1 lg:order-2">
      <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">About Farm Craft</span>
      <h2 class="font-display text-2xl sm:text-3xl font-semibold mt-2 mb-5">Built for Better Grain Handling</h2>
      <p class="text-fc-slate/75 leading-relaxed mb-7">
        Farm Craft designs agricultural machinery and grain handling equipment for farms, mills and agri-businesses that need
        dependable performance in the field, not just on a spec sheet.
      </p>
      <ul class="space-y-3.5 mb-8">
        ${['Quality components built for daily use','Reliable performance across grain types','Efficient handling from field to store','Practical solutions sized to your operation','Support you can reach when it matters']
          .map(t => `<li class="flex items-start gap-3 text-sm text-fc-slate/85">
            <i data-lucide="check" class="w-4 h-4 text-fc-green mt-0.5 shrink-0"></i>${t}
          </li>`).join('')}
      </ul>
      <a href="#/about" class="inline-flex items-center gap-2 text-sm font-medium text-fc-green hover:text-fc-greendark">
        Learn more about us <i data-lucide="arrow-right" class="w-4 h-4"></i>
      </a>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
    <div class="rounded-3xl bg-fc-charcoal text-white px-6 sm:px-14 py-14 sm:py-16 grid lg:grid-cols-2 gap-8 items-center overflow-hidden relative">
      <div class="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-fc-green/20 blur-2xl"></div>
      <div class="relative">
        <h2 class="font-display text-2xl sm:text-3xl font-semibold mb-3">Want to see our machinery in action?</h2>
        <p class="text-white/65 max-w-md">Visit Farm Craft to see the range up close before you decide.</p>
      </div>
      <div class="relative flex lg:justify-end">
        <a href="#/about" class="bg-fc-wheat hover:brightness-95 transition-all text-fc-charcoal font-semibold px-6 py-3 rounded-full">Visit Our Company</a>
      </div>
    </div>
  </section>`;
}

/* ============================= SHOP / PRODUCTS ============================= */
export function shopPage({ q = '', category = '', availability = '' } = {}) {
  const results = productService.search(q, { category, availability });
  return `
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
    <div class="mb-8">
      <h1 class="font-display text-2xl sm:text-3xl font-semibold">Products</h1>
      <p class="text-sm text-fc-slate/60 mt-1">${results.length} result${results.length === 1 ? '' : 's'}${q ? ` for "${q}"` : ''}</p>
    </div>

    <div class="flex gap-8">
      <aside class="hidden lg:block w-64 shrink-0">
        ${filterPanel({ category, availability })}
      </aside>

      <div class="flex-1 min-w-0">
        <div class="flex lg:hidden items-center gap-3 mb-5">
          <button id="open-filters" class="flex-1 flex items-center justify-center gap-2 border border-fc-line rounded-xl py-2.5 text-sm font-medium">
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Filters
          </button>
        </div>

        <div id="results-grid" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          ${results.length ? results.map(p => productCard(p)).join('') : ''}
        </div>
        ${!results.length ? (
          productService.error ? emptyState({
            icon: 'wifi-off',
            title: 'Could not load products',
            body: productService.error,
            actionHref: '#/shop',
            actionLabel: 'Try Again',
          }) : (q || category || availability) ? emptyState({
            icon: 'search-x',
            title: 'No matching products',
            body: 'Try a different search term or clear your filters to see the full catalog.',
            actionHref: '#/shop',
            actionLabel: 'Clear filters',
          }) : emptyState({
            icon: 'package-open',
            title: 'No products available',
            body: 'Check back soon — new products will appear here as soon as they are added.',
          })
        ) : ''}
      </div>
    </div>
  </div>

  <div id="filter-drawer" class="hidden fixed inset-0 z-50 lg:hidden">
    <div class="absolute inset-0 bg-black/40 modal-backdrop" data-close-drawer></div>
    <div class="sheet-enter absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto thin-scroll">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display font-semibold text-lg">Filters</h3>
        <button data-close-drawer aria-label="Close filters" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-fc-offwhite">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      ${filterPanel({ category, availability })}
    </div>
  </div>`;
}

function filterPanel({ category, availability }) {
  return `
  <form id="filter-form" class="space-y-7">
    <div>
      <h4 class="text-sm font-semibold mb-3">Category</h4>
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm text-fc-slate/80 cursor-pointer">
          <input type="radio" name="category" value="" class="accent-fc-green" ${!category ? 'checked' : ''} /> All categories
        </label>
        ${CATEGORIES.map(c => `
          <label class="flex items-center gap-2 text-sm text-fc-slate/80 cursor-pointer">
            <input type="radio" name="category" value="${c.id}" class="accent-fc-green" ${category === c.id ? 'checked' : ''} /> ${c.name}
          </label>`).join('')}
      </div>
    </div>
    <div>
      <h4 class="text-sm font-semibold mb-3">Availability</h4>
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm text-fc-slate/80 cursor-pointer">
          <input type="radio" name="availability" value="" class="accent-fc-green" ${!availability ? 'checked' : ''} /> Any
        </label>
        <label class="flex items-center gap-2 text-sm text-fc-slate/80 cursor-pointer">
          <input type="radio" name="availability" value="in-stock" class="accent-fc-green" ${availability === 'in-stock' ? 'checked' : ''} /> In Stock
        </label>
        <label class="flex items-center gap-2 text-sm text-fc-slate/80 cursor-pointer">
          <input type="radio" name="availability" value="low-stock" class="accent-fc-green" ${availability === 'low-stock' ? 'checked' : ''} /> Low Stock
        </label>
      </div>
    </div>
    <div>
      <h4 class="text-sm font-semibold mb-3">Capacity &amp; Motor</h4>
      <p class="text-xs text-fc-slate/60 leading-relaxed">5 HP – 16 HP motor range · up to 18 tons/hour transfer capacity across the range.</p>
    </div>
    <button type="submit" class="w-full bg-fc-green text-white text-sm font-medium py-2.5 rounded-xl hover:bg-fc-greendark transition-colors">Apply Filters</button>
  </form>`;
}

export function attachShopPage(currentParams) {
  const openBtn = document.getElementById('open-filters');
  const drawer = document.getElementById('filter-drawer');
  openBtn?.addEventListener('click', () => drawer.classList.remove('hidden'));
  drawer?.querySelectorAll('[data-close-drawer]').forEach(el => el.addEventListener('click', () => drawer.classList.add('hidden')));

  document.querySelectorAll('#filter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const params = new URLSearchParams();
      if (currentParams.q) params.set('q', currentParams.q);
      const category = data.get('category');
      const availability = data.get('availability');
      if (category) params.set('category', category);
      if (availability) params.set('availability', availability);
      window.location.hash = `#/shop?${params.toString()}`;
    });
  });
}

/* ============================= PRODUCT DETAIL ============================= */
export function productDetailPage(slug) {
  const p = productService.bySlug(slug);
  if (!p) {
    return `<div class="max-w-3xl mx-auto px-4 py-24">${emptyState({
      icon: 'package-x', title: 'Product not found', body: 'This product may have been removed or the link is incorrect.',
      actionHref: '#/shop', actionLabel: 'Back to Products',
    })}</div>`;
  }
  const wishlisted = customerService.getWishlist().includes(p.id);

  return `
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <nav class="text-xs text-fc-slate/60 mb-6 flex items-center gap-1.5">
      <a href="#/shop" class="hover:text-fc-green">Products</a> <span>/</span> <span class="text-fc-charcoal">${p.name}</span>
    </nav>

    <div class="grid lg:grid-cols-2 gap-10 mb-16">
      <div>
        <div class="zoom-wrap rounded-2xl overflow-hidden border border-fc-line aspect-[4/3] bg-fc-greenlight mb-3" id="gallery-main">
          ${imgWithFallback(p.images[0], p.name, 'w-full h-full object-cover').replace('<img ', '<img data-gallery-image ')}
        </div>
        <div class="grid grid-cols-3 gap-3">
          ${p.images.map((img, i) => `
            <button data-thumb="${img}" class="rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-fc-green' : 'border-transparent'} aspect-square bg-fc-greenlight">
              ${imgWithFallback(img, `${p.name} view ${i+1}`, 'w-full h-full object-cover')}
            </button>`).join('')}
        </div>
      </div>

      <div>
        <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">${p.category.replace(/-/g,' ')}</span>
        <h1 class="font-display text-2xl sm:text-3xl font-semibold mt-2 mb-3">${p.name}</h1>
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center gap-1 text-fc-wheat">
            ${p.rating ? Array.from({length:5}).map((_,i) => `<i data-lucide="star" class="w-4 h-4 ${i < Math.round(p.rating) ? 'fill-fc-wheat' : ''}"></i>`).join('') : ''}
          </div>
          ${p.rating ? `<span class="text-sm text-fc-slate/60">${p.rating} (${p.reviews} reviews)</span>` : ''}
        </div>
        <p class="text-fc-slate/75 leading-relaxed mb-5">${p.description}</p>

        <div class="flex items-center gap-3 mb-6">
          ${stockBadge(p.stockStatus)}
          ${priceBlock(p, { size: 'font-display text-2xl font-semibold' })}
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mb-3">
          <button data-cart-add="${p.id}" ${p.stockStatus === 'Out of Stock' ? 'disabled' : ''} class="flex-1 border border-fc-green text-fc-green font-medium py-3 rounded-xl hover:bg-fc-greenlight transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">Add to Cart</button>
          <button data-getcode="${p.id}" ${p.stockStatus === 'Out of Stock' ? 'disabled' : ''} class="flex-1 bg-fc-green text-white font-medium py-3 rounded-xl hover:bg-fc-greendark transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-fc-green">Get a Code</button>
          <button data-wishlist="${p.id}" aria-pressed="${wishlisted}" class="w-12 h-12 shrink-0 self-center sm:self-auto border border-fc-line rounded-xl flex items-center justify-center hover:border-fc-wheat transition-colors">
            <i data-lucide="heart" class="w-5 h-5 ${wishlisted ? 'text-fc-wheat fill-fc-wheat' : ''}"></i>
          </button>
        </div>
        ${p.stockStatus === 'Out of Stock' ? `<p class="text-xs text-red-600 mb-3 -mt-1">This product is currently out of stock and cannot be purchased right now.</p>` : ''}
        <div class="mb-6">
          <a href="#/contact" class="block text-center border border-fc-line font-medium py-3 rounded-xl hover:border-fc-green hover:text-fc-green transition-colors">Contact Farm Craft</a>
        </div>

        <div class="grid grid-cols-2 gap-3">
          ${p.specifications.slice(0,4).map(s => `
            <div class="rounded-xl border border-fc-line p-3.5">
              <div class="text-[11px] text-fc-slate/55 uppercase tracking-wide mb-1">${s.label}</div>
              <div class="text-sm font-medium">${s.value}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-10">
      <div class="lg:col-span-2 space-y-10">
        <section>
          <h2 class="font-display text-xl font-semibold mb-3">Product Overview</h2>
          <p class="text-fc-slate/75 leading-relaxed">${p.description} Designed for consistent, dependable operation across daily agricultural and industrial workloads.</p>
        </section>
        <section>
          <h2 class="font-display text-xl font-semibold mb-4">Technical Specifications</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            ${p.specifications.map(s => `
              <div class="flex items-center justify-between rounded-xl bg-fc-offwhite px-4 py-3 text-sm">
                <span class="text-fc-slate/60">${s.label}</span><span class="font-medium">${s.value}</span>
              </div>`).join('')}
          </div>
        </section>
        <section>
          <h2 class="font-display text-xl font-semibold mb-4">Features</h2>
          <ul class="grid sm:grid-cols-2 gap-3">
            ${p.features.map(f => `<li class="flex items-start gap-2.5 text-sm text-fc-slate/80"><i data-lucide="check" class="w-4 h-4 text-fc-green mt-0.5 shrink-0"></i>${f}</li>`).join('')}
          </ul>
        </section>
        <section>
          <h2 class="font-display text-xl font-semibold mb-4">Applications</h2>
          <div class="flex flex-wrap gap-2">
            ${p.applications.map(a => `<span class="text-sm bg-fc-greenlight text-fc-green font-medium px-3.5 py-1.5 rounded-full">${a}</span>`).join('')}
          </div>
        </section>
      </div>

      <aside>
        <div class="rounded-2xl border border-fc-line p-5 sticky top-24">
          <h3 class="font-display font-semibold mb-3">Need help choosing?</h3>
          <p class="text-sm text-fc-slate/70 mb-4">Talk to Farm Craft about the right configuration for your farm or mill.</p>
          <a href="#/contact" class="block text-center border border-fc-line font-medium py-2.5 rounded-xl hover:border-fc-green hover:text-fc-green transition-colors">Contact Farm Craft</a>
        </div>
      </aside>
    </div>
  </div>`;
}

export function attachProductDetailPage() {
  const mainImg = document.querySelector('#gallery-main img');
  document.querySelectorAll('[data-thumb]').forEach(btn => {
    btn.addEventListener('click', () => {
      mainImg.src = btn.getAttribute('data-thumb');
      document.querySelectorAll('[data-thumb]').forEach(b => b.classList.remove('border-fc-green'));
      document.querySelectorAll('[data-thumb]').forEach(b => b.classList.add('border-transparent'));
      btn.classList.remove('border-transparent');
      btn.classList.add('border-fc-green');
    });
  });
}

/* ============================= WISHLIST ============================= */
export function wishlistPage() {
  const ids = customerService.getWishlist();
  const items = productService.list().filter(p => ids.includes(p.id));
  return `
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
    <h1 class="font-display text-2xl sm:text-3xl font-semibold mb-8">Wishlist</h1>
    ${items.length ? `<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">${items.map(p => productCard(p, { showRemoveFromFavorites: true })).join('')}</div>`
      : emptyState({ icon: 'heart', title: 'Your wishlist is empty', body: 'Save products you like and find them here later.', actionHref: '#/shop', actionLabel: 'Browse Products' })}
  </div>`;
}


/* ============================= CART ============================= */
function cartRow(i) {
  const listPrice = Number(i.product.price ?? 0);
  const unitPrice = Number(i.product.discount_price ?? i.product.price ?? 0);
  const hasDiscount = i.product.discount_price != null && Number(i.product.discount_price) < listPrice;
  const priceHtml = hasDiscount
    ? `<span>₹${unitPrice.toLocaleString('en-IN')}</span> <span class="line-through text-fc-slate/40">₹${listPrice.toLocaleString('en-IN')}</span>`
    : `<span>₹${unitPrice.toLocaleString('en-IN')}</span>`;
  return `<div class="bg-white border border-fc-line rounded-2xl p-4 flex gap-4 items-center">${imgWithFallback(i.product.image || 'assets/products/collector-diagram.jpeg', i.product.name, 'w-20 h-20 rounded-xl object-cover')}<div class="flex-1"><div class="font-semibold">${i.product.name}</div><div class="text-sm text-fc-slate/60 flex items-center gap-2">${priceHtml}</div><div class="flex items-center gap-2 mt-2"><button data-cart-dec="${i.id}" class="w-8 h-8 border rounded-lg">−</button><span>${i.quantity}</span><button data-cart-inc="${i.id}" class="w-8 h-8 border rounded-lg">+</button><button data-cart-remove="${i.id}" class="ml-3 text-sm text-red-600">Remove</button></div></div><div class="font-semibold">₹${(unitPrice * i.quantity).toLocaleString('en-IN')}</div></div>`;
}

// The two supported order-completion methods at checkout. 'delivery' is
// the existing Cash on Delivery flow; 'visit_company' is new — the
// customer visits the company to complete the purchase/payment in
// person. Neither is an online payment method.
const CART_ORDER_METHODS = [
  { value: 'delivery', label: 'Cash on Delivery', desc: 'Pay in cash when your order is delivered.' },
  { value: 'visit_company', label: 'Visit Company', desc: 'Visit our office to complete the purchase in person.' },
];

function orderMethodOptionsHtml() {
  return CART_ORDER_METHODS.map((m, idx) => `
    <label class="flex items-start gap-2.5 border border-fc-line rounded-xl px-3.5 py-3 text-sm cursor-pointer has-[:checked]:border-fc-green has-[:checked]:bg-fc-greenlight/40">
      <input type="radio" name="cart-order-method" value="${m.value}" class="mt-0.5" ${idx === 0 ? 'checked' : ''} />
      <span><span class="font-medium block">${m.label}</span><span class="text-xs text-fc-slate/60">${m.desc}</span></span>
    </label>`).join('');
}

// Human-readable label for an order's method, derived from the backend's
// `order_method` field ('delivery' | 'visit_company').
export function orderMethodLabel(o) {
  return o?.order_method === 'visit_company' ? 'Visit Company' : (o?.payment_method || 'Cash on Delivery');
}

export async function cartPage() {
  if (!authService.isLoggedIn()) return loggedOutNotice('view your cart');
  try {
    const cart = await cartService.get();
    return `<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14"><h1 class="font-display text-2xl sm:text-3xl font-semibold mb-8">Cart</h1>${cart.items.length ? `<div class="space-y-4">${cart.items.map(cartRow).join('')}</div><div class="mt-8 rounded-2xl border border-fc-line bg-white p-5"><h3 class="font-display font-semibold mb-4">Checkout</h3><div class="grid sm:grid-cols-2 gap-3"><input id="cart-line1" class="border rounded-xl px-3 py-2.5 text-sm" placeholder="Delivery address" /><input id="cart-city" class="border rounded-xl px-3 py-2.5 text-sm" placeholder="City" /><input id="cart-state" class="border rounded-xl px-3 py-2.5 text-sm" placeholder="State" /><input id="cart-pincode" class="border rounded-xl px-3 py-2.5 text-sm" placeholder="Pincode" /></div><div class="mt-4"><div class="text-sm font-medium mb-2">Order Method</div><div class="grid sm:grid-cols-2 gap-3">${orderMethodOptionsHtml()}</div></div><div class="mt-5 flex justify-end items-center gap-6"><div class="font-display text-xl font-semibold">Total ₹${Number(cart.total).toLocaleString('en-IN')}</div><button id="cart-checkout" class="bg-fc-green text-white px-5 py-3 rounded-xl font-medium">Place Order</button></div></div>` : emptyState({icon:'shopping-cart',title:'Your cart is empty',body:'Add products to your cart to continue.',actionHref:'#/shop',actionLabel:'Browse Products'})}</div>`;
  } catch(e) { return `<div class="max-w-xl mx-auto px-4 py-24 text-center">Unable to load cart.</div>`; }
}

export function attachCartPage(){
  document.querySelectorAll('[data-cart-remove]').forEach(b=>b.addEventListener('click',async()=>{await cartService.remove(b.dataset.cartRemove); window.location.hash='#/cart';}));
  document.querySelectorAll('[data-cart-inc],[data-cart-dec]').forEach(b=>b.addEventListener('click',async()=>{const item=(await cartService.get()).items.find(x=>x.id===b.dataset.cartInc||x.id===b.dataset.cartDec); if(!item)return; const q=Math.max(1,item.quantity+(b.dataset.cartInc?1:-1)); await cartService.update(item.id,q); window.location.hash='#/cart';}));
  document.getElementById('cart-checkout')?.addEventListener('click',async()=>{ const address={line1:document.getElementById('cart-line1')?.value.trim(),city:document.getElementById('cart-city')?.value.trim(),state:document.getElementById('cart-state')?.value.trim(),pincode:document.getElementById('cart-pincode')?.value.trim()}; if(!address.line1||!address.city||!address.state||!address.pincode){toast('Please complete the delivery address',{type:'error'});return;} const orderMethod=document.querySelector('input[name="cart-order-method"]:checked')?.value||'delivery'; try{const o=await orderService.create({customer:authService.getSession(),address,orderMethod}); window.location.hash=`#/success/${o.order_number||o.id}`;}catch(e){toast(e.message||'Could not create order',{type:'error'});} });
}
/* ============================= ORDERS ============================= */
const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Processing: 'bg-indigo-50 text-indigo-700',
  Dispatched: 'bg-purple-50 text-purple-700',
  Delivered: 'bg-fc-greenlight text-fc-green',
  Cancelled: 'bg-red-50 text-red-600',
};

export function ordersPage() {
  if (!authService.isLoggedIn()) return loggedOutNotice('view your orders');
  const orders = orderService.list();
  return `
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
    <h1 class="font-display text-2xl sm:text-3xl font-semibold mb-8">My Orders</h1>
    ${orders.length ? `
      <div class="space-y-4">
        ${orders.map(o => `
          <a href="#/order/${(o.order_number || o.id)}" class="block bg-white border border-fc-line rounded-2xl p-5 hover:border-fc-green transition-colors">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div class="font-display font-semibold">${(o.items?.[0]?.product_name || "Order")}</div>
                <div class="text-xs text-fc-slate/55">Order ${(o.order_number || o.id)} · ${new Date(o.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100'}">${o.status}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-fc-slate/70">
              <span>Code: <strong class="text-fc-charcoal font-mono">${o.purchase_code}</strong></span>
              <span>Qty: ${(o.items?.reduce((n,i)=>n+i.quantity,0) || 0)}</span>
              <span>${orderMethodLabel(o)}</span>
              <span>${o.total_amount ? '₹' + Number(o.total_amount).toLocaleString('en-IN') : 'Contact for Price'}</span>
            </div>
          </a>`).join('')}
      </div>`
      : emptyState({ icon: 'receipt', title: 'No orders yet', body: 'Once you get a purchase code, your orders will show up here.', actionHref: '#/shop', actionLabel: 'Browse Products' })}
  </div>`;
}

export function orderDetailPage(orderId) {
  const o = orderService.byId(orderId);
  if (!o) return `<div class="max-w-3xl mx-auto px-4 py-24">${emptyState({ icon: 'file-question', title: 'Order not found', body: 'We could not find this order.', actionHref: '#/orders', actionLabel: 'Back to Orders' })}</div>`;
  return successOrderCard(o, { compact: true });
}

function loggedOutNotice(action) {
  return `<div class="max-w-3xl mx-auto px-4 py-24">${emptyState({
    icon: 'lock', title: 'Please log in', body: `Log in to ${action}.`, actionHref: '#/login', actionLabel: 'Go to Login',
  })}</div>`;
}

/* Shared order summary card used by success page and order detail page */
export function successOrderCard(o, { compact = false } = {}) {
  return `
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    ${!compact ? `
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-full bg-fc-greenlight flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check" class="w-8 h-8 text-fc-green"></i>
        </div>
        <h1 class="font-display text-2xl font-semibold mb-1.5">Purchase Request Submitted</h1>
        <p class="text-sm text-fc-slate/65">Your Farm Craft purchase request has been successfully submitted.</p>
      </div>` : ''}

    <div class="bg-fc-charcoal text-white rounded-2xl p-6 mb-5 text-center">
      <div class="text-xs uppercase tracking-wide text-white/50 mb-2">Your Farm Craft Purchase Code</div>
      <div class="font-display text-3xl font-bold tracking-wider">${o.purchase_code}</div>
    </div>

    <div class="bg-white border border-fc-line rounded-2xl p-6 mb-5 space-y-4">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Order ID</div><div class="font-medium">${(o.order_number || o.id)}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Status</div><span class="text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100'}">${o.status}</span></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Customer</div><div class="font-medium">${(o.customer_snapshot?.name || "")}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Product</div><div class="font-medium">${(o.items?.[0]?.product_name || "Order")}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Quantity</div><div class="font-medium">${(o.items?.reduce((n,i)=>n+i.quantity,0) || 0)}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Order Method</div><div class="font-medium">${orderMethodLabel(o)}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Date</div><div class="font-medium">${new Date(o.created_at).toLocaleDateString('en-IN')}</div></div>
        <div><div class="text-fc-slate/50 text-xs mb-0.5">Address</div><div class="font-medium">${(o.shipping_address?.city || "") || ''}, ${(o.shipping_address?.state || "") || ''}</div></div>
      </div>
      <p class="text-sm text-fc-slate/60 pt-2 border-t border-fc-line">Our team will contact you regarding the order and delivery.</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <button id="download-invoice" data-order="${(o.order_number || o.id)}" class="flex-1 border border-fc-line font-medium py-2.5 rounded-xl hover:border-fc-green hover:text-fc-green transition-colors flex items-center justify-center gap-2">
        <i data-lucide="download" class="w-4 h-4"></i> Download Invoice
      </button>
      <a href="#/order/${(o.order_number || o.id)}" class="flex-1 text-center border border-fc-line font-medium py-2.5 rounded-xl hover:border-fc-green hover:text-fc-green transition-colors">View Order</a>
      <a href="#/shop" class="flex-1 text-center bg-fc-green text-white font-medium py-2.5 rounded-xl hover:bg-fc-greendark transition-colors">Continue Shopping</a>
    </div>
  </div>`;
}

export function attachOrderCardPage() {
  const btn = document.getElementById('download-invoice');
  btn?.addEventListener('click', async (e) => {
    const id = e.currentTarget.getAttribute('data-order');
    const order = orderService.byId(id);
    if (!order) { toast('Order not found', { type: 'error' }); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Preparing invoice…`;
    icons();
    try {
      await invoiceService.downloadInvoice(order);
      toast('Invoice downloaded');
    } catch (err) {
      toast('Could not generate the invoice — please try again', { type: 'error' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
      icons();
    }
  });
}

/* ============================= PROFILE ============================= */
export function profilePage() {
  if (!authService.isLoggedIn()) return loggedOutNotice('view your profile');
  const profile = customerService.getProfile();
  const orders = orderService.list();
  return `
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
    <div class="flex items-center gap-4 mb-10">
      <div class="w-16 h-16 rounded-full bg-fc-green text-white flex items-center justify-center font-display text-xl font-semibold shrink-0">
        ${profile.name.split(' ').map(n => n[0]).join('').slice(0,2)}
      </div>
      <div>
        <h1 class="font-display text-xl sm:text-2xl font-semibold">${profile.name}</h1>
        <p class="text-sm text-fc-slate/60">${profile.email}</p>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-5 mb-8">
      <div class="bg-white border border-fc-line rounded-2xl p-5">
        <h3 class="font-display font-semibold mb-4 flex items-center gap-2"><i data-lucide="id-card" class="w-4 h-4 text-fc-green"></i> Personal Information</h3>
        <dl class="space-y-2.5 text-sm">
          <div class="flex justify-between"><dt class="text-fc-slate/55">Name</dt><dd class="font-medium">${profile.name}</dd></div>
          <div class="flex justify-between"><dt class="text-fc-slate/55">Email</dt><dd class="font-medium">${profile.email}</dd></div>
          <div class="flex justify-between"><dt class="text-fc-slate/55">Mobile</dt><dd class="font-medium">${profile.mobile}</dd></div>
        </dl>
      </div>
      <div class="bg-white border border-fc-line rounded-2xl p-5">
        <h3 class="font-display font-semibold mb-4 flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-fc-green"></i> Saved Addresses</h3>
        ${profile.addresses.length ? `
          <ul class="space-y-3 text-sm">
            ${profile.addresses.map(a => `<li class="border-b border-fc-line/70 pb-2.5 last:border-0 last:pb-0">${a.line1}, ${a.city}, ${a.state} ${a.pincode}</li>`).join('')}
          </ul>`
        : `<p class="text-sm text-fc-slate/55">No saved addresses yet — one is saved automatically the first time you get a purchase code.</p>`}
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-5 mb-8">
      <a href="#/orders" class="bg-white border border-fc-line rounded-2xl p-5 flex items-center justify-between hover:border-fc-green transition-colors">
        <div>
          <h3 class="font-display font-semibold mb-1">Order History</h3>
          <p class="text-sm text-fc-slate/55">${orders.length} order${orders.length === 1 ? '' : 's'}</p>
        </div>
        <i data-lucide="arrow-right" class="w-5 h-5 text-fc-slate/40"></i>
      </a>
      <a href="#/orders" class="bg-white border border-fc-line rounded-2xl p-5 flex items-center justify-between hover:border-fc-green transition-colors">
        <div>
          <h3 class="font-display font-semibold mb-1">Purchase Codes</h3>
          <p class="text-sm text-fc-slate/55">View all generated codes</p>
        </div>
        <i data-lucide="arrow-right" class="w-5 h-5 text-fc-slate/40"></i>
      </a>
    </div>

    <button id="logout-btn" class="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2">
      <i data-lucide="log-out" class="w-4 h-4"></i> Logout
    </button>
  </div>`;
}

export function attachProfilePage() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    authService.logout();
    toast('Logged out');
    window.location.hash = '#/';
  });
}

/* ============================= ABOUT ============================= */
export function aboutPage() {
  return `
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
    <div class="grid lg:grid-cols-2 gap-12 items-center mb-20">
      <div>
        <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">About Farm Craft</span>
        <h1 class="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-5">Built for Better Grain Handling</h1>
        <p class="text-fc-slate/75 leading-relaxed mb-4">
          Farm Craft focuses on one thing: agricultural machinery and grain handling solutions that hold up to real, daily
          farm and mill use. Every product is built around practical performance — capacity, motor options and pipe lengths
          sized to fit different operations.
        </p>
        <p class="text-fc-slate/75 leading-relaxed">
          From transferring and collecting to bagging, our range covers the full grain handling chain, engineered for
          efficiency and durability.
        </p>
      </div>
      <div class="rounded-3xl overflow-hidden border border-fc-line shadow-card">
        <img src="assets/products/collector-diagram.jpeg" alt="Farm Craft applications across grain types" class="w-full h-[380px] object-cover" />
      </div>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-20">
      ${[
        ['shield-check','Quality','Components and builds chosen for daily agricultural use.'],
        ['gauge','Reliability','Consistent performance across grain types and conditions.'],
        ['move-horizontal','Efficient Handling','From field and truck to store, with less manual effort.'],
        ['settings-2','Practical Solutions','Configurations sized to your farm, mill or business.'],
        ['headphones','Customer Support','Our team is reachable when you need guidance.'],
      ].map(([icon,title,body]) => `
        <div class="bg-white border border-fc-line rounded-2xl p-5">
          <div class="w-10 h-10 rounded-lg bg-fc-greenlight flex items-center justify-center mb-3">
            <i data-lucide="${icon}" class="w-5 h-5 text-fc-green"></i>
          </div>
          <h3 class="font-display font-semibold mb-1.5">${title}</h3>
          <p class="text-sm text-fc-slate/65 leading-relaxed">${body}</p>
        </div>`).join('')}
    </div>

    <div class="rounded-3xl bg-fc-charcoal text-white px-6 sm:px-14 py-14 grid lg:grid-cols-2 gap-8 items-center">
      <div>
        <h2 class="font-display text-2xl font-semibold mb-3">Want to see our machinery in action?</h2>
        <p class="text-white/65 max-w-md mb-1">Prefer to visit us? Our team is happy to walk you through the range in person.</p>
        <p class="text-sm text-white/70 mt-1">${COMPANY.address}</p>
      </div>
      <div class="flex lg:justify-end">
        <a href="#/contact" class="bg-fc-wheat hover:brightness-95 transition-all text-fc-charcoal font-semibold px-6 py-3 rounded-full">Visit Our Company</a>
      </div>
    </div>
  </div>`;
}

/* ============================= SERVICES ============================= */
export function servicesPage() {
  return `
  <div class="pb-4">
    <section class="relative overflow-hidden bg-fc-charcoal text-white">
      <div class="absolute inset-0">
        ${imgWithFallback('assets/products/pipe-frame.jpeg', 'Farm Craft machinery service', 'w-full h-full object-cover opacity-35')}
        <div class="absolute inset-0 bg-gradient-to-r from-fc-charcoal via-fc-charcoal/85 to-fc-charcoal/50"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fc-wheat mb-4">
          <i data-lucide="wrench" class="w-3.5 h-3.5"></i> What We Offer
        </span>
        <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-2xl mb-4">Services built around your grain handling operation</h1>
        <p class="text-white/70 max-w-xl leading-relaxed">From choosing the right configuration to on-site setup and after-sales support, Farm Craft stays involved well beyond the purchase.</p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10 mb-4">
      <div class="bg-white rounded-2xl shadow-soft border border-fc-line grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-fc-line overflow-hidden">
        ${SERVICES.map(s => `
          <a href="#service-${s.id}" class="p-4 sm:p-5 flex flex-col items-center text-center gap-2 hover:bg-fc-greenlight/40 transition-colors">
            <div class="w-9 h-9 rounded-lg bg-fc-greenlight flex items-center justify-center">
              <i data-lucide="${s.icon}" class="w-4.5 h-4.5 text-fc-green"></i>
            </div>
            <span class="text-xs font-medium leading-snug">${s.title}</span>
          </a>`).join('')}
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
      ${SERVICES.map((s, i) => serviceSection(s, i)).join('')}
    </div>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div class="rounded-3xl bg-fc-charcoal text-white px-6 sm:px-14 py-14 grid lg:grid-cols-2 gap-8 items-center overflow-hidden relative">
        <div class="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-fc-green/20 blur-2xl"></div>
        <div class="relative">
          <h2 class="font-display text-2xl sm:text-3xl font-semibold mb-3">Not sure which service you need?</h2>
          <p class="text-white/65 max-w-md">Tell our team about your farm, mill or store and we'll point you to the right products and services.</p>
        </div>
        <div class="relative flex flex-wrap gap-3 lg:justify-end">
          <a href="#/contact" class="bg-fc-wheat hover:brightness-95 transition-all text-fc-charcoal font-semibold px-6 py-3 rounded-full">Contact Farm Craft</a>
          <a href="#/shop" class="border border-white/25 hover:border-white/60 transition-colors text-white font-medium px-6 py-3 rounded-full">Browse Products</a>
        </div>
      </div>
    </section>
  </div>`;
}

function serviceSection(s, i) {
  const reversed = i % 2 === 1;
  return `
  <section id="service-${s.id}" class="reveal grid lg:grid-cols-2 gap-10 items-center scroll-mt-24">
    <div class="rounded-3xl overflow-hidden border border-fc-line shadow-card aspect-[4/3] bg-fc-greenlight ${reversed ? 'lg:order-2' : ''}">
      ${imgWithFallback(s.image, s.title, 'w-full h-full object-cover')}
    </div>
    <div class="${reversed ? 'lg:order-1' : ''}">
      <div class="flex items-center gap-2.5 mb-3">
        <div class="w-9 h-9 rounded-lg bg-fc-greenlight flex items-center justify-center shrink-0">
          <i data-lucide="${s.icon}" class="w-4.5 h-4.5 text-fc-green"></i>
        </div>
        <span class="text-xs uppercase tracking-wide text-fc-green font-semibold">Farm Craft Service</span>
      </div>
      <h2 class="font-display text-2xl sm:text-3xl font-semibold mb-2.5">${s.title}</h2>
      <p class="text-sm text-fc-wheat font-medium mb-4">${s.tagline}</p>
      <p class="text-fc-slate/75 leading-relaxed mb-6">${s.description}</p>

      <div class="grid sm:grid-cols-2 gap-6 mb-7">
        <div>
          <h3 class="text-xs uppercase tracking-wide font-semibold text-fc-slate/60 mb-3">Key Benefits</h3>
          <ul class="space-y-2.5">
            ${s.benefits.map(b => `<li class="flex items-start gap-2.5 text-sm text-fc-slate/85">
              <i data-lucide="check" class="w-4 h-4 text-fc-green mt-0.5 shrink-0"></i>${b}
            </li>`).join('')}
          </ul>
        </div>
        <div>
          <h3 class="text-xs uppercase tracking-wide font-semibold text-fc-slate/60 mb-3">How It Works</h3>
          <ol class="space-y-2.5">
            ${s.process.map((step, idx) => `<li class="flex items-start gap-2.5 text-sm text-fc-slate/85">
              <span class="w-5 h-5 rounded-full bg-fc-greenlight text-fc-green text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>${step}
            </li>`).join('')}
          </ol>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <a href="#/shop?category=${s.categoryId}" class="bg-fc-green text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-fc-greendark transition-colors">Explore Related Products</a>
        <a href="#/contact" class="border border-fc-line text-sm font-medium px-5 py-2.5 rounded-full hover:border-fc-green hover:text-fc-green transition-colors">Contact for This Service</a>
      </div>
    </div>
  </section>`;
}

/* ============================= CONTACT ============================= */
export function contactPage() {
  return `
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
    <div class="text-center max-w-xl mx-auto mb-12">
      <h1 class="font-display text-3xl font-semibold mb-3">Get in Touch</h1>
      <p class="text-fc-slate/70">Questions about a product or configuration? Send an enquiry and our team will reach out.</p>
    </div>

    <div class="grid lg:grid-cols-5 gap-10">
      <form id="contact-form" class="lg:col-span-3 bg-white border border-fc-line rounded-2xl p-6 space-y-4" novalidate>
        <div id="contact-form-error" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"></div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" for="c-name">Name</label>
            <input id="c-name" name="name" required class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" for="c-mobile">Mobile</label>
            <input id="c-mobile" name="mobile" required class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5" for="c-email">Email</label>
          <input id="c-email" name="email" type="email" required class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5" for="c-message">Message</label>
          <textarea id="c-message" name="message" rows="4" required class="w-full border border-fc-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fc-green resize-none"></textarea>
        </div>
        <button id="contact-submit" type="submit" class="bg-fc-green text-white font-medium px-6 py-2.5 rounded-xl hover:bg-fc-greendark transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2">
          <span id="contact-submit-label">Send Enquiry</span>
        </button>
      </form>

      <div class="lg:col-span-2 space-y-4">
        <div class="bg-fc-charcoal text-white rounded-2xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <img src="${COMPANY.logo}" class="h-8 w-24 rounded bg-white object-contain p-0.5" alt="Farm Craft" />
            <span class="font-display font-semibold">FARM CRAFT</span>
          </div>
          <div class="space-y-3 text-sm text-white/75">
            <a href="mailto:${COMPANY.email}" class="flex items-start gap-2.5 hover:text-white transition-colors"><i data-lucide="mail" class="w-4 h-4 mt-0.5 shrink-0"></i>${COMPANY.email}</a>
            <a href="tel:+919440436868" class="flex items-start gap-2.5 hover:text-white transition-colors"><i data-lucide="phone" class="w-4 h-4 mt-0.5 shrink-0"></i>${COMPANY.phone}</a>
            <a href="tel:+919490436868" class="flex items-start gap-2.5 hover:text-white transition-colors"><i data-lucide="phone" class="w-4 h-4 mt-0.5 shrink-0"></i>${COMPANY.phone2}</a>
            <a href="https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(COMPANY.whatsappMessage)}" target="_blank" rel="noopener noreferrer" class="flex items-start gap-2.5 hover:text-white transition-colors"><i data-lucide="message-circle" class="w-4 h-4 mt-0.5 shrink-0"></i>WhatsApp Us</a>
            <div class="flex items-start gap-2.5"><i data-lucide="map-pin" class="w-4 h-4 mt-0.5 shrink-0"></i>${COMPANY.address}</div>
          </div>
        </div>
        <div class="border border-fc-line rounded-2xl p-6">
          <div class="text-xs text-fc-slate/55 mb-1">GSTIN</div>
          <div class="font-mono font-medium">${COMPANY.gstin}</div>
        </div>
      </div>
    </div>
  </div>`;
}

export function attachContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const errorBox = document.getElementById('contact-form-error');
  const submitBtn = document.getElementById('contact-submit');
  const submitLabel = document.getElementById('contact-submit-label');
  let submitting = false;

  const showError = (msg) => {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  };
  const hideError = () => errorBox?.classList.add('hidden');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return; // duplicate-submission prevention
    hideError();

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('mobile') || '').trim(),
      message: String(data.get('message') || '').trim(),
    };
    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      showError('Please fill in all fields.');
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending…';

    try {
      const result = await contactService.submit(payload);
      form.reset();
      // `email_sent` is only ever present on this POST response (see
      // backend ContactOut). The enquiry is always safely stored by this
      // point regardless of its value — this only changes which truthful
      // message we show, never whether the submission "succeeded".
      if (result && result.email_sent === false) {
        toast('Your message was received, but email notification could not be sent. Please contact us through WhatsApp or phone.');
      } else {
        toast('Your enquiry has been sent — we\u2019ll be in touch shortly.');
      }
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      submitting = false;
      submitBtn.disabled = false;
      submitLabel.textContent = 'Send Enquiry';
    }
  });
}
