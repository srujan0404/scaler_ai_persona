import { getDb } from "./db.service.js";

const COLLECTION = "knowledge_base";

export async function getKnowledgeBase() {
  const db = getDb();
  const docs = await db.collection(COLLECTION).find({}).toArray();

  // Merge all knowledge docs into a single object
  const knowledgeBase = {
    name: "",
    personal: "",
    education: "",
    experience: "",
    skills: "",
    projects: "",
    whyThisRole: "",
  };

  for (const doc of docs) {
    if (knowledgeBase[doc.category] !== undefined) {
      knowledgeBase[doc.category] = doc.content;
    }
    if (doc.category === "name") {
      knowledgeBase.name = doc.content;
    }
  }

  return knowledgeBase;
}

export async function upsertKnowledge(category, content) {
  const db = getDb();
  await db.collection(COLLECTION).updateOne(
    { category },
    { $set: { category, content, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function seedKnowledgeBase(data) {
  const db = getDb();
  const ops = Object.entries(data).map(([category, content]) => ({
    updateOne: {
      filter: { category },
      update: { $set: { category, content, updatedAt: new Date() } },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await db.collection(COLLECTION).bulkWrite(ops);
  }
  console.log(`Seeded ${ops.length} knowledge base entries`);
}
