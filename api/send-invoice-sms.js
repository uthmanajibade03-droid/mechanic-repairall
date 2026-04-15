// send-invoice-sms.js
// Called after invoice is created in mechanic.html.
// Creates a GHL contact and sends the payment link via SMS.
// POST { name, phone, invoice_id, total, shop_name }

const { upsertContact, sendSMS } = require('./ghl');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, invoice_id, total, shop_name } = req.body || {};
  if (!name || !phone || !invoice_id) {
    return res.status(400).json({ error: 'name, phone, and invoice_id are required.' });
  }

  try {
    // 1. Create or update contact in GHL
    const contact = await upsertContact({ name, phone });

    // 2. Build payment link
    const baseUrl  = process.env.SITE_URL || 'https://www.repairall.llc';
    const link     = `${baseUrl}/customer?id=${encodeURIComponent(invoice_id)}`;
    const amount   = total ? `$${parseFloat(total).toFixed(2)}` : '';
    const shopName = shop_name || 'Your mechanic';

    // 3. Send SMS
    const message = `Hi ${name.split(' ')[0]}! ${shopName} sent you an invoice${amount ? ` for ${amount}` : ''}. Pay securely here: ${link}\n\nReply STOP to unsubscribe.`;

    await sendSMS({ contactId: contact.id, message });

    return res.status(200).json({ ok: true, contactId: contact.id });
  } catch (e) {
    console.error('send-invoice-sms error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
