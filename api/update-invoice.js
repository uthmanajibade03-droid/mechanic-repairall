const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Invoices';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_KEY) return res.status(500).json({ error: 'AIRTABLE_API_KEY not set.' });

  const { record_id, fields } = req.body || {};
  if (!record_id || !fields) return res.status(400).json({ error: 'record_id and fields required.' });

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}/${record_id}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields }),
      }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Airtable update error');

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
