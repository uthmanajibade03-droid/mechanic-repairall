const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Invoices';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const AIRTABLE_KEY  = process.env.AIRTABLE_API_KEY;
  if (!STRIPE_SECRET || !AIRTABLE_KEY) return res.status(500).json({ error: 'Server env vars not configured.' });

  const { invoice_id } = req.body || {};
  if (!invoice_id) return res.status(400).json({ error: 'invoice_id required.' });

  try {
    // Fetch invoice from Airtable to validate amount
    const formula = encodeURIComponent(`{invoice_id}='${invoice_id}'`);
    const atRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } }
    );
    const atData = await atRes.json();
    if (!atRes.ok) throw new Error(atData.error?.message || 'Airtable error');

    const record = atData.records?.[0];
    if (!record) return res.status(404).json({ error: 'Invoice not found.' });

    const amountCents = Math.round(parseFloat(record.fields.total_amount || 0) * 100);
    if (amountCents <= 0) return res.status(400).json({ error: 'Invalid invoice amount.' });

    // Create Stripe PaymentIntent via raw HTTP
    const params = new URLSearchParams({
      amount:                 amountCents.toString(),
      currency:               'usd',
      'metadata[invoice_id]': invoice_id,
      'metadata[record_id]':  record.id,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method:  'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const pi = await stripeRes.json();
    if (!stripeRes.ok) throw new Error(pi.error?.message || 'Stripe error');

    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
