import { config } from "../config/env.js";
import { getDb } from "./db.service.js";

const CALENDLY_AUTH_URL = "https://auth.calendly.com/oauth/authorize";
const CALENDLY_TOKEN_URL = "https://auth.calendly.com/oauth/token";
const CALENDLY_API_URL = "https://api.calendly.com";
const TOKEN_COLLECTION = "calendly_tokens";

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.calendly.clientId,
    response_type: "code",
    redirect_uri: config.calendly.redirectUri,
  });
  return `${CALENDLY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const response = await fetch(CALENDLY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: config.calendly.clientId,
      client_secret: config.calendly.clientSecret,
      redirect_uri: config.calendly.redirectUri,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Calendly token exchange failed: ${JSON.stringify(data)}`);
  }

  // Store token in DB
  const db = getDb();
  await db.collection(TOKEN_COLLECTION).updateOne(
    { provider: "calendly" },
    {
      $set: {
        provider: "calendly",
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return data;
}

export async function getAccessToken() {
  const db = getDb();
  const tokenDoc = await db.collection(TOKEN_COLLECTION).findOne({ provider: "calendly" });

  if (!tokenDoc) return null;

  // Check if expired and refresh
  if (new Date() >= tokenDoc.expiresAt) {
    return refreshToken(tokenDoc.refreshToken);
  }

  return tokenDoc.accessToken;
}

async function refreshToken(refreshToken) {
  const response = await fetch(CALENDLY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.calendly.clientId,
      client_secret: config.calendly.clientSecret,
    }),
  });

  const data = await response.json();
  if (!response.ok) return null;

  const db = getDb();
  await db.collection(TOKEN_COLLECTION).updateOne(
    { provider: "calendly" },
    {
      $set: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    }
  );

  return data.access_token;
}

export async function getCurrentUser(accessToken) {
  const response = await fetch(`${CALENDLY_API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.json();
}

export async function getEventTypes(accessToken, userUri) {
  const response = await fetch(
    `${CALENDLY_API_URL}/event_types?user=${encodeURIComponent(userUri)}&active=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.json();
}

export async function getCalendlyAvailableTimes(accessToken, eventTypeUri, daysAhead = 7) {
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    event_type: eventTypeUri,
    start_time: startTime,
    end_time: endTime,
  });

  const response = await fetch(
    `${CALENDLY_API_URL}/event_type_available_times?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.json();
}

export async function getSchedulingLink(accessToken) {
  const user = await getCurrentUser(accessToken);
  const userUri = user.resource.uri;
  const eventTypes = await getEventTypes(accessToken, userUri);

  if (eventTypes.collection && eventTypes.collection.length > 0) {
    return eventTypes.collection[0].scheduling_url;
  }

  return null;
}
