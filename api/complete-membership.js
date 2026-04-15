// complete-membership.js
// Step 2 of 2-step checkout — called after Stripe payment confirms successfully.
// POST { subscriptionId, customerId, ghlContactId, name, phone, tier, shop_name }
// → Saves active member to Airtable
// → Swaps GHL tag: removes membership-interest, adds member-active (triggers onboarding workflow)
// → Sends welcome SMS

const { addTag, removeTag, sendSMS } = require('./ghl');

const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Members';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_KEY) return res.status(500).json({ error: 'AIRTABLE_API_KEY not set.' });

  const {
    subscriptionId,
    customerId,
    ghlContactId,
    name,
    phone,
    tier,
    shop_name,
  } = req.body || {};

  if (!name || !phone || !tier) {
    return res.status(400).json({ error: 'name, phone, and tier are required.' });
  }

  try {
    // ── 1. Save active member to Airtable
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            name,
            phone,
            tier,
            shop_name:             shop_name || 'RepairAll Auto LLC',
            status:                'active',
            stripe_customer_id:    customerId     || '',
            stripe_subscription_id: subscriptionId || '',
            created_at:            new Date().toISOString(),
            paid_at:               new Date().toISOString(),
          },
        }),
      }
    );
    const airtableData = await r.json();
    if (!r.ok) throw new Error(airtableData.error?.message || 'Airtable error');

    // ── 2. Swap GHL tags and send welcome SMS (non-fatal)
    if (ghlContactId) {
      try {
        await removeTag(ghlContactId, 'membership-interest'); // stop follow-up sequence
        await addTag(ghlContactId, 'member-active');          // trigger onboarding sequence

        const firstName = name.split(' ')[0];
        const shopLabel = shop_name || 'RepairAll';
        await sendSMS({
          contactId: ghlContactId,
          message: `Welcome to ${shopLabel}, ${firstName}! 🎉 Your ${tier} is now active. We'll be in touch shortly to schedule your first visit. Questions? Just reply here.\n\nReply STOP to unsubscribe.`,
        });
      } catch (ghlErr) {
        console.error('GHL error (non-fatal):', ghlErr.message);
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('complete-membership error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
