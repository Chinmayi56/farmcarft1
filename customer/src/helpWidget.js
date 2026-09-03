// Farm Craft — Help / AI Copilot widget.
// Frontend-only: no network calls, no backend. Predefined Q&A + keyword
// matching simulate a helpful assistant, plus a one-tap WhatsApp handoff for
// anything it can't answer. Mounted once to <body>, independent of the
// hash router, so it persists across page navigation.

import { COMPANY } from './data.js';

let messages = [];
let isOpen = false;
let isTyping = false;

function whatsappUrl(prefill) {
  const text = encodeURIComponent(prefill || `Hi Farm Craft, I have a question about your products.`);
  return `https://wa.me/${COMPANY.whatsapp}?text=${text}`;
}

/* ---------------- predefined knowledge base ---------------- */
const QUICK_REPLIES = [
  { label: 'Our products', query: 'What products do you sell?' },
  { label: 'Track my order', query: 'How do I track my order?' },
  { label: 'Delivery info', query: 'How does delivery work?' },
  { label: 'Payment options', query: 'What payment methods do you accept?' },
  { label: 'Returns & support', query: 'What is your return policy?' },
];

const RULES = [
  {
    keywords: ['product', 'catalog', 'machine', 'machinery', 'what do you sell', 'range', 'sell', 'grain'],
    reply: `Farm Craft's range covers the full grain handling chain: Grain Transferring pipes &amp; motor heads, Grain Collecting machines, Grain Bagging attachments, Grain Handling systems, Agricultural Machinery and Pipes &amp; Accessories. Open the <a href="#/shop" class="text-fc-green underline font-medium">Products</a> page to browse by category, or the <a href="#/services" class="text-fc-green underline font-medium">Services</a> page to see how we help you configure the right setup.`,
  },
  {
    keywords: ['order', 'purchase code', 'my order', 'track', 'status', 'where is my'],
    reply: `You can see every order and its purchase code under <a href="#/orders" class="text-fc-green underline font-medium">My Orders</a> (login required). Each order shows its status, quantity, payment method and a downloadable invoice.`,
  },
  {
    keywords: ['deliver', 'delivery', 'shipping', 'how long', 'dispatch', 'arrive'],
    reply: `After you get a purchase code, our team confirms delivery details directly with you based on your address and the product's configuration. You can track the order status any time under My Orders.`,
  },
  {
    keywords: ['pay', 'payment', 'cod', 'cash', 'online payment', 'upi', 'card', 'visit'],
    reply: `You can choose Cash on Delivery (pay in cash when your order is delivered) or Visit Company (complete the purchase in person at our office) in the last step of the "Get a Code" flow. We don't currently support online/card payments.`,
  },
  {
    keywords: ['return', 'refund', 'warranty', 'replace', 'exchange', 'cancel'],
    reply: `For returns, replacements or warranty questions, please share your purchase code or order ID with our team on WhatsApp or by phone — we'll sort out next steps directly with you.`,
  },
  {
    keywords: ['wishlist', 'favorite', 'favourite', 'heart', 'save product', 'saved'],
    reply: `Tap the heart icon on any product to save it — it'll show up on your <a href="#/wishlist" class="text-fc-green underline font-medium">Wishlist</a> page and stays saved as you browse.`,
  },
  {
    keywords: ['invoice', 'bill', 'receipt', 'download invoice'],
    reply: `Every order has a downloadable invoice with our logo, your order details and totals — find the "Download Invoice" button on the order success page or any order's detail page under My Orders.`,
  },
  {
    keywords: ['service', 'installation', 'setup', 'configure', 'configuration', 'maintenance', 'support', 'after sales'],
    reply: `Our <a href="#/services" class="text-fc-green underline font-medium">Services</a> page covers installation guidance, custom machinery configuration and after-sales support — take a look, or message us on WhatsApp with your requirement.`,
  },
  {
    keywords: ['price', 'cost', 'how much', 'quote'],
    reply: `Pricing depends on configuration (motor size, pipe length, etc.), so many listings show "Contact for Price." Start the "Get a Code" flow on a product, or message us on WhatsApp for a quick quote.`,
  },
  {
    keywords: ['contact', 'call', 'phone', 'email', 'human', 'agent', 'talk to someone', 'representative'],
    reply: `You can reach Farm Craft at ${COMPANY.phone} or ${COMPANY.email}, or use the WhatsApp button below for the fastest response. Our <a href="#/contact" class="text-fc-green underline font-medium">Contact</a> page also has an enquiry form.`,
  },
  {
    keywords: ['login', 'log in', 'sign in', 'account', 'demo credential'],
    reply: `Use the demo credentials shown on the <a href="#/login" class="text-fc-green underline font-medium">Login</a> page, or tap "Login as Customer" to jump straight in — no real account needed for this demo storefront.`,
  },
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
    reply: `Hello! I'm the Farm Craft Copilot. I can help with products, orders, delivery, payments, returns and more — what would you like to know?`,
  },
  {
    keywords: ['thank', 'thanks', 'thank you'],
    reply: `You're welcome! Anything else I can help with?`,
  },
];

const FALLBACK_REPLY = `I don't have a ready answer for that yet, but our team can help directly — tap "Chat on WhatsApp" below, or visit the <a href="#/contact" class="text-fc-green underline font-medium">Contact</a> page.`;

function matchReply(text) {
  const q = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(k => q.includes(k))) return rule.reply;
  }
  return FALLBACK_REPLY;
}

