import { MongoClient } from "mongodb";
import { config } from "../config/env.js";

let client;
let db;

export async function connectDb() {
  client = new MongoClient(config.mongodb.uri);
  await client.connect();
  db = client.db();
  console.log("Connected to MongoDB");
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected. Call connectDb() first.");
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}
