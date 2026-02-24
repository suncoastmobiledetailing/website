// ===== SUPPLIER FULFILLMENT MODULE =====
// This module handles automated ordering from third-party suppliers.
// Currently sends structured email notifications with supplier links.
// Replace the email logic with direct API calls to your supplier when ready.

const nodemailer = require('nodemailer');

// Supplier product mapping — maps our product IDs to supplier info
const SUPPLIER_CATALOG = {
  'mf-towel-6pk': {
    supplierName: 'Autofiber / Direct Textile Store',
    supplierUrl: 'https://www.autofiber.com/collections/microfiber-towels',
    supplierSku: 'MF-400GSM-16x16-6PK',
    wholesaleCost: 8.00,
    notes: 'Order 400 GSM, 16x16 inch, assorted colors'
  },
  'ceramic-spray': {
    supplierName: 'Chemical Guys / Wholesale Auto',
    supplierUrl: 'https://www.chemicalguys.com/hydroslick-hyperwax/HYP_WAXKIT_16.html',
    supplierSku: 'CG-CERAMIC-16OZ',
    wholesaleCost: 12.00,
    notes: 'SiO2 ceramic coating spray, 16 oz bottle'
  },
  'foam-soap': {
    supplierName: 'Chemical Guys / Adams Polishes',
    supplierUrl: 'https://www.chemicalguys.com/citrus-wash-and-gloss/CWS_301_16.html',
    supplierSku: 'CG-FOAM-32OZ',
    wholesaleCost: 7.00,
    notes: 'Foam cannon compatible car wash soap, 32 oz'
  },
  'leather-kit': {
    supplierName: 'Leather Honey / Chemical Guys',
    supplierUrl: 'https://www.leatherhoney.com/products/leather-care-kit',
    supplierSku: 'LH-CARE-KIT',
    wholesaleCost: 10.00,
    notes: 'Leather cleaner + conditioner bundle'
  },
  'wheel-brush-set': {
    supplierName: 'Detail Factory / EZ Detail',
    supplierUrl: 'https://www.detailfactory.com/collections/wheel-brushes',
    supplierSku: 'DF-WHEEL-3PC',
    wholesaleCost: 6.00,
    notes: '3-piece wheel & tire brush set, various sizes'
  },
  'interior-spray': {
    supplierName: 'Chemical Guys / Meguiars',
    supplierUrl: 'https://www.chemicalguys.com/innerclean-interior-quick-detailer/SPI_663_16.html',
    supplierSku: 'CG-INTERIOR-16OZ',
    wholesaleCost: 6.00,
    notes: 'Interior detailing quick spray, 16 oz'
  },
  'wash-mitt-2pk': {
    supplierName: 'Autofiber / The Rag Company',
    supplierUrl: 'https://www.theragcompany.com/collections/wash-mitts',
    supplierSku: 'TRC-MITT-2PK',
    wholesaleCost: 5.00,
    notes: 'Premium microfiber wash mitt, 2-pack'
  },
  'graphene-kit': {
    supplierName: 'Adams Polishes / Ethos Car Care',
    supplierUrl: 'https://adamspolishes.com/collections/graphene-ceramic-coating',
    supplierSku: 'AP-GRAPHENE-30ML',
    wholesaleCost: 18.00,
    notes: 'Graphene ceramic coating kit, 30ml with applicator'
  }
};

/**
 * Place a fulfillment order with the supplier.
 * Sends a structured email to the business owner with:
 * - Customer shipping details
 * - Each product's supplier link, SKU, and quantity
 * - Total wholesale cost
 *
 * @param {Object} order - The confirmed order object
 * @param {Object} order.shipping - Customer shipping details
 * @param {Array} order.items - Array of {productId, name, quantity, price}
 * @param {string} order.orderId - Internal order ID
 * @param {string} order.paymentIntentId - Stripe payment intent ID
 * @param {number} order.total - Customer-paid total
 * @returns {Object} Result of fulfillment attempt
 */
