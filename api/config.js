// config.js — returns public runtime config (shop name, etc.)
// No auth required — shop name is not sensitive.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(200).json({
    shopName: process.env.SHOP_NAME || 'RepairAll Auto LLC',
  });
};
