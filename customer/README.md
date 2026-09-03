# Farm Craft — Customer Storefront (Demo Frontend)

A frontend-only, premium e-commerce experience for Farm Craft agricultural
machinery. No backend, no real payments, no real auth — everything runs on
mock data + `localStorage`, structured so a real API can be dropped in later
with minimal changes.

## A note on how this was built

The brief asked for React + TypeScript + Vite + Tailwind. This sandbox has no
network access, so `npm install` (Vite, React, Tailwind, etc.) can't run here.
To still deliver a fully working, premium demo, this was built as a
**dependency-free HTML/CSS/JS single-page app**:

- Plain ES modules (`<script type="module">`) instead of a bundler — no build
  step, just open `index.html` or serve the folder statically.
- Tailwind is loaded via the Play CDN (`cdn.tailwindcss.com`), configured with
  the Farm Craft color/type tokens in `index.html`.
- Lucide icons load via CDN.
- The code is organized the same way the requested React app would be
  (`data`, `services`, `components`/`pages`), specifically so it's a short
  step to port into a real Vite + React + TS project if you want to continue
  there — see **Porting to React** below.

## Run it

No build step required.

```bash
# from the customer/ folder
python3 -m http.server 5173
# open http://localhost:5173
```

Or open `index.html` directly in a browser (module scripts require serving
over http/https in some browsers, so the local server above is recommended).

## Demo login

```
Email:    customer@farmcraft.com
Password: customer123
```

The login page also has "Use Demo Credentials" (fills the form) and "Login as
Demo Customer" (logs in immediately) buttons.

## Folder structure

```
customer/
  index.html          Entry point, Tailwind config, CDN includes
  assets/              Farm Craft logo + product photography
  src/
    styles.css         Supplemental CSS (animations, skeletons, focus states)
    data.js             Mock catalog: products, categories, highlights, company info
    services.js          authService / productService / orderService /
                         customerService / invoiceService — all localStorage-backed
    components.js         Header, footer, product card, toast, empty states, skeletons
    pages.js              Page renderers: login, home, shop, product detail,
                         orders, order detail, success, profile, about, contact
    getCodeModal.js        The "Get a Code" purchase flow (4-step modal)
    main.js               Hash router + global event delegation
```

## Feature coverage

- Customer login with demo credentials + "Login as Customer"
- Modern homepage: hero, capacity highlights, categories, featured products, about teaser, visit-company CTA
- Product catalog with search (name/category/spec/application) and filters (category, availability), desktop sidebar + mobile bottom-sheet
- Product detail pages with gallery, specs, features, applications
- **"Get a Code"** purchase flow (not "Add to Cart"): customer details → address → product/qty/configuration → payment method (Cash on Delivery / Online Payment demo / Visit the Company) → confirm → generated purchase code (e.g. `FC-8X29-KL72`)
- Orders saved to `localStorage` under a shared key, structured so an Admin portal reading the same key sees the same order data (see `orderService.listAll()`)
- Purchase success page with downloadable demo invoice (HTML file), "View Order", "Continue Shopping"
- My Orders, Order detail, Profile (personal info, saved addresses, order history), Wishlist
- About and Contact pages, demo enquiry form
- Responsive from 360px to 1920px, sticky/blurred header, mobile tab bar, toasts, skeletons, empty states, accessible focus states, reduced-motion support

## Data model (JSDoc, mirrors the requested TS interfaces)

See `src/data.js` and `src/services.js` — every record shape (`Product`,
`Order`, `Address`, etc.) is documented inline and matches the interfaces in
the brief.

## Porting to React + Vite + TypeScript later

The three layers below map directly onto the requested React architecture:

- `data.js` → `src/data/*.ts` (typed mock data + `Product`, `Order`, etc. interfaces)
- `services.js` → `src/services/*.ts` (same function signatures; swap the
  `localStorage` calls for `fetch()`/API calls — components never touch
  storage directly today, so this is the only layer that changes)
- `components.js` + `pages.js` → React components/pages, one function per
  export; the JSX would follow the same markup already written here
- `getCodeModal.js` → a `<GetCodeModal>` component with the same step state
- `main.js`'s hash router → `react-router-dom` routes at the same paths
  (`/`, `/shop`, `/product/:slug`, `/order/:id`, `/success/:id`, `/orders`,
  `/profile`, `/about`, `/contact`, `/login`)

No backend, database, real payment gateway, or real auth is included or
implied — this is a demo frontend only.


## Local API
The Customer Vite server runs on port 5174 and proxies `/api` to `http://127.0.0.1:8000`.
Start the FastAPI backend before using login, products, cart, or orders.
