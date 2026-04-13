import { Router } from "express";
import {
  getAuthUrl,
  exchangeCodeForToken,
  getAccessToken,
  getCurrentUser,
  getSchedulingLink,
} from "../services/calendly.service.js";
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  isGoogleConnected,
} from "../services/google-calendar.service.js";

const router = Router();

// Step 1: Redirect to Calendly OAuth
router.get("/calendly", (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Handle callback
router.get("/calendly/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    await exchangeCodeForToken(code);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Calendly Connected Successfully!</h1>
          <p>You can close this window now.</p>
          <p>Your AI persona can now access your Calendly availability.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Calendly OAuth error:", error);
    res.status(500).send(`OAuth error: ${error.message}`);
  }
});

// Check Calendly connection status
router.get("/calendly/status", async (req, res) => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return res.json({ connected: false });
    }

    const user = await getCurrentUser(token);
    const schedulingUrl = await getSchedulingLink(token);

    res.json({
      connected: true,
      user: user.resource?.name,
      email: user.resource?.email,
      schedulingUrl,
    });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// ---- Google Calendar OAuth ----

// Step 1: Redirect to Google OAuth
router.get("/google", (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Handle Google callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    await exchangeGoogleCode(code);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Google Calendar Connected!</h1>
          <p>Bookings will now automatically create Google Calendar events with Google Meet links.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).send(`OAuth error: ${error.message}`);
  }
});

// Check Google connection status
router.get("/google/status", async (req, res) => {
  try {
    const connected = await isGoogleConnected();
    res.json({ connected });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// Status of all integrations
router.get("/status", async (req, res) => {
  const googleConnected = await isGoogleConnected().catch(() => false);
  const calendlyToken = await getAccessToken().catch(() => null);
  res.json({
    google: { connected: googleConnected },
    calendly: { connected: !!calendlyToken },
  });
});

export default router;
