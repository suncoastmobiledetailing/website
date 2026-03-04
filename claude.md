# CLAUDE.md — Suncoast Mobile Detailing

> Project context file for AI assistants working on this codebase.

## Project Overview

**Suncoast Mobile Detailing** is a premium mobile car detailing business based in Parkland, FL. This repo is the full website + booking system + e-commerce shop, deployed to **GitHub Pages** at:

- **Live site:** https://suncoastmobiledetailing.github.io/website/
- **Booking:** https://suncoastmobiledetailing.github.io/website/booking.html
- **Admin:** https://suncoastmobiledetailing.github.io/website/admin.html

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (no frameworks)
- **3D Hero:** Three.js (`three-scene.js`)
- **Database:** Firebase Firestore (client-side SDK, project: `suncoast-crm`)
- **Payments:** Stripe (shop only)
- **Backend:** Node.js + Express (`server.js`) — serves static files + handles Stripe checkout
- **Emails:** Nodemailer (`supplier.js`) for supplier fulfillment; EmailJS for booking confirmations
- **Geocoding:** Photon (OpenStreetMap) for address autocomplete + 25-mile radius check
- **Hosting:** GitHub Pages (frontend) — backend runs locally or on a server
- **Fonts:** Google Fonts (Anton, Space Grotesk)

## Running Locally

```bash
npm install
npm start        # runs node server.js on port 3000
```

The site is at `http://localhost:3000/` (NOT `/website/` — that path is only for GitHub Pages).

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Main landing page — hero, services, pricing, gallery, shop, contact |
| `style.css` | All styles for the landing page |
| `script.js` | Nav toggle, scroll animations, gallery carousel |
| `three-scene.js` | Three.js animated particle background |
| `booking.html` | 4-step booking wizard (service → calendar → info → confirm) |
| `booking.js` | Full booking logic — state machine, calendar, vehicle builder, Firestore |
| `booking.css` | Booking page styles |
| `admin.html` | Password-protected admin dashboard |
| `admin.js` | Admin logic — calendar view, booking cards, status updates |
| `admin.css` | Admin panel styles |
| `shop.js` | E-commerce — product catalog, cart, Stripe checkout |
| `server.js` | Express server — static files + Stripe payment endpoints |
| `supplier.js` | Nodemailer — auto-email supplier when order is placed |
| `vault.html` / `vault.js` | Secrets vault UI (git-ignored) |

## Business Model: Reset + Maintenance

The pricing structure follows a **recurring maintenance** model, NOT one-off packages:

1. **Full Reset Detail** (required for new clients) — restores vehicle to clean baseline
   - Sedan: $120 | SUV/Truck: $150
2. **Maintenance Plan** (recurring, after reset) — quick visits to keep it clean
   - Sedan: $50/visit | SUV/Truck: $60/visit
   - Frequencies: Weekly (4 visits), Bi-Weekly (2 visits), Monthly (3 visits)

## Vehicle Builder

Users can add 1–4 vehicles per booking. Each vehicle is independently set to "Sedan" or "SUV/Truck". The state model is:

```js
state.vehicles = ['sedan', 'suv', 'sedan']; // array of types
calcTotal();   // sums per-car pricing from SERVICES config
getNumCars();  // returns state.vehicles.length
```

## Booking System (booking.js)

### 4-Step Wizard
1. **Service Selection** — Reset or Maintenance (+ frequency for maintenance)
2. **Date & Time** — Interactive calendar (60-day range) + time slots (7AM–6PM)
3. **Your Info** — Name, phone, email, vehicle builder, address autocomplete
4. **Confirm** — Review + submit to Firestore

### Key State
```js
state = {
    step: 1,
    vehicles: ['sedan'],
    selectedService: null,    // 'reset' or 'maintenance'
    selectedFrequency: null,  // 'weekly' | 'biweekly' | 'monthly'
    selectedDate: null,
    selectedTime: null,
    customer: {},
    formLoadTime: Date.now()
};
```

### Firestore Collections
- `bookings` — all booking records (date, time, service, vehicles array, price, status, customer info)
- `customers` — customer records (may fail silently if security rules aren't configured)

### Anti-Spam
- Honeypot field (`#website`)
- Rate limiting (2-min cooldown in localStorage)
- Form speed check (must take >3 seconds)

### Recurring Bookings
For maintenance plans, the system creates multiple booking documents (one per visit) with `recurring: true`, `recurringGroupId`, `recurringIndex`, and `recurringTotal` fields. Each visit can have its own time, editable via dropdowns on the confirmation screen.

## Admin Panel (admin.js)

- **Password:** `suncoastmobile01` (hashed comparison in JS)
- **Views:** Calendar (default), Today, All Bookings, Archive
- **Actions:** Confirm, Complete, Cancel, Archive/Unarchive per booking
- **Vehicle display:** Reads `booking.vehicles[]` array, shows breakdown like "🚗 2 Sedans + 🚙 1 SUV"

## Service Area

Centered on **Parkland, FL** with a **25-mile radius**. The booking form validates addresses using Haversine distance from coordinates `[26.2003, -80.2689]`.

Cities covered: Coral Springs, Coconut Creek, Deerfield Beach, Boca Raton, Margate, Pompano Beach, Fort Lauderdale, and surrounding areas.

## Environment Variables (.env)

Only needed for the shop backend (Stripe + emails). The booking system and landing page work without them.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=owner@example.com
PORT=3000
```

## Git-Ignored Files

- `node_modules/`
- `.env`
- `SECRETS_BACKUP.md`
- `vault.js`

## Design System

- **Color palette:** Navy (`#0a1628`), Teal (`#32bfc9`), Gold (`#f5a623`), White
- **Fonts:** Anton (headings), Space Grotesk (body)
- **Style:** Dark mode, glassmorphism cards, gradient accents, micro-animations
- **Responsive:** Mobile-first with breakpoints at 600px, 768px, 900px, 1024px

## Common Gotchas

1. **localhost vs GitHub Pages paths:** Locally the site is at `/`, on GH Pages it's at `/website/`. Don't hardcode absolute paths.
2. **Firestore security rules:** The `customers` collection write may fail if rules aren't configured — this is non-blocking for booking saves.
3. **EmailJS:** Placeholder keys in `booking.js` — need real credentials for confirmation emails.
4. **Browser caching on GH Pages:** After pushing, users may need `Ctrl+Shift+R` to see updates due to CDN caching.
5. **Admin password UI:** The password input can be finicky — JS bypass is `document.getElementById('lockScreen').style.display='none'; document.getElementById('dashboard').style.display='block'; loadBookings();`
