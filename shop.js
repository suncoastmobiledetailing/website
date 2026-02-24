// ===== SUNCOAST SHOP — CART, CHECKOUT, STRIPE =====

// Product catalog (mirrors server-side data)
const SHOP_PRODUCTS = [
    {
        id: 'mf-towel-6pk',
        name: 'Premium Microfiber Towel 6-Pack',
        description: '400 GSM, 16×16 in. Ultra-soft, lint-free — perfect for drying, buffing, and applying coatings.',
        retailPrice: 34.99,
        salePrice: 19.99,
        image: 'shop-images/microfiber-towels.jpg'
    },
    {
        id: 'ceramic-spray',
        name: 'Ceramic Coating Spray',
        description: '16 oz SiO2 ceramic spray — instant hydrophobic protection & mirror-like shine in minutes.',
        retailPrice: 49.99,
        salePrice: 29.99,
        image: 'shop-images/ceramic-spray.jpg'
    },
    {
        id: 'foam-soap',
        name: 'Foam Cannon Snow Foam Soap',
        description: '32 oz thick foam formula — lifts dirt safely without scratching. Foam cannon compatible.',
        retailPrice: 29.99,
        salePrice: 17.99,
        image: 'shop-images/foam-soap.jpg'
    },
    {
        id: 'leather-kit',
        name: 'Leather Cleaner & Conditioner Kit',
        description: 'Professional-grade cleaner + conditioner duo. Restores, protects & softens leather.',
        retailPrice: 44.99,
        salePrice: 24.99,
        image: 'shop-images/leather-kit.jpg'
    },
    {
        id: 'wheel-brush-set',
        name: 'Wheel & Tire Brush Set',
        description: '3-piece set — barrel brush, spoke brush, and tire scrubber. Reaches every crevice.',
        retailPrice: 24.99,
        salePrice: 14.99,
        image: 'shop-images/wheel-brushes.jpg'
    },
    {
        id: 'interior-spray',
        name: 'Interior Detailing Spray',
        description: '16 oz all-surface interior cleaner — dashboards, consoles, door panels. UV protection included.',
        retailPrice: 27.99,
        salePrice: 15.99,
        image: 'shop-images/interior-spray.jpg'
    },
    {
        id: 'wash-mitt-2pk',
        name: 'Microfiber Wash Mitt 2-Pack',
        description: 'Ultra-plush 800 GSM wash mitts — maximum suds, zero swirls. Machine washable.',
        retailPrice: 22.99,
        salePrice: 12.99,
        image: 'shop-images/wash-mitts.jpg'
    },
    {
        id: 'graphene-kit',
        name: 'Graphene Coating Kit',
        description: '30ml pro-grade graphene ceramic coating — 3+ years of protection. Includes applicator & towel.',
        retailPrice: 79.99,
        salePrice: 44.99,
        image: 'shop-images/graphene-kit.jpg'
    }
];

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('suncoast_cart') || '[]');

function saveCart() {
    localStorage.setItem('suncoast_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
}

function addToCart(productId) {
    const product = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(i => i.productId === productId);
    if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, 99);
    } else {
        cart.push({ productId, quantity: 1 });
    }

    saveCart();
    openCart();

    // Visual feedback
    const btn = document.querySelector(`[data-add-cart="${productId}"]`);
    if (btn) {
        btn.textContent = '✓ ADDED';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = 'ADD TO CART';
            btn.classList.remove('added');
        }, 1200);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.productId !== productId);
    saveCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity < 1) {
        removeFromCart(productId);
        return;
    }
    if (item.quantity > 99) item.quantity = 99;
    saveCart();
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        const product = SHOP_PRODUCTS.find(p => p.id === item.productId);
        return sum + (product ? product.salePrice * item.quantity : 0);
    }, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    grid.innerHTML = SHOP_PRODUCTS.map((p, i) => {
        const discount = Math.round((1 - p.salePrice / p.retailPrice) * 100);
        return `
      <div class="product-card" data-scroll="fade-up" data-delay="${i % 4}">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" />
          <span class="product-discount-badge">SAVE ${discount}%</span>
        </div>
        <div class="product-body">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-prices">
            <span class="product-retail">$${p.retailPrice.toFixed(2)}</span>
            <span class="product-sale">$${p.salePrice.toFixed(2)}</span>
          </div>
          <button class="btn btn-glow btn-card product-add" data-add-cart="${p.id}" onclick="addToCart('${p.id}')">ADD TO CART</button>
        </div>
      </div>
    `;
    }).join('');

    // Re-observe for scroll animations
    const scrollObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); scrollObs.unobserve(e.target); }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    grid.querySelectorAll('[data-scroll]').forEach(el => scrollObs.observe(el));
}

