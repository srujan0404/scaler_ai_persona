import { google } from "googleapis";
import { config } from "../config/env.js";
import { getDb } from "./db.service.js";

const TOKEN_COLLECTION = "google_tokens";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

export function getGoogleAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function exchangeGoogleCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens in DB
  const db = getDb();
  await db.collection(TOKEN_COLLECTION).updateOne(
    { provider: "google" },
    {
      $set: {
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
        tokenData: tokens,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return tokens;
}

async function getAuthedClient() {
  const db = getDb();
  const tokenDoc = await db.collection(TOKEN_COLLECTION).findOne({ provider: "google" });

  if (!tokenDoc) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken,
    expiry_date: tokenDoc.expiresAt.getTime(),
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    const update = { updatedAt: new Date() };
    if (tokens.access_token) update.accessToken = tokens.access_token;
    if (tokens.expiry_date) update.expiresAt = new Date(tokens.expiry_date);
    await db.collection(TOKEN_COLLECTION).updateOne(
      { provider: "google" },
      { $set: update }
    );
  });

  return oauth2Client;
}

export async function isGoogleConnected() {
  const db = getDb();
  const tokenDoc = await db.collection(TOKEN_COLLECTION).findOne({ provider: "google" });
  return !!tokenDoc;
}

export async function createCalendarEvent({ date, time, name, email, purpose }) {
  const auth = await getAuthedClient();
  if (!auth) {
    console.log("Google Calendar not connected — skipping event creation");
    return null;
  }

  const calendar = google.calendar({ version: "v3", auth });

  // Build local time strings — let Google handle timezone conversion
  const startDateTime = `${date}T${time}:00`;
  // 30 min meeting
  const [hour, minute] = time.split(":").map(Number);
  const endMinute = minute + 30;
  const endHour = hour + Math.floor(endMinute / 60);
  const endTime = `${date}T${String(endHour).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}:00`;

  const event = {
    summary: `Meeting with ${name}`,
    description: `Purpose: ${purpose || "Interview discussion"}\nBooked via AI Persona`,
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endTime,
      timeZone: "Asia/Kolkata",
    },
    attendees: email ? [{ email }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `ai-persona-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  try {
    const result = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: email ? "all" : "none",
    });

    console.log(`Google Calendar event created: ${result.data.htmlLink}`);
    return {
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      meetLink: result.data.hangoutLink || result.data.conferenceData?.entryPoints?.[0]?.uri,
    };
  } catch (error) {
    console.error("Failed to create Google Calendar event:", error.message);
    return null;
  }
}
