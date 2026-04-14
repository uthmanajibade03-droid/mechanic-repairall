const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Members';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_KEY) return res.status(500).json({ ok: false, error: 'AIRTABLE_API_KEY not set.' });

  const { name, phone, tier, shop_name } = req.body || {};
  if (!name || !phone || !tier) return res.status(400).json({ ok: false, error: 'name, phone, and tier are required.' });

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { name, phone, tier, shop_name: shop_name || 'Unknown', status: 'pending', created_at: new Date().toISOString() },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Airtable error');

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
