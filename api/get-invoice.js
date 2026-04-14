const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Invoices';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const invoiceId = req.query.id;
  if (!invoiceId) return res.status(400).json({ error: 'Missing ?id= parameter.' });

  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_KEY) return res.status(500).json({ error: 'AIRTABLE_API_KEY not set.' });

  try {
    const formula = encodeURIComponent(`{invoice_id}='${invoiceId}'`);
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Airtable error');

    const record = data.records?.[0];
    if (!record) return res.status(404).json({ error: 'Invoice not found.' });

    return res.status(200).json({ invoice: { ...record.fields, _recordId: record.id } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
