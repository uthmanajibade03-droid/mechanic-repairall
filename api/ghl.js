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

// Update custom fields on a contact
async function updateContact(contactId, fields) {
  const res = await fetch(`${GHL_API}/contacts/${contactId}`, {
    method:  'PUT',
    headers: headers(),
    body: JSON.stringify({ customFields: fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GHL updateContact error');
  return data;
}

// Add a tag to a contact
async function addTag(contactId, tag) {
  const res = await fetch(`${GHL_API}/contacts/${contactId}/tags`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GHL addTag error');
  return data;
}

// Remove a tag from a contact
async function removeTag(contactId, tag) {
  const res = await fetch(`${GHL_API}/contacts/${contactId}/tags`, {
    method:  'DELETE',
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GHL removeTag error');
  return data;
}

module.exports = { upsertContact, updateContact, sendSMS, addTag, removeTag };
