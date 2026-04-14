module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { password } = req.body || {};
  const correct = process.env.MECHANIC_PASSWORD;

  if (!correct) return res.status(500).json({ ok: false, error: 'MECHANIC_PASSWORD env variable not set.' });
  if (password === correct) return res.status(200).json({ ok: true });
  return res.status(401).json({ ok: false, error: 'Incorrect password.' });
};
