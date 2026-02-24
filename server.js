// ===== SUNCOAST MOBILE DETAILING — SERVER =====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { placeSupplierOrder } = require('./supplier');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== PRODUCT CATALOG (server-side source of truth) =====
const PRODUCTS = {
    'mf-towel-6pk': {
        id: 'mf-towel-6pk',
        name: 'Premium Microfiber Towel 6-Pack',
        description: '400 GSM, 16×16 in. Ultra-soft, lint-free — perfect for drying, buffing, and applying coatings.',
        retailPrice: 34.99,
        salePrice: 19.99,
        image: 'shop-images/microfiber-towels.jpg'
    },
    'ceramic-spray': {
        id: 'ceramic-spray',
        name: 'Ceramic Coating Spray',
        description: '16 oz SiO2 ceramic spray — instant hydrophobic protection & mirror-like shine in minutes.',
        retailPrice: 49.99,
        salePrice: 29.99,
        image: 'shop-images/ceramic-spray.jpg'
    },
    'foam-soap': {
        id: 'foam-soap',
        name: 'Foam Cannon Snow Foam Soap',
        description: '32 oz thick foam formula — lifts dirt safely without scratching. Foam cannon compatible.',
        retailPrice: 29.99,
        salePrice: 17.99,
        image: 'shop-images/foam-soap.jpg'
    },
    'leather-kit': {
        id: 'leather-kit',
        name: 'Leather Cleaner & Conditioner Kit',
        description: 'Professional-grade cleaner + conditioner duo. Restores, protects & softens leather.',
        retailPrice: 44.99,
        salePrice: 24.99,
        image: 'shop-images/leather-kit.jpg'
    },
    'wheel-brush-set': {
        id: 'wheel-brush-set',
        name: 'Wheel & Tire Brush Set',
        description: '3-piece set — barrel brush, spoke brush, and tire scrubber. Reaches every crevice.',
        retailPrice: 24.99,
        salePrice: 14.99,
        image: 'shop-images/wheel-brushes.jpg'
    },
    'interior-spray': {
        id: 'interior-spray',
        name: 'Interior Detailing Spray',
        description: '16 oz all-surface interior cleaner — dashboards, consoles, door panels. UV protection included.',
        retailPrice: 27.99,
        salePrice: 15.99,
        image: 'shop-images/interior-spray.jpg'
    },
    'wash-mitt-2pk': {
        id: 'wash-mitt-2pk',
        name: 'Microfiber Wash Mitt 2-Pack',
        description: 'Ultra-plush 800 GSM wash mitts — maximum suds, zero swirls. Machine washable.',
        retailPrice: 22.99,
        salePrice: 12.99,
        image: 'shop-images/wash-mitts.jpg'
    },
    'graphene-kit': {
        id: 'graphene-kit',
        name: 'Graphene Coating Kit',
        description: '30ml pro-grade graphene ceramic coating — 3+ years of protection. Includes applicator & towel.',
        retailPrice: 79.99,
        salePrice: 44.99,
        image: 'shop-images/graphene-kit.jpg'
    }
};

// ===== API: Get products =====
app.get('/api/products', (req, res) => {
    const productList = Object.values(PRODUCTS).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        retailPrice: p.retailPrice,
        salePrice: p.salePrice,
        image: p.image
    }));
    res.json(productList);
});

// ===== API: Get Stripe publishable key =====
app.get('/api/config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// ===== API: Create payment intent =====
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        // Server-side price validation — recalculate from our catalog
        let total = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = PRODUCTS[item.productId];
            if (!product) {
                return res.status(400).json({ error: `Unknown product: ${item.productId}` });
            }
            if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
                return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
            }
            const lineTotal = product.salePrice * item.quantity;
            total += lineTotal;
            validatedItems.push({
                productId: item.productId,
                name: product.name,
                quantity: item.quantity,
                price: product.salePrice,
                lineTotal
            });
        }

        // Convert to cents for Stripe
        const amountCents = Math.round(total * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderItems: JSON.stringify(validatedItems.map(i => ({
                    id: i.productId,
                    qty: i.quantity
                })))
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: total,
            items: validatedItems
        });

    } catch (err) {
        console.error('Payment intent error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===== API: Confirm order (after successful payment) =====
app.post('/api/confirm-order', async (req, res) => {
    try {
        const { paymentIntentId, shipping, items } = req.body;

        if (!paymentIntentId || !shipping || !items) {
            return res.status(400).json({ error: 'Missing order data' });
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not confirmed' });
        }

        // Recalculate total for integrity
        let total = 0;
        const orderItems = items.map(item => {
            const product = PRODUCTS[item.productId];
            if (!product) throw new Error(`Unknown product: ${item.productId}`);
            const lineTotal = product.salePrice * item.quantity;
            total += lineTotal;
            return {
                productId: item.productId,
                name: product.name,
                quantity: item.quantity,
                price: product.salePrice,
                lineTotal
            };
        });

        // Generate order ID
        const orderId = 'SC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        // Build order object
        const order = {
            orderId,
            paymentIntentId,
            shipping: {
                name: shipping.name,
                email: shipping.email,
                phone: shipping.phone || '',
                address: shipping.address,
                city: shipping.city,
                state: shipping.state,
                zip: shipping.zip
            },
            items: orderItems,
            total,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Save order to orders.json
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        try {
            const data = fs.readFileSync(ordersFile, 'utf8');
            orders = JSON.parse(data);
        } catch (e) { /* file doesn't exist yet */ }
        orders.push(order);
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        console.log(`✅ Order ${orderId} saved to orders.json`);

        // Trigger supplier fulfillment
        const fulfillment = await placeSupplierOrder(order);

        res.json({
            success: true,
            orderId,
            total,
            items: orderItems,
            fulfillment: {
                emailSent: fulfillment.emailSent,
                profit: fulfillment.profit
            }
        });

    } catch (err) {
        console.error('Order confirmation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===== Catch-all: serve index.html =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   🌊 Suncoast Mobile Detailing Server        ║
  ║   http://localhost:${PORT}                      ║
  ║                                               ║
  ║   Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Key loaded' : '⚠  No key (set .env)'}             ║
  ║   SMTP:   ${process.env.SMTP_USER ? '✅ Configured' : '⚠  Not configured'}            ║
  ╚═══════════════════════════════════════════════╝
  `);
});