/* ---------------- rendering ---------------- */
function bubble(msg) {
  const isUser = msg.role === 'user';
  return `
  <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
    <div class="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
      isUser ? 'bg-fc-green text-white rounded-br-md' : 'bg-fc-offwhite text-fc-charcoal rounded-bl-md border border-fc-line'
    }">${msg.text}</div>
  </div>`;
}

function typingBubble() {
  return `
  <div class="flex justify-start" id="help-typing">
    <div class="bg-fc-offwhite border border-fc-line rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
      <span class="help-dot"></span><span class="help-dot"></span><span class="help-dot"></span>
    </div>
  </div>`;
}

function panelHtml() {
  return `
  <div id="help-panel" class="fixed z-[90] bg-white shadow-soft border border-fc-line flex flex-col
    inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[560px] sm:rounded-3xl help-panel-enter overflow-hidden">
    <div class="shrink-0 bg-fc-charcoal text-white px-5 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-fc-green flex items-center justify-center shrink-0">
          <i data-lucide="sparkles" class="w-4.5 h-4.5"></i>
        </div>
        <div>
          <div class="font-display font-semibold text-sm leading-tight">Farm Craft Copilot</div>
          <div class="text-[11px] text-white/55 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-fc-green inline-block"></span>Instant answers, frontend demo</div>
        </div>
      </div>
      <button id="help-close" aria-label="Close help" class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <div id="help-messages" class="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-3 bg-fc-paper">
      ${messages.map(bubble).join('')}
      ${isTyping ? typingBubble() : ''}
    </div>

    <div class="shrink-0 border-t border-fc-line px-4 py-3 bg-white">
      <div class="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 thin-scroll">
        ${QUICK_REPLIES.map(q => `<button data-quick="${q.query.replace(/"/g, '&quot;')}" class="shrink-0 text-xs font-medium border border-fc-line rounded-full px-3 py-1.5 hover:border-fc-green hover:text-fc-green transition-colors whitespace-nowrap">${q.label}</button>`).join('')}
      </div>
      <form id="help-form" class="flex items-center gap-2 mb-2.5">
        <input id="help-input" type="text" placeholder="Ask about products, orders, delivery…"
          class="flex-1 bg-fc-offwhite border border-fc-line rounded-full px-4 py-2.5 text-sm outline-none focus:border-fc-green transition-colors" autocomplete="off" />
        <button type="submit" aria-label="Send" class="w-10 h-10 shrink-0 rounded-full bg-fc-green text-white flex items-center justify-center hover:bg-fc-greendark transition-colors">
          <i data-lucide="send" class="w-4 h-4"></i>
        </button>
      </form>
      <a href="${whatsappUrl()}" target="_blank" rel="noopener noreferrer"
        class="flex items-center justify-center gap-2 w-full text-sm font-medium py-2.5 rounded-xl text-white transition-colors" style="background:#25D366;">
        <i data-lucide="message-circle" class="w-4 h-4"></i> Chat on WhatsApp
      </a>
    </div>
  </div>`;
}

function fabHtml() {
  return `
  <a id="help-fab" href="${whatsappUrl()}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
    class="fixed z-[90] right-5 bottom-24 lg:bottom-6 w-14 h-14 rounded-full text-white shadow-soft flex items-center justify-center hover:scale-105 transition-transform help-fab-pulse"
    style="background:#25D366;">
    <i data-lucide="message-circle" class="w-7 h-7"></i>
  </a>`;
}

function icons() { if (window.lucide) window.lucide.createIcons(); }

function scrollToBottom() {
  const box = document.getElementById('help-messages');
  if (box) box.scrollTop = box.scrollHeight;
}

function renderWidget() {
  const root = document.getElementById('help-widget-root');
  if (!root) return;
  root.innerHTML = `${isOpen ? panelHtml() : ''}${fabHtml()}`;
  icons();
  bind(root);
  if (isOpen) scrollToBottom();
}

function pushUserMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  messages.push({ role: 'user', text: escapeHtml(clean) });
  isTyping = true;
  renderWidget();
  const delay = 500 + Math.random() * 400;
  setTimeout(() => {
    isTyping = false;
    messages.push({ role: 'assistant', text: matchReply(clean) });
    renderWidget();
  }, delay);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function bind(root) {
  root.querySelector('#help-fab')?.addEventListener('click', () => { isOpen = true; renderWidget(); });
  root.querySelector('#help-close')?.addEventListener('click', () => { isOpen = false; renderWidget(); });

  root.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => pushUserMessage(btn.getAttribute('data-quick')));
  });

  const form = root.querySelector('#help-form');
  const input = root.querySelector('#help-input');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    pushUserMessage(input.value);
    input.value = '';
  });

  // Let in-bubble links (e.g. "#/orders") close the panel and navigate normally.
  root.querySelectorAll('#help-messages a[href^="#/"]').forEach(a => {
    a.addEventListener('click', () => { isOpen = false; renderWidget(); });
  });
}

export function mountHelpWidget() {
  if (document.getElementById('help-widget-root')) return;
  const root = document.createElement('div');
  root.id = 'help-widget-root';
  document.body.appendChild(root);
  messages = [
    { role: 'assistant', text: `Hi! I'm the Farm Craft Copilot 👋 Ask me about products, orders, delivery, payments or returns — or use the quick options below.` },
  ];
  renderWidget();
}
