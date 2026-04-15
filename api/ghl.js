// ghl.js — GoHighLevel API v2 helpers
// Location ID and API key pulled from env vars

const GHL_API   = 'https://services.leadconnectorhq.com';
const GHL_KEY   = process.env.GHL_API_KEY;
const GHL_LOC   = process.env.GHL_LOCATION_ID;

const headers = () => ({
  Authorization:  `Bearer ${GHL_KEY}`,
  'Content-Type': 'application/json',
  Version:        '2021-07-28',
});

// Create or update a contact by phone number
async function upsertContact({ name, phone }) {
  const res  = await fetch(`${GHL_API}/contacts/`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      locationId: GHL_LOC,
      firstName:  name.split(' ')[0] || name,
      lastName:   name.split(' ').slice(1).join(' ') || '',
      phone:      phone.startsWith('+') ? phone : `+1${phone}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GHL contact error');
  return data.contact;
}

// Send an SMS to a contact
async function sendSMS({ contactId, message }) {
  const res  = await fetch(`${GHL_API}/conversations/messages`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      type:        'SMS',
      contactId,
      locationId:  GHL_LOC,
      message,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GHL SMS error');
  return data;
}

module.exports = { upsertContact, sendSMS };
