import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize recipients to array
    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients specified" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SMTP credentials
    const smtpHost = "smtp.ionos.com";
    const smtpPort = 587;
    const smtpUser = "forgot@goflexconnect.com";
    const smtpPass = "El3m3nt@lg33k@3050";

    // Validate SMTP credentials exist
    if (!smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({
          error: "SMTP configuration missing",
          details: "Email credentials not configured"
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let conn;
    let tlsConn;

    try {
      // Create SMTP connection with timeout
      conn = await Deno.connect({
        hostname: smtpHost,
        port: smtpPort,
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(4096);

      // Read response helper
      const readResponse = async () => {
        const n = await conn!.read(buffer);
        if (n === null) throw new Error("Connection closed");
        return decoder.decode(buffer.subarray(0, n));
      };

      // Send command helper
      const sendCommand = async (command: string) => {
        await conn!.write(encoder.encode(command + "\r\n"));
        return await readResponse();
      };

      // SMTP handshake
      await readResponse(); // Read initial greeting
      await sendCommand("EHLO goflexconnect.com");
      await sendCommand("STARTTLS");

      // Upgrade to TLS
      tlsConn = await Deno.startTls(conn, { hostname: smtpHost });

      // Re-create encoder/decoder for TLS connection
      const tlsBuffer = new Uint8Array(4096);
      const readTlsResponse = async () => {
        const n = await tlsConn!.read(tlsBuffer);
        if (n === null) throw new Error("Connection closed");
        return decoder.decode(tlsBuffer.subarray(0, n));
      };

      const sendTlsCommand = async (command: string) => {
        await tlsConn!.write(encoder.encode(command + "\r\n"));
        return await readTlsResponse();
      };

      // Continue SMTP conversation over TLS
      await sendTlsCommand("EHLO goflexconnect.com");
      await sendTlsCommand("AUTH LOGIN");
      await sendTlsCommand(btoa(smtpUser));
      await sendTlsCommand(btoa(smtpPass));

      // Send email to all recipients
      await sendTlsCommand(`MAIL FROM:<${smtpUser}>`);

      // Add all recipients
      for (const recipient of recipients) {
        await sendTlsCommand(`RCPT TO:<${recipient}>`);
      }

      await sendTlsCommand("DATA");

      // Build email with all recipients in To header
      const emailContent = [
        `From: GoFlex Connect <${smtpUser}>`,
        `To: ${recipients.join(", ")}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
        ".",
      ].join("\r\n");

      await sendTlsCommand(emailContent);
      await sendTlsCommand("QUIT");

      return new Response(
        JSON.stringify({
          success: true,
          message: `Email sent successfully to ${recipients.length} recipient(s)`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } finally {
      // Always close connections
      try {
        if (tlsConn) tlsConn.close();
      } catch (e) {
        console.error("Error closing TLS connection:", e);
      }
      try {
        if (conn) conn.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});