// ===== CART UI =====
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = getCartCount();
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const subtotalEl = document.getElementById('cartSubtotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!container) return;

    // Remove old items (keep empty state element)
    container.querySelectorAll('.cart-item').forEach(el => el.remove());

    if (cart.length === 0) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;

    cart.forEach(item => {
        const product = SHOP_PRODUCTS.find(p => p.id === item.productId);
        if (!product) return;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <p class="cart-item-name">${product.name}</p>
        <p class="cart-item-price">$${product.salePrice.toFixed(2)}</p>
        <div class="cart-qty-controls">
          <button class="cart-qty-btn" onclick="updateQuantity('${item.productId}', -1)">−</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.productId}')" aria-label="Remove">✕</button>
    `;
        container.insertBefore(div, emptyEl);
    });

    if (subtotalEl) subtotalEl.textContent = `$${getCartTotal().toFixed(2)}`;
}

function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

// Cart toggle listeners
document.getElementById('cartToggle')?.addEventListener('click', openCart);
document.getElementById('cartClose')?.addEventListener('click', closeCart);
document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

// ===== CHECKOUT =====
let stripeInstance = null;
let cardElement = null;
let currentClientSecret = null;

async function openCheckout() {
    closeCart();

    if (cart.length === 0) return;

    const overlay = document.getElementById('checkoutOverlay');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Render summary
    const summaryEl = document.getElementById('checkoutSummary');
    summaryEl.innerHTML = cart.map(item => {
        const product = SHOP_PRODUCTS.find(p => p.id === item.productId);
        if (!product) return '';
        return `
      <div class="checkout-summary-item">
        <span class="checkout-summary-name">${product.name} × ${item.quantity}</span>
        <span class="checkout-summary-price">$${(product.salePrice * item.quantity).toFixed(2)}</span>
      </div>
    `;
    }).join('');

    document.getElementById('checkoutTotal').textContent = `$${getCartTotal().toFixed(2)}`;

    // Initialize Stripe
    if (!stripeInstance) {
        try {
            const config = await fetch('/api/config').then(r => r.json());
            stripeInstance = Stripe(config.publishableKey);
        } catch (e) {
            console.log('Stripe config fetch failed, using fallback');
            // If server isn't running / no key, try a placeholder for UI purposes
            stripeInstance = null;
        }
    }

    if (stripeInstance) {
        const elements = stripeInstance.elements();
        // Unmount old card if exists
        if (cardElement) {
            cardElement.unmount();
        }
        cardElement = elements.create('card', {
            style: {
                base: {
                    color: '#f1f5f9',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '16px',
                    '::placeholder': { color: '#94a3b8' },
                    iconColor: '#5dd4dc'
                },
                invalid: { color: '#ff6b6b', iconColor: '#ff6b6b' }
            }
        });
        cardElement.mount('#stripeCardElement');
        cardElement.on('change', e => {
            const errEl = document.getElementById('cardErrors');
            errEl.textContent = e.error ? e.error.message : '';
        });
    }

    // Create payment intent
    try {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        currentClientSecret = data.clientSecret;
    } catch (e) {
        console.error('Payment intent error:', e);
        currentClientSecret = null;
    }
}

function closeCheckout() {
    document.getElementById('checkoutOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('checkoutBtn')?.addEventListener('click', openCheckout);
document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);

// ===== PAYMENT FORM =====
document.getElementById('checkoutForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const payBtn = document.getElementById('payBtn');
    const payBtnText = document.getElementById('payBtnText');
    const paySpinner = document.getElementById('paySpinner');

    if (!stripeInstance || !cardElement || !currentClientSecret) {
        document.getElementById('cardErrors').textContent = 'Payment system not ready. Please ensure the server is running with valid Stripe keys.';
        return;
    }

    // Disable button + show spinner
    payBtn.disabled = true;
    payBtnText.textContent = 'PROCESSING...';
    paySpinner.style.display = 'inline-block';

    const shipping = {
        name: document.getElementById('shipName').value,
        email: document.getElementById('shipEmail').value,
        phone: document.getElementById('shipPhone').value,
        address: document.getElementById('shipAddress').value,
        city: document.getElementById('shipCity').value,
        state: document.getElementById('shipState').value,
        zip: document.getElementById('shipZip').value
    };

    try {
        // Confirm payment with Stripe
        const result = await stripeInstance.confirmCardPayment(currentClientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: shipping.name,
                    email: shipping.email,
                    phone: shipping.phone
                }
            }
        });

        if (result.error) {
            document.getElementById('cardErrors').textContent = result.error.message;
            payBtn.disabled = false;
            payBtnText.textContent = 'PAY NOW';
            paySpinner.style.display = 'none';
            return;
        }

        // Payment succeeded — confirm order on server
        const orderRes = await fetch('/api/confirm-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: result.paymentIntent.id,
                shipping,
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
            })
        });
        const orderData = await orderRes.json();

        if (orderData.error) throw new Error(orderData.error);

        // Success — show confirmation
        closeCheckout();
        showConfirmation(orderData);

        // Clear cart
        cart = [];
        saveCart();

    } catch (err) {
        console.error('Payment error:', err);
        document.getElementById('cardErrors').textContent = err.message || 'Payment failed. Please try again.';
        payBtn.disabled = false;
        payBtnText.textContent = 'PAY NOW';
        paySpinner.style.display = 'none';
    }
});

// ===== ORDER CONFIRMATION =====
function showConfirmation(orderData) {
    const overlay = document.getElementById('confirmationOverlay');
    document.getElementById('confirmOrderId').textContent = `Order #${orderData.orderId}`;

    const details = document.getElementById('confirmDetails');
    details.innerHTML = orderData.items.map(item => `
    <div class="confirm-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>$${item.lineTotal.toFixed(2)}</span>
    </div>
  `).join('') + `
    <div class="confirm-total">
      <span>Total</span>
      <span>$${orderData.total.toFixed(2)}</span>
    </div>
  `;

    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('confirmDone')?.addEventListener('click', () => {
    document.getElementById('confirmationOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
});

// ===== INIT =====
renderProducts();
updateCartBadge();
renderCartItems();

// 3D tilt on product cards (desktop only)
function initProductTilt() {
    if (window.innerWidth < 768 || 'ontouchstart' in window) return;
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            const cx = r.width / 2, cy = r.height / 2;
            const rx = ((y - cy) / cy) * -8;
            const ry = ((x - cx) / cx) * 8;
            card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-14px) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}
// InitProductTilt after render
setTimeout(initProductTilt, 500);
window.addEventListener('resize', () => { clearTimeout(window._ptTimer); window._ptTimer = setTimeout(initProductTilt, 250); });
