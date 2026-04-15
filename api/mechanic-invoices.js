const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Invoices';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  const AT_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const AT_HDR = { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' };

  try {
    // GET: list all invoices sorted newest first
    if (req.method === 'GET') {
      // Fetch without Airtable-level sort — avoids field-type errors on created_at.
      // Client sorts descending by created_at after receiving records.
      const r    = await fetch(AT_URL, { headers: AT_HDR });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Airtable error');

      const invoices = (data.records || []).map(rec => ({ ...rec.fields, _recordId: rec.id }));
      return res.status(200).json({ invoices });
    }

    // POST: create invoice
    if (req.method === 'POST') {
      const { fields } = req.body || {};
      if (!fields) return res.status(400).json({ error: 'Missing fields' });

      const r    = await fetch(AT_URL, { method: 'POST', headers: AT_HDR, body: JSON.stringify({ fields }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Airtable error');

      return res.status(200).json({ ok: true, record: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
