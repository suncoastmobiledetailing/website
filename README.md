<p align="center">
  <img src="logo-icon.png" alt="Suncoast Mobile Detailing" width="280" />
</p>

<h1 align="center">🌴 Suncoast Mobile Detailing 🌴</h1>

<p align="center">
  <em>Premium mobile car detailing — we come to YOU across South Florida ☀️🚗✨</em>
</p>

<p align="center">
  <a href="https://suncoastmobiledetailing.github.io/website/">🌐 Live Website</a> •
  <a href="https://suncoastmobiledetailing.github.io/website/booking.html">📅 Book Now</a> •
  <a href="mailto:mail.suncoastmobile@gmail.com">📧 Contact Us</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Location-Parkland%2C%20FL-blue?style=for-the-badge" alt="Location" />
  <img src="https://img.shields.io/badge/Service%20Area-25%20Miles-orange?style=for-the-badge" alt="Service Area" />
</p>

---

## 🏄 What Is This?

The official website and booking system for **Suncoast Mobile Detailing** — a premium mobile car detailing service based in **Parkland, Florida**. We pull up to your driveway and make your ride look brand new. No shop visit needed! 💪

This repo powers:
- 🌊 **A stunning landing page** with 3D animated hero, service showcases, and customer reviews
- 📅 **A full booking system** with real-time calendar, time slot management, and anti-spam protection
- 🛒 **A dropshipping shop** with Stripe-powered checkout for professional car care products
- 📍 **Smart address autocomplete** that checks if you're within our 25-mile service radius

---

## ✨ Features at a Glance

### 🎨 The Website
| Feature | Description |
|---------|-------------|
| 🌅 **3D Animated Hero** | Three.js powered background with interactive particles |
| 📦 **Service Packages** | Three tiers — Basic, Basic + Wax, and Full Package |
| 🖼️ **Gallery Carousel** | Smooth, infinite-scrolling photo gallery |
| 🗺️ **Service Area Map** | Coverage across 8+ South Florida cities |
| 📱 **Fully Responsive** | Looks amazing on phones, tablets, and desktops |
| 🌙 **Dark Mode Design** | Premium navy/teal/gold color palette |

### 📅 The Booking System
| Feature | Description |
|---------|-------------|
| 📆 **Interactive Calendar** | Pick any date within the next 4 weeks |
| ⏰ **Real-Time Time Slots** | Slots already booked by others show as unavailable |
| 📍 **Address Autocomplete** | Type-ahead address search powered by Photon/OSM |
| 🛡️ **25-Mile Radius Check** | Automatically blocks out-of-area bookings from Parkland, FL |
| 🚫 **Anti-Spam Protection** | Honeypot fields, rate limiting, and timing checks |
| 🔥 **Firebase Backend** | Firestore for real-time booking data |
| 🔒 **Double-Booking Prevention** | Race-condition check at submission ensures no conflicts |

