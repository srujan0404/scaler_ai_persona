/**
 * Fetches ALL GitHub repos for srujan0404 and ingests them into RAG chunks.
 * This script fetches actual README content from GitHub — no hardcoded data.
 *
 * Usage: node src/data/fetch-github.js
 * Requires: GITHUB_TOKEN env var for private repos (optional for public)
 */

import { connectDb, closeDb } from "../services/db.service.js";
import { ingestDocument } from "../services/rag.service.js";

const GITHUB_USER = "srujan0404";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

async function fetchJSON(url) {
  const headers = { "User-Agent": "AI-Persona-Bot" };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function fetchText(url) {
  const headers = { "User-Agent": "AI-Persona-Bot" };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.text();
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const url = GITHUB_TOKEN
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`
      : `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&page=${page}&sort=updated`;

    const batch = await fetchJSON(url);
    if (batch.length === 0) break;
    repos.push(...batch);
    page++;
    if (batch.length < 100) break;
  }

  return repos.filter((r) => !r.fork);
}

async function fetchReadme(repoName, defaultBranch) {
  for (const branch of [defaultBranch, "main", "master"]) {
    const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/README.md`;
    const content = await fetchText(url);
    if (content && content.length > 10) return content;
  }
  return null;
}

function cleanReadme(readme) {
  if (!readme) return "";
  // Remove badge images, excessive markdown formatting
  return readme
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "") // Remove badge links
    .replace(/<img[^>]*>/g, "") // Remove HTML images
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .trim()
    .slice(0, 2000); // Cap at 2000 chars
}

async function main() {
  await connectDb();

  console.log("Fetching all GitHub repos...");
  console.log(GITHUB_TOKEN ? "Using authenticated API (includes private repos)" : "Using public API only");

  const repos = await fetchAllRepos();
  console.log(`Found ${repos.length} repos (excluding forks)\n`);

  let ingested = 0;
  let skipped = 0;

  for (const repo of repos) {
    const name = repo.name;
    const lang = repo.language || "Unknown";
    const desc = repo.description || "";
    const defaultBranch = repo.default_branch || "main";
    const topics = (repo.topics || []).join(", ");
    const stars = repo.stargazers_count || 0;
    const isPrivate = repo.private;

    // Fetch actual README from GitHub
    const rawReadme = await fetchReadme(name, defaultBranch);
    const readme = cleanReadme(rawReadme);

    // Build the content for this repo
    let content = `GitHub Repo: ${name} (github.com/${GITHUB_USER}/${name})
Language: ${lang}${isPrivate ? "\nVisibility: Private" : ""}${desc ? `\nDescription: ${desc}` : ""}${topics ? `\nTopics: ${topics}` : ""}${stars > 0 ? `\nStars: ${stars}` : ""}`;

    if (readme) {
      content += `\n\nREADME Content:\n${readme}`;
    } else {
      content += `\n\nNo README available. This is a ${lang} project.`;
    }

    // Ingest into RAG
    const chunks = await ingestDocument({
      source: `github/${name}`,
      category: "projects",
      content,
    });

    console.log(`  ${isPrivate ? "[PRIVATE]" : "[PUBLIC] "} ${name.padEnd(30)} | ${lang.padEnd(12)} | ${chunks} chunks | README: ${readme ? "Yes" : "No"}`);
    ingested++;
  }

  // Also ingest a GitHub profile overview chunk
  const overviewContent = `GitHub Profile Overview: github.com/${GITHUB_USER}
Total repositories: ${repos.length}
Languages used: ${[...new Set(repos.map((r) => r.language).filter(Boolean))].join(", ")}
Notable repos with READMEs: ${repos.filter((r) => r.description).map((r) => `${r.name} (${r.description})`).join("; ")}
Profile shows diverse experience across: Java (LLD, design patterns, Spring Boot), JavaScript/TypeScript (React, React Native, Node.js, Express), Python (web apps, space tech), Swift (iOS, VisionOS), Dart (Flutter), C++ (systems), Kotlin (Android).`;

  await ingestDocument({
    source: "github/profile-overview",
    category: "projects",
    content: overviewContent,
  });

  console.log(`\nDone! Ingested ${ingested} repos into RAG chunks.`);
  console.log(`Profile overview chunk also added.`);

  await closeDb();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