async function placeSupplierOrder(order) {
  const fulfillmentItems = order.items.map(item => {
    const supplier = SUPPLIER_CATALOG[item.productId] || {};
    return {
      ...item,
      supplierName: supplier.supplierName || 'Unknown',
      supplierUrl: supplier.supplierUrl || '#',
      supplierSku: supplier.supplierSku || 'N/A',
      wholesaleCost: supplier.wholesaleCost || 0,
      notes: supplier.notes || '',
      totalWholesale: (supplier.wholesaleCost || 0) * item.quantity
    };
  });

  const totalWholesale = fulfillmentItems.reduce((sum, i) => sum + i.totalWholesale, 0);
  const profit = order.total - totalWholesale;

  // Build the email body
  const emailHtml = buildFulfillmentEmail(order, fulfillmentItems, totalWholesale, profit);

  // Log to console for development
  console.log('\n========================================');
  console.log('🚚 NEW SUPPLIER FULFILLMENT ORDER');
  console.log('========================================');
  console.log(`Order ID: ${order.orderId}`);
  console.log(`Payment: ${order.paymentIntentId}`);
  console.log(`Customer: ${order.shipping.name}`);
  console.log(`Ship to: ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}`);
  console.log('---');
  fulfillmentItems.forEach(item => {
    console.log(`  ${item.quantity}x ${item.name}`);
    console.log(`    → Supplier: ${item.supplierName}`);
    console.log(`    → SKU: ${item.supplierSku}`);
    console.log(`    → Order from: ${item.supplierUrl}`);
    console.log(`    → Wholesale: $${item.wholesaleCost.toFixed(2)} each`);
  });
  console.log('---');
  console.log(`Customer paid: $${order.total.toFixed(2)}`);
  console.log(`Wholesale cost: $${totalWholesale.toFixed(2)}`);
  console.log(`Profit: $${profit.toFixed(2)}`);
  console.log('========================================\n');

  // Try to send email notification
  let emailSent = false;
  try {
    emailSent = await sendFulfillmentEmail(emailHtml, order.orderId);
  } catch (err) {
    console.log('⚠ Email not sent (SMTP not configured):', err.message);
  }

  return {
    success: true,
    emailSent,
    wholesaleCost: totalWholesale,
    profit,
    fulfillmentItems
  };
}

/**
 * Build an HTML email body for the fulfillment notification
 */
function buildFulfillmentEmail(order, items, totalWholesale, profit) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        <strong>${item.name}</strong><br>
        <small>SKU: ${item.supplierSku}</small>
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        <a href="${item.supplierUrl}" style="color:#32bfc9;font-weight:bold;">
          ${item.supplierName} →
        </a>
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">$${item.totalWholesale.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Space Grotesk',Arial,sans-serif;max-width:640px;margin:0 auto;background:#0c1222;color:#f1f5f9;padding:32px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:28px;margin:0;color:#febc59;">🚚 New Order to Fulfill</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">Order ID: ${order.orderId}</p>
      </div>

      <div style="background:#182036;padding:20px;border-radius:12px;margin-bottom:20px;">
        <h3 style="color:#32bfc9;margin:0 0 12px;">📦 Ship To</h3>
        <p style="margin:0;line-height:1.6;">
          <strong>${order.shipping.name}</strong><br>
          ${order.shipping.address}<br>
          ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}<br>
          📧 ${order.shipping.email}<br>
          📞 ${order.shipping.phone}
        </p>
      </div>

      <div style="background:#182036;padding:20px;border-radius:12px;margin-bottom:20px;">
        <h3 style="color:#32bfc9;margin:0 0 12px;">🛒 Items to Order</h3>
        <table style="width:100%;border-collapse:collapse;color:#f1f5f9;">
          <thead>
            <tr style="border-bottom:2px solid #32bfc9;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:left;">Supplier</th>
              <th style="padding:10px;text-align:right;">Cost</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div style="background:#182036;padding:20px;border-radius:12px;">
        <h3 style="color:#32bfc9;margin:0 0 12px;">💰 Financial Summary</h3>
        <p style="margin:4px 0;">Customer Paid: <strong style="color:#febc59;">$${order.total.toFixed(2)}</strong></p>
        <p style="margin:4px 0;">Wholesale Cost: <strong>$${totalWholesale.toFixed(2)}</strong></p>
        <p style="margin:4px 0;font-size:18px;">Profit: <strong style="color:#5dd4dc;">$${profit.toFixed(2)}</strong></p>
      </div>
    </div>
  `;
}

/**
 * Send the fulfillment email via SMTP
 */
async function sendFulfillmentEmail(htmlBody, orderId) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFICATION_EMAIL) {
    throw new Error('SMTP credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: `"Suncoast Shop" <${SMTP_USER}>`,
    to: NOTIFICATION_EMAIL,
    subject: `🚚 New Order #${orderId} — Fulfill Now`,
    html: htmlBody
  });

  console.log('✅ Fulfillment email sent to', NOTIFICATION_EMAIL);
  return true;
}

module.exports = { placeSupplierOrder, SUPPLIER_CATALOG };
