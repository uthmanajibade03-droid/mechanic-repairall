// begin-membership.js
// Step 1 of 2-step checkout.
// POST { name, phone, tier }
// → Creates GHL contact + tags membership-interest (triggers follow-up automation)
// → Creates Stripe customer + subscription (returns clientSecret for Payment Element)
// → Returns { clientSecret, subscriptionId, customerId, ghlContactId, publishableKey }

const Stripe = require('stripe');
const { upsertContact, addTag } = require('./ghl');

const PRICE_IDS = {
  'Diagnostic Member': process.env.STRIPE_PRICE_DIAGNOSTIC,
  'Mobile Member':     process.env.STRIPE_PRICE_MOBILE,
  'All-In Member':     process.env.STRIPE_PRICE_ALL_IN,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, tier } = req.body || {};
  if (!name || !phone || !tier) {
    return res.status(400).json({ error: 'name, phone, and tier are required.' });
  }

  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return res.status(400).json({ error: `Unknown tier: ${tier}. Check STRIPE_PRICE_* env vars.` });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // ── 1. Create / update GHL contact and tag as membership-interest
    //    (this immediately fires the follow-up automation in case they abandon)
    let ghlContactId = null;
    try {
      const contact  = await upsertContact({ name, phone });
      ghlContactId   = contact.id;
      await addTag(ghlContactId, 'membership-interest');
    } catch (ghlErr) {
      // Non-fatal — don't block checkout if GHL is down
      console.error('GHL error (non-fatal):', ghlErr.message);
    }

    // ── 2. Create Stripe customer (name + phone, no email required)
    const customer = await stripe.customers.create({
      name,
      phone: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`,
      metadata: {
        tier,
        ghl_contact_id: ghlContactId || '',
      },
    });

    // ── 3. Create subscription — incomplete until payment confirmed
    const subscription = await stripe.subscriptions.create({
      customer:         customer.id,
      items:            [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types:        ['card'],
      },
      metadata: { tier, ghl_contact_id: ghlContactId || '' },
      expand:   ['latest_invoice.payment_intent'],
    });

    const clientSecret = subscription.latest_invoice.payment_intent.client_secret;

    return res.status(200).json({
      ok:             true,
      clientSecret,
      subscriptionId: subscription.id,
      customerId:     customer.id,
      ghlContactId,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });

  } catch (err) {
    console.error('begin-membership error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
