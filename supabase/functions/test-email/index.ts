import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // SMTP credentials
    const smtpHost = "smtp.ionos.com";
    const smtpPort = 587;
    const smtpUser = "forgot@goflexconnect.com";
    const smtpPass = "El3m3nt@lg33k@3050";
    const testEmail = "newacct@goflexconnect.com";

    console.log("Attempting to connect to SMTP server...");

    // Create SMTP connection
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);

    // Read response helper
    const readResponse = async () => {
      const n = await conn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      const response = decoder.decode(buffer.subarray(0, n));
      console.log("Server:", response.trim());
      return response;
    };

    // Send command helper
    const sendCommand = async (command: string, hideInLog = false) => {
      if (!hideInLog) console.log("Client:", command);
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    // SMTP handshake
    console.log("Reading greeting...");
    await readResponse(); // Read initial greeting
    
    console.log("Sending EHLO...");
    await sendCommand("EHLO goflexconnect.com");
    
    console.log("Starting TLS...");
    await sendCommand("STARTTLS");

    // Upgrade to TLS
    console.log("Upgrading to TLS...");
    const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });

    // Re-create encoder/decoder for TLS connection
    const tlsBuffer = new Uint8Array(4096);
    const readTlsResponse = async () => {
      const n = await tlsConn.read(tlsBuffer);
      if (n === null) throw new Error("Connection closed");
      const response = decoder.decode(tlsBuffer.subarray(0, n));
      console.log("Server:", response.trim());
      return response;
    };

    const sendTlsCommand = async (command: string, hideInLog = false) => {
      if (!hideInLog) console.log("Client:", command);
      await tlsConn.write(encoder.encode(command + "\r\n"));
      return await readTlsResponse();
    };

    // Continue SMTP conversation over TLS
    console.log("Sending EHLO over TLS...");
    await sendTlsCommand("EHLO goflexconnect.com");
    
    console.log("Starting AUTH LOGIN...");
    await sendTlsCommand("AUTH LOGIN");
    
    console.log("Sending username...");
    await sendTlsCommand(btoa(smtpUser), true);
    
    console.log("Sending password...");
    await sendTlsCommand(btoa(smtpPass), true);

    console.log("Authenticated! Sending test email...");

    // Send email
    await sendTlsCommand(`MAIL FROM:<${smtpUser}>`);
    await sendTlsCommand(`RCPT TO:<${testEmail}>`);
    await sendTlsCommand("DATA");

    const emailContent = [
      `From: GoFlex Connect <${smtpUser}>`,
      `To: ${testEmail}`,
      "Subject: SMTP Test - GoFlex Connect",
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;padding:24px;">
    <img
      src="https://raw.githubusercontent.com/ipalominoPC/goflexconnect/main/public/icons/logo-128.png"
      alt="GoFlexConnect"
      width="80"
      height="80"
      style="display:block; margin:0 auto 20px auto; border:0; outline:none; text-decoration:none;"
    />
    <div style="font-size: 28px; font-weight: bold; color: #1a1a1a; padding-bottom: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      GoFlexConnect
    </div>
    <h1>SMTP Test Successful!</h1>
    <p>Your SMTP configuration is working correctly.</p>
    <p>Server: smtp.ionos.com</p>
    <p>From: forgot@goflexconnect.com</p>
  </div>
</body>
</html>`,
      ".",
    ].join("\r\n");

    console.log("Sending email content...");
    await sendTlsCommand(emailContent);
    
    console.log("Closing connection...");
    await sendTlsCommand("QUIT");
    tlsConn.close();

    console.log("✅ Email sent successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully to newacct@goflexconnect.com",
        details: "Check the function logs for SMTP conversation details"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send test email", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
