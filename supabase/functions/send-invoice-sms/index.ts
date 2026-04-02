import twilio from "npm:twilio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Always allow preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Function hit");

    const body = await req.json();
    console.log("Incoming body:", body);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Missing Twilio env vars");
      return new Response(
        JSON.stringify({ error: "Missing Twilio env vars" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const { phone, customerName, total, link } = body;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Missing phone" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedTotal = Number(total);
    if (!parsedTotal || parsedTotal <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid total" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!link) {
      return new Response(
        JSON.stringify({ error: "Missing link" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: twilioPhoneNumber,
      to: phone,
      body: `Hi ${customerName || "there"}, your invoice is ready. Total: $${parsedTotal}. Pay here: ${link}`,
    });

    console.log("SMS sent:", message.sid);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});