# Suncoast Mobile Detailing — Website

🌐 **Live Site:** [https://suncoastmobiledetailing.github.io/website/](https://suncoastmobiledetailing.github.io/website/)

Official website for **Suncoast Mobile Detailing**, a premium mobile car detailing service based in Parkland, FL, serving all of South Florida.

## Overview

This is a fully responsive, single-page website featuring:

- **Service showcase** — Exterior, interior, and premium wax detailing packages
- **Pricing tiers** — Coastal Rinse, Ocean Glaze, and Sunset Elite packages
- **Detailing shop** — E-commerce storefront with Stripe-powered checkout for professional car care products
- **Interactive 3D hero** — Three.js animated background for a premium feel
- **Service area map** — Coverage across Parkland, Coral Springs, Boca Raton, Fort Lauderdale, and more
- **Contact section** — Direct call, text, and email links

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JS |
| 3D Effects | Three.js |
| Payments | Stripe |
| Backend | Node.js / Express |
| Fonts | Google Fonts (Anton, Space Grotesk) |

## Getting Started

```bash
# Install dependencies
npm install

# Create a .env file with your keys
#   STRIPE_SECRET_KEY=sk_...
#   STRIPE_PUBLISHABLE_KEY=pk_...
#   SUPPLIER_EMAIL=...

# Start the dev server
node server.js
```

The site will be available at `http://localhost:3000`.

## Project Structure

```
├── index.html          # Main page
├── style.css           # All styles
├── script.js           # Core UI logic (nav, scroll, animations)
├── shop.js             # Shop catalog, cart, and Stripe checkout
├── three-scene.js      # Three.js 3D hero background
├── server.js           # Express backend (Stripe + order handling)
├── supplier.js         # Supplier fulfillment email module
├── package.json        # Node dependencies
└── img-*.jpg / logo-*  # Images and branding assets
```

## Contact

- 📧 mail.suncoastmobile@gmail.com
- 📞 (954) 554-7462

## Editor

- Ryan Shatzkamer

---

*© 2026 Suncoast Mobile Detailing. All rights reserved.*