### 🛒 The Shop
| Feature | Description |
|---------|-------------|
| 🧴 **Product Catalog** | 8 curated car detailing products |
| 🛍️ **Persistent Cart** | Cart stays saved between page visits |
| 💳 **Stripe Checkout** | Secure payment processing |
| 📧 **Auto Notifications** | Order confirmations + supplier fulfillment emails |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────┐
│           🌴 SUNCOAST STACK 🌴           │
├─────────────────────────────────────────┤
│  Frontend    │  HTML · CSS · Vanilla JS  │
│  3D Engine   │  Three.js                 │
│  Database    │  Firebase Firestore       │
│  Payments    │  Stripe                   │
│  Backend     │  Node.js · Express        │
│  Emails      │  Nodemailer (SMTP)        │
│  Geocoding   │  Photon (OpenStreetMap)   │
│  Fonts       │  Google Fonts             │
│  Hosting     │  GitHub Pages             │
└─────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
suncoast-mobile-detailing/
│
├── 🌐 FRONTEND
│   ├── index.html            # Main landing page
│   ├── booking.html          # Booking system (4-step wizard)
│   ├── admin.html            # Admin panel (password protected)
│   ├── style.css             # Main site styles
│   ├── booking.css           # Booking page styles
│   ├── admin.css             # Admin panel styles
│   ├── script.js             # Core UI (nav, scroll, animations)
│   ├── booking.js            # Booking logic + address autocomplete
│   ├── shop.js               # E-commerce cart + Stripe checkout
│   ├── admin.js              # Admin dashboard logic
│   └── three-scene.js        # Three.js 3D hero scene
│
├── ⚙️ BACKEND
│   ├── server.js             # Express server (Stripe + orders)
│   ├── supplier.js           # Supplier fulfillment emails
│   └── package.json          # Node.js dependencies
│
├── 🖼️ ASSETS
│   ├── logo.png              # Full logo
│   ├── logo-icon.png         # Icon logo
│   ├── logo_clean.png        # Clean logo (no background)
│   ├── logo_transparent.png  # Transparent logo
│   ├── img-*.jpg             # Service & gallery images
│   ├── images_for_carousel/  # Gallery carousel images
│   └── shop-images/          # Product images
│
├── 🔒 CONFIG
│   ├── .env.example          # Environment variables template
│   ├── .env                  # Your secrets (git-ignored!)
│   └── .gitignore            # Keeps secrets safe
│
└── 📖 README.md              # You are here! 👋
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+) — [Download here](https://nodejs.org/)
- **Firebase Project** — For the booking system's Firestore database
- **Stripe Account** — For the shop's payment processing *(optional, shop only)*

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/suncoastmobiledetailing/website.git
cd website
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set Up Firebase (Required for Booking System)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one)
2. Enable **Cloud Firestore** in the Firebase console → Build → Firestore Database
3. Set your Firestore security rules (see [Security Rules](#-firestore-security-rules) below)
4. Go to Project Settings → General → Your Apps → Add a Web App
5. Copy the Firebase config object

Then create your local config file:

```bash
cp firebase-config.example.js firebase-config.js
```

Fill in `firebase-config.js` with your Firebase project values:

```js
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Admin password — stored as SHA-256 hash, NOT plain text!
// Generate a hash: echo -n "yourpassword" | shasum -a 256
const ADMIN_PASSWORD_HASH = "YOUR_SHA256_HASH_HERE";
```

> ⚠️ **IMPORTANT:** `firebase-config.js` is git-ignored to keep your config private. Never commit it!

### 4️⃣ Set Up Stripe & Email (Optional — Shop Only)

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
# 💳 Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# 📧 SMTP Config (for order notification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 📬 Where to receive order notifications
NOTIFICATION_EMAIL=owner@example.com

# 🖥️ Server Port
PORT=3000
```

> ⚠️ **IMPORTANT:** Never commit your `.env` file! It's already in `.gitignore` to keep your secrets safe 🔐

### 5️⃣ Start the Server

```bash
npm start
```

Your site will be running at **http://localhost:3000** 🎉

---

## 🔑 Configuration Reference

### `firebase-config.js` (Required for Booking + Admin)

| Variable | What It Does |
|----------|-------------|
| `firebaseConfig.apiKey` | Firebase API key (project identifier) |
| `firebaseConfig.projectId` | Your Firebase project ID |
| `firebaseConfig.appId` | Your Firebase web app ID |
| `ADMIN_PASSWORD_HASH` | SHA-256 hash of the admin panel password |

### `.env` (Required for Shop Only)

| Variable | What It Does |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key for processing payments |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe public key for the checkout form |
| `SMTP_HOST` | SMTP server for sending order notifications |
| `SMTP_PORT` | SMTP port (usually 587 for TLS) |
| `SMTP_USER` | Email account username |
| `SMTP_PASS` | Email account password or app password |
| `NOTIFICATION_EMAIL` | Where to send order notification emails |
| `PORT` | Server port (defaults to 3000) |

> 💡 **Note:** The landing page works without any config at all. The booking system and admin panel need `firebase-config.js`. The shop backend needs `.env`.

---

## 🔥 Firestore Security Rules

Set these rules in the [Firebase Console](https://console.firebase.google.com/) → Firestore → Rules to protect your data:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookings: anyone can create, only authenticated reads for admin
    match /bookings/{bookingId} {
      allow create: if true;
      allow read, update: if true; // Tighten with Firebase Auth for production
      allow delete: if false;
    }
  }
}
```

> 🔒 **Tip:** For production, consider adding [Firebase Authentication](https://firebase.google.com/docs/auth) to restrict admin reads/updates to authenticated users only.

---

## 📍 Service Area

We serve anywhere within **25 miles of Parkland, FL** 🌴

The booking system automatically checks your address when you book. Here's our coverage:

```
                    🌴 PARKLAND (HQ)
                         ⭐
                    /    |    \
                   /     |     \
     Coral Springs  Coconut Creek  Deerfield Beach
          🏘️           🏘️              🏖️
         /               |               \
   Boca Raton      Margate          Pompano Beach
      🌊            🏘️                🏖️
        \                              /
         \                            /
          ----  Fort Lauderdale  ----
                    🌇
```

---

## 🔒 Security

We take security seriously! Here's what we do:

- 🍯 **Honeypot fields** — Catches bots filling out hidden form fields
- ⏱️ **Timing checks** — Blocks forms submitted suspiciously fast
- 📱 **Rate limiting** — Max 3 bookings per phone number per day
- 🔐 **No secrets in code** — Firebase config in git-ignored `firebase-config.js`, server keys in git-ignored `.env`
- 🔑 **Hashed admin password** — Admin password stored as SHA-256 hash, never plain text
- 🛡️ **Firebase rules** — Firestore security rules protect booking data
- 🚫 **Double-booking prevention** — Race condition check before confirming any booking

---

## 📬 Contact

Got questions? Hit us up!

| Channel | Details |
|---------|---------|
| 📞 Phone | [(954) 554-7462](tel:+19545547462) |
| 📧 Email | [mail.suncoastmobile@gmail.com](mailto:mail.suncoastmobile@gmail.com) |
| 🌐 Website | [suncoastmobiledetailing.github.io/website](https://suncoastmobiledetailing.github.io/website/) |

---

## 👨‍💻 Editor

**Ryan Shatzkamer** — Making cars shine across South Florida ☀️

---

<p align="center">
  <strong>Made with ☀️ in Parkland, FL</strong><br/>
  <em>© 2026 Suncoast Mobile Detailing. All rights reserved.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built%20With-❤️-red?style=flat-square" alt="Built with love" />
  <img src="https://img.shields.io/badge/Cars%20Detailed-∞-gold?style=flat-square" alt="Cars Detailed" />
  <img src="https://img.shields.io/badge/Vibes-Immaculate-brightgreen?style=flat-square" alt="Vibes" />
</p>
