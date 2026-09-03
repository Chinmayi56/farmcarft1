// Farm Craft — static presentation metadata only.
// Product records are loaded from the FastAPI/PostgreSQL API in services.js.

export const CATEGORIES = [
  { id: 'transferring',  name: 'Grain Transferring',        icon: 'move-horizontal', img: 'assets/products/pipe-coil-1.jpeg' },
  { id: 'collecting',    name: 'Grain Collecting',           icon: 'circle-dot',      img: 'assets/products/collector-field.jpeg' },
  { id: 'bagging',       name: 'Grain Bagging',              icon: 'package',         img: 'assets/products/collector-bags.jpeg' },
  { id: 'handling',      name: 'Grain Handling Equipment',   icon: 'warehouse',       img: 'assets/products/pipe-frame.jpeg' },
  { id: 'machinery',     name: 'Agricultural Machinery',     icon: 'tractor',         img: 'assets/products/collector-diagram.jpeg' },
  { id: 'accessories',   name: 'Pipes & Accessories',        icon: 'cable',           img: 'assets/products/pipe-mounted-2.jpeg' },
];

export const HIGHLIGHTS = [
  { icon: 'gauge',        value: '18 Tons/Hour',  label: 'High Transfer Capacity' },
  { icon: 'ruler',        value: '30–500 Feet',   label: 'Pipe Length Options' },
  { icon: 'move-vertical',value: '20 Feet',        label: 'Transfer Height' },
  { icon: 'zap',          value: '5 HP–16 HP',     label: 'Motor Options' },
  { icon: 'package-check',value: '90 Bags/Hour',   label: 'Bagging Capacity' },
];

export function getCategoryName(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.name : id;
}

// Centralized company/brand information — do NOT hard-code these values
// in individual components. FARM CRAFT is the company/brand name; the
// admin/contact person (Varada Vijayakrishna) is intentionally not part
// of this object since the Customer site must never display it as the
// brand name.
export const COMPANY = {
  name: 'Farm Craft',
  gstin: '37AQXPV3001H1ZG',
  logo: 'assets/farmcraft-logo-full.png',
  // Square, uncropped icon-only version of the same logo artwork — used
  // wherever the brand mark needs to sit in a compact square slot (header,
  // footer, mobile tab bar) without cropping the full rectangular lockup.
  logoMark: 'assets/farmcraft-logo-full.png',
  email: 'farmcraft68@gmail.com',
  phone: '+91 94404 36868',
  phone2: '+91 94904 36868',
  whatsapp: '919440436868', // digits only, country code first — used for wa.me links
  whatsappMessage: 'Hello Farm Craft, I would like to know more about your products.',
  address: '1-23A, Swaraj Tractor Showroom, Palakonda, Manyam District, Andhra Pradesh, Pincode - 532440',
};

