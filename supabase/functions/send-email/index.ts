import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, subject, html } = await req.json();

    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.ionos.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpUser || !smtpPass) throw new Error("Cloud Secrets Missing");

    const toRecipients = Array.isArray(to) ? to : [to];
    let conn = await Deno.connect({ hostname: smtpHost, port: smtpPort });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);

    const read = async () => decoder.decode(buffer.subarray(0, await conn.read(buffer) || 0));
    const send = async (cmd: string) => { await conn.write(encoder.encode(cmd + "\r\n")); return await read(); };

    await read();
    await send("EHLO goflexconnect.com");
    await send("STARTTLS");

    const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
    const readTls = async () => decoder.decode(buffer.subarray(0, await tlsConn.read(buffer) || 0));
    const sendTls = async (cmd: string) => { await tlsConn.write(encoder.encode(cmd + "\r\n")); return await readTls(); };

    await sendTls("EHLO goflexconnect.com");
    await sendTls("AUTH LOGIN");
    await sendTls(btoa(smtpUser));
    await sendTls(btoa(smtpPass));
    await sendTls(`MAIL FROM:<${smtpUser}>`);
    for (const r of toRecipients) await sendTls(`RCPT TO:<${r}>`);
    await sendTls("DATA");

    const headers = [
      `From: GoFlexConnect Support <${smtpUser}>`,
      `To: ${toRecipients.join(", ")}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      ""
    ].join("\r\n");

    await tlsConn.write(encoder.encode(headers + "\r\n" + html + "\r\n.\r\n"));
    await readTls();
    await sendTls("QUIT");
    tlsConn.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
