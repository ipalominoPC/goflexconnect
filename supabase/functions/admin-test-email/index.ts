import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Admin email addresses - hardcoded for reliability
const ADMIN_EMAILS = [
  "ipalomino@gmail.com",
  "isaac@goflexconnect.com",
  "dev@goflexconnect.com",
];

// SMTP Configuration
const SMTP_CONFIG = {
  host: "smtp.ionos.com",
  port: 587,
  user: "forgot@goflexconnect.com",
  pass: "El3m3nt@lg33k@3050",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  const testId = `test-${startTime}`;

  try {
    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user (optional - for logging)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log(`[${testId}] Starting admin email test...`);
    console.log(`[${testId}] Recipients: ${ADMIN_EMAILS.join(", ")}`);

    // Validate SMTP config
    if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
      throw new Error("SMTP credentials not configured");
    }

    // Connect to SMTP server
    const conn = await Deno.connect({
      hostname: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);

    // Helper: Read SMTP response
    const readResponse = async () => {
      const n = await conn.read(buffer);
      if (n === null) throw new Error("SMTP connection closed unexpectedly");
      return decoder.decode(buffer.subarray(0, n));
    };

    // Helper: Send SMTP command
    const sendCommand = async (command: string) => {
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    let tlsConn;

    try {
      // SMTP handshake
      await readResponse(); // Initial greeting
      await sendCommand("EHLO goflexconnect.com");
      await sendCommand("STARTTLS");

      // Upgrade to TLS
      tlsConn = await Deno.startTls(conn, { hostname: SMTP_CONFIG.host });

      const tlsBuffer = new Uint8Array(4096);
      const readTlsResponse = async () => {
        const n = await tlsConn!.read(tlsBuffer);
        if (n === null) throw new Error("TLS connection closed unexpectedly");
        return decoder.decode(tlsBuffer.subarray(0, n));
      };

      const sendTlsCommand = async (command: string) => {
        await tlsConn!.write(encoder.encode(command + "\r\n"));
        return await readTlsResponse();
      };

      // Authenticate
      await sendTlsCommand("EHLO goflexconnect.com");
      await sendTlsCommand("AUTH LOGIN");
      await sendTlsCommand(btoa(SMTP_CONFIG.user));
      await sendTlsCommand(btoa(SMTP_CONFIG.pass));

      // Send email to all admin recipients
      await sendTlsCommand(`MAIL FROM:<${SMTP_CONFIG.user}>`);

      // Add all recipients
      for (const email of ADMIN_EMAILS) {
        await sendTlsCommand(`RCPT TO:<${email}>`);
      }

      await sendTlsCommand("DATA");

      // Build email content
      const timestamp = new Date().toISOString();
      const emailContent = [
        `From: GoFlex Connect <${SMTP_CONFIG.user}>`,
        `To: ${ADMIN_EMAILS.join(", ")}`,
        "Subject: [GoFlexConnect] Admin Email Test",
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
      GoFlexConnect Admin
    </div>
    <h2>Admin Email Test - SUCCESS</h2>
    <p><strong>Test ID:</strong> ${testId}</p>
    <p><strong>Timestamp:</strong> ${timestamp}</p>
    <p><strong>Recipients:</strong> ${ADMIN_EMAILS.length} admin(s)</p>
    <hr>
    <p>This is an automated test email from the GoFlexConnect Admin Dashboard.</p>
    <p><em>If you received this, SMTP and admin email routing are working correctly.</em></p>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      GoFlexConnect Admin System
    </p>
  </div>
</body>
</html>`,
        ".",
      ].join("\r\n");

      await sendTlsCommand(emailContent);
      await sendTlsCommand("QUIT");

      const duration = Date.now() - startTime;

      console.log(`[${testId}] ✅ Email sent successfully in ${duration}ms`);

      // Log success to admin_alerts
      await supabase.from("admin_alerts").insert({
        type: "test_email",
        user_id: userId,
        title: "Admin test email sent",
        message: `Admin test email sent successfully to ${ADMIN_EMAILS.length} recipient(s) from Admin Dashboard.`,
        metadata: {
          testId,
          timestamp,
          recipients: ADMIN_EMAILS,
          duration,
          success: true,
          triggeredBy: "Admin Dashboard",
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Test email sent successfully to ${ADMIN_EMAILS.length} admin recipient(s)`,
          details: `Delivered in ${duration}ms`,
          testId,
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
        conn.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[${testId}] ❌ Error after ${duration}ms:`, errorMessage);

    // Attempt to log failure to admin_alerts
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("admin_alerts").insert({
        type: "test_email",
        user_id: null,
        title: "Admin test email FAILED",
        message: `Admin test email failed: ${errorMessage}`,
        metadata: {
          testId,
          timestamp: new Date().toISOString(),
          recipients: ADMIN_EMAILS,
          duration,
          success: false,
          error: errorMessage,
          triggeredBy: "Admin Dashboard",
        },
      });
    } catch (logError) {
      console.error("Failed to log error to admin_alerts:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send test email",
        message: errorMessage,
        details: `Failed after ${duration}ms`,
        testId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