// Company services — mirrors a future `GET /services` endpoint.
// Each service maps to one or more product categories so the page can link
// straight back into the Shop with the right filter applied.
export const SERVICES = [
  {
    id: 'grain-transferring',
    title: 'Grain Transferring Solutions',
    icon: 'move-horizontal',
    image: 'assets/products/pipe-mounted-1.jpeg',
    tagline: 'Move grain fast, over long distances, with far less manual handling.',
    description: 'We supply and support flexible, motor-driven grain transferring systems that move rice, wheat, corn, soybean and powders between trucks, stores and processing points — sized to fit daily farm and mill use.',
    benefits: [
      'Transfer capacity up to 18 tons/hour',
      'Pipe lengths from 30 ft to 500 ft',
      'Motor options from 5 HP to 16 HP',
      'Cuts down manual loading and labour time',
    ],
    process: [
      'Share your site layout and daily grain volume with our team',
      'We recommend a pipe length and motor configuration',
      'Get a purchase code and confirm delivery details',
      'On-site setup guidance provided on request',
    ],
    categoryId: 'transferring',
  },
  {
    id: 'grain-collecting',
    title: 'Grain Collecting & Field Recovery',
    icon: 'circle-dot',
    image: 'assets/products/collector-field.jpeg',
    tagline: 'Recover loose grain from threshing floors and open yards efficiently.',
    description: 'Track-mounted and wheeled collectors gather loose grain from the ground and feed it into an inclined elevator, cutting manual scooping and speeding up cleanup after threshing.',
    benefits: [
      'Handles rice, corn, wheat, soybean and side crops',
      'Adjustable-incline elevator',
      'Stable movement across loose grain heaps',
      'Faster yard and threshing-floor cleanup after harvest',
    ],
    process: [
      'Tell us your terrain and typical heap size',
      'We match a collector unit to your operation',
      'Purchase code and delivery are arranged',
      'Live demonstration available on request',
    ],
    categoryId: 'collecting',
  },
  {
    id: 'grain-bagging',
    title: 'Grain Bagging & Packaging',
    icon: 'package',
    image: 'assets/products/collector-bags.jpeg',
    tagline: 'Consistent, fast bag-filling for grains and powders.',
    description: 'Bagging attachments and collecting-and-bagging machines pair with your existing setup for consistent fill weight and quick bag changeovers, so filled bags are ready to stack and move.',
    benefits: [
      'Up to 90 bags/hour',
      'Standard 50 kg woven bag compatibility',
      'Consistent fill weight across bags',
      'Pairs with any Farm Craft collector unit',
    ],
    process: [
      'Confirm your bag size and target throughput',
      'We recommend the right bagging attachment',
      'Get a purchase code and delivery schedule',
      'Optional on-site setup walkthrough',
    ],
    categoryId: 'bagging',
  },
  {
    id: 'custom-configuration',
    title: 'Custom Machinery Configuration',
    icon: 'settings-2',
    image: 'assets/products/collector-diagram.jpeg',
    tagline: 'Motor, pipe and mounting options matched to your operation, not the other way around.',
    description: 'Every farm, mill and store is different. We help you choose motor output, pipe length, mounting style and accessories so the machinery fits your daily volume and available space.',
    benefits: [
      'Configurations from 5 HP to 16 HP motors',
      'Fixed, wheeled or track-mounted builds',
      'Sized to your grain type and daily volume',
      'One point of contact for the full setup',
    ],
    process: [
      'Describe your operation — grain type, volume, space',
      'We propose one or two configurations to compare',
      'Choose a configuration inside the Get a Code flow',
      'Confirm your order and track it under My Orders',
    ],
    categoryId: 'machinery',
  },
  {
    id: 'installation-support',
    title: 'On-Site Installation & Setup Guidance',
    icon: 'wrench',
    image: 'assets/products/pipe-frame.jpeg',
    tagline: 'Get your machinery running correctly from day one.',
    description: 'Once your order is confirmed, our team can walk you through safe setup, pipe routing and first-run checks so your machine is working correctly from the very start.',
    benefits: [
      'Guided first-time setup',
      'Safety and operating checks',
      'Pipe routing and mounting guidance',
      'Fewer early breakdowns caused by incorrect setup',
    ],
    process: [
      'Confirm delivery and your preferred setup date',
      'Our team shares a simple setup checklist',
      'Guided walkthrough, in person or by phone',
      'Sign-off once the machine is running smoothly',
    ],
    categoryId: 'handling',
  },
  {
    id: 'after-sales-support',
    title: 'After-Sales Support & Maintenance',
    icon: 'headphones',
    image: 'assets/products/pipe-coil-2.jpeg',
    tagline: 'We stay reachable after the sale, not just before it.',
    description: 'From spare pipe sections to troubleshooting help, our team supports Farm Craft machinery for the long run — reach out any time using your order ID or purchase code.',
    benefits: [
      'Spare parts and pipe sections available',
      'Troubleshooting support by phone or WhatsApp',
      'Guidance on routine maintenance',
      'Support tied directly to your order and purchase code',
    ],
    process: [
      'Reach out with your purchase code or order ID',
      'Describe the issue or the part you need',
      'Our team advises the next steps',
      'We follow up with you until it is resolved',
    ],
    categoryId: 'accessories',
  },
];

