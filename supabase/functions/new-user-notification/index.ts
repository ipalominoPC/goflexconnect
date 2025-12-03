import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    created_at: string;
  };
  schema: string;
  old_record: null | any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Received webhook payload:", payload);

    if (payload.type === "INSERT" && payload.table === "users") {
      const { email, created_at } = payload.record;

      // Send notification email
      const emailSent = await sendNotificationEmail(email, created_at);

      if (emailSent) {
        return new Response(
          JSON.stringify({ success: true, message: "Notification sent" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        throw new Error("Failed to send notification email");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "No action taken" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process webhook", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendNotificationEmail(userEmail: string, createdAt: string): Promise<boolean> {
  try {
    const smtpHost = "smtp.ionos.com";
    const smtpPort = 587;
    const smtpUser = "forgot@goflexconnect.com";
    const smtpPass = "El3m3nt@lg33k@3050";
    const notificationEmail = "newacct@goflexconnect.com";

    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);

    const readResponse = async () => {
      const n = await conn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buffer.subarray(0, n));
    };

    const sendCommand = async (command: string) => {
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    await readResponse();
    await sendCommand("EHLO goflexconnect.com");
    await sendCommand("STARTTLS");

    const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });

    const tlsBuffer = new Uint8Array(4096);
    const readTlsResponse = async () => {
      const n = await tlsConn.read(tlsBuffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(tlsBuffer.subarray(0, n));
    };

    const sendTlsCommand = async (command: string) => {
      await tlsConn.write(encoder.encode(command + "\r\n"));
      return await readTlsResponse();
    };

    await sendTlsCommand("EHLO goflexconnect.com");
    await sendTlsCommand("AUTH LOGIN");
    await sendTlsCommand(btoa(smtpUser));
    await sendTlsCommand(btoa(smtpPass));

    await sendTlsCommand(`MAIL FROM:<${smtpUser}>`);
    await sendTlsCommand(`RCPT TO:<${notificationEmail}>`);
    await sendTlsCommand("DATA");

    const date = new Date(createdAt).toLocaleString();
    const emailContent = [
      `From: GoFlex Connect <${smtpUser}>`,
      `To: ${notificationEmail}`,
      "Subject: New User Registration - GoFlex Connect",
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
    <h2>New User Registration</h2>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Registration Time:</strong> ${date}</p>
    <hr>
    <p><em>This is an automated notification from GoFlexConnect</em></p>
  </div>
</body>
</html>`,
      ".",
    ].join("\r\n");

    await sendTlsCommand(emailContent);
    await sendTlsCommand("QUIT");
    tlsConn.close();

    console.log("Notification email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
}
