// send-review-sms.js
// Called after Stripe payment is confirmed on customer.html.
// Sends a Google review request via SMS.
// POST { name, phone, shop_name }

const { upsertContact, sendSMS } = require('./ghl');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, shop_name } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required.' });

  const REVIEW_LINK = process.env.GOOGLE_REVIEW_LINK || '';
  if (!REVIEW_LINK) return res.status(500).json({ error: 'GOOGLE_REVIEW_LINK env var not set.' });

  try {
    const contact  = await upsertContact({ name, phone });
    const shopName = shop_name || 'We';
    const firstName = name.split(' ')[0];

    const message = `Hi ${firstName}! Thank you for choosing ${shopName} — we appreciate your trust. If you had a great experience, we'd love a quick Google review: ${REVIEW_LINK}\n\nTakes 30 seconds and means the world to us 🙏\n\nReply STOP to unsubscribe.`;

    await sendSMS({ contactId: contact.id, message });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-review-sms error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
