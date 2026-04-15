// complete-membership.js
// Called after Stripe payment confirms successfully.
// POST { subscriptionId, customerId, ghlContactId, name, phone, tier, shop_name }
//
// 1. Writes member data to GHL contact custom fields (source of truth for members)
// 2. Swaps tags: removes membership-interest, adds member-active (triggers onboarding workflow)
// 3. Sends welcome SMS
// 4. Writes a lean payout row to Airtable (for biweekly mechanic revenue reconciliation only)

const { updateContact, addTag, removeTag, sendSMS } = require('./ghl');

const TIER_AMOUNTS = {
  'Diagnostic Member': 30,
  'Mobile Member':     50,
  'All-In Member':     90,
};

const AIRTABLE_BASE  = 'apphaPuNGl4itatmY';
const AIRTABLE_TABLE = 'Payouts';   // lightweight ledger table — not Members

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const now       = new Date().toISOString();
  const firstName = name.split(' ')[0];
  const shopLabel = shop_name || 'RepairAll Auto LLC';

  // ── 1. Write member data to GHL custom fields
  if (ghlContactId) {
    try {
      await updateContact(ghlContactId, [
        { key: 'membership_tier',          field_value: tier },
        { key: 'membership_status',        field_value: 'active' },
        { key: 'member_since',             field_value: now },
        { key: 'stripe_customer_id',       field_value: customerId     || '' },
        { key: 'stripe_subscription_id',   field_value: subscriptionId || '' },
      ]);
    } catch (err) {
      console.error('GHL updateContact error (non-fatal):', err.message);
    }

    // ── 2. Swap tags
    try {
      await removeTag(ghlContactId, 'membership-interest');
      await addTag(ghlContactId, 'member-active');
    } catch (err) {
      console.error('GHL tag swap error (non-fatal):', err.message);
    }

    // ── 3. Welcome SMS
    try {
      await sendSMS({
        contactId: ghlContactId,
        message: `Welcome to ${shopLabel}, ${firstName}! Your ${tier} is now active. We'll be in touch shortly to schedule your first visit. Questions? Just reply here.\n\nReply STOP to unsubscribe.`,
      });
    } catch (err) {
      console.error('GHL SMS error (non-fatal):', err.message);
    }
  }

  // ── 4. Write payout row to Airtable (non-fatal — just for revenue reconciliation)
  const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
  if (AIRTABLE_KEY) {
    try {
      const amount     = TIER_AMOUNTS[tier] || 0;
      const agencyCut  = +(amount * 0.12).toFixed(2);
      const mechPayout = +(amount * 0.88).toFixed(2);

      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
        {
          method:  'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              name,
              phone,
              tier,
              shop_name:        shopLabel,
              amount,
              agency_cut:       agencyCut,
              mech_payout:      mechPayout,
              stripe_sub_id:    subscriptionId || '',
              paid_at:          now,
              payout_status:    'pending',
            },
          }),
        }
      );
    } catch (err) {
      console.error('Airtable payout row error (non-fatal):', err.message);
    }
  }

  return res.status(200).json({ ok: true });
};
