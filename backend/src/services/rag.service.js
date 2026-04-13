import { getDb } from "./db.service.js";

const CHUNKS_COLLECTION = "rag_chunks";

export async function ingestDocument({ source, category, content, metadata = {} }) {
  const db = getDb();
  const chunks = chunkText(content, 500);

  const docs = chunks.map((chunk, i) => ({
    source,
    category,
    content: chunk,
    chunkIndex: i,
    keywords: extractKeywords(chunk),
    metadata,
    createdAt: new Date(),
  }));

  await db.collection(CHUNKS_COLLECTION).deleteMany({ source });

  if (docs.length > 0) {
    await db.collection(CHUNKS_COLLECTION).insertMany(docs);
  }

  return docs.length;
}

export async function retrieveContext(query, maxChunks = 8) {
  const db = getDb();

  // Ensure text index exists
  try {
    await db.collection(CHUNKS_COLLECTION).createIndex(
      { content: "text", keywords: "text", source: "text" },
      { name: "rag_text_index" }
    );
  } catch {}

  const results = [];
  const seenIds = new Set();

  function addResult(doc) {
    const id = doc._id.toString();
    if (!seenIds.has(id) && results.length < maxChunks) {
      seenIds.add(id);
      results.push(doc);
    }
  }

  // Step 1: ALWAYS get resume chunks for the detected category first
  // Resume data should be prioritized over GitHub repos for core questions
  const category = classifyQuery(query);
  const resumeChunks = await db
    .collection(CHUNKS_COLLECTION)
    .find({ source: "resume", category })
    .toArray();
  resumeChunks.forEach(addResult);

  // Step 2: MongoDB full-text search (finds both resume + GitHub matches)
  try {
    const textResults = await db
      .collection(CHUNKS_COLLECTION)
      .find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(maxChunks)
      .toArray();
    textResults.forEach(addResult);
  } catch {}

  // Step 3: Keyword regex fallback
  if (results.length < maxChunks) {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const regexPatterns = queryWords.map((w) => new RegExp(w, "i"));

    const keywordResults = await db
      .collection(CHUNKS_COLLECTION)
      .find({
        $or: [
          ...regexPatterns.map((p) => ({ content: p })),
          ...regexPatterns.map((p) => ({ keywords: p })),
        ],
      })
      .limit(maxChunks * 2)
      .toArray();
    keywordResults.forEach(addResult);
  }

  // Step 4: Category fallback if still too few
  if (results.length < 3) {
    const categoryResults = await db
      .collection(CHUNKS_COLLECTION)
      .find({ category })
      .limit(maxChunks)
      .toArray();
    categoryResults.forEach(addResult);
  }

  return results.map((r) => ({
    content: r.content,
    source: r.source,
    category: r.category,
  }));
}

export async function getAllChunks() {
  const db = getDb();
  return db.collection(CHUNKS_COLLECTION).find({}).toArray();
}

function chunkText(text, maxChars = 500) {
  if (!text) return [];

  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function extractKeywords(text) {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "and", "or", "but", "not", "that", "this", "it", "as", "if", "then",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return [...new Set(words)].join(" ");
}

function classifyQuery(query) {
  const q = query.toLowerCase();
  if (q.match(/education|college|university|degree|cgpa|gpa|school|bits|scaler/)) return "education";
  if (q.match(/experience|work|job|intern|pazcare|urban company|company/)) return "experience";
  if (q.match(/skill|tech|language|framework|stack|python|java|react|node/)) return "skills";
  if (q.match(/project|github|repo|built|build|gemstone|challengemob|portfolio/)) return "projects";
  if (q.match(/why|hire|fit|role|strength|right person|candidate/)) return "whyThisRole";
  if (q.match(/book|meeting|schedule|available|slot|calendar/)) return "availability";
  return "personal";
}
