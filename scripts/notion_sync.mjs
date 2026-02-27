import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";
import { execSync } from "node:child_process";

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionToken) throw new Error("Missing env NOTION_TOKEN");
if (!databaseId) throw new Error("Missing env NOTION_DATABASE_ID");

const notion = new Client({ auth: notionToken });

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function parseArtifactToFiles(artifactText) {
  const lines = artifactText.replace(/\r\n/g, "\n").split("\n");

  const files = [];
  let currentPath = null;
  let buf = [];

  function flush() {
    if (!currentPath) return;
    let content = buf.join("\n");
    if (content.endsWith("\n")) content = content.slice(0, -1);
    files.push({ filePath: currentPath, content });
    currentPath = null;
    buf = [];
  }

  for (const line of lines) {
    const m = line.match(/^FILE:\s+(.+)\s*$/);
    if (m) {
      flush();
      currentPath = m[1].trim();
      continue;
    }
    if (currentPath) buf.push(line);
  }
  flush();

  return files;
}

function readPlainTextProperty(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop) return null;

  if (prop.type === "rich_text") {
    return prop.rich_text.map(rt => rt.plain_text).join("");
  }
  if (prop.type === "title") {
    return prop.title.map(t => t.plain_text).join("");
  }
  return null;
}

async function updateStatus(pageId, statusName) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { status: { name: statusName } },
    },
  });
}

async function updateText(pageId, propName, text) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [propName]: {
        rich_text: [{ type: "text", text: { content: text } }],
      },
    },
  });
}

async function main() {
  // Query all pages with Status = "Ready to sync"
  const ready = [];
  let cursor = undefined;

  do {
    const resp = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      filter: {
        property: "Status",
        status: { equals: "Ready to sync" },
      },
      sorts: [{ property: "Exported at", direction: "ascending" }], // oldest first
    });

    ready.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  if (ready.length === 0) {
    console.log("No exports in 'Ready to sync'.");
    return;
  }

  console.log(`Found ${ready.length} export(s) ready to sync.`);

  for (const page of ready) {
    const pageId = page.id;
    const title = readPlainTextProperty(page, "Title") || "(untitled export)";
    const commitMsg =
      readPlainTextProperty(page, "Commit message") ||
      `Sync from Notion export: ${title}`;

    const artifact = readPlainTextProperty(page, "Artifact");
    if (!artifact || artifact.trim().length === 0) {
      await updateStatus(pageId, "Draft");
      await updateText(pageId, "Sync log", "Artifact was empty; moved back to Draft.");
      continue;
    }

    try {
      // Move out of Ready-to-sync immediately to prevent double-processing
      await updateStatus(pageId, "Draft");

      const files = parseArtifactToFiles(artifact);
      if (files.length === 0) {
        await updateText(pageId, "Sync log", "No FILE: blocks found in Artifact.");
        continue;
      }

      // Write files
      for (const f of files) {
        ensureDirForFile(f.filePath);
        fs.writeFileSync(f.filePath, f.content, "utf8");
      }

      // Stage + commit + push
      execSync("git add -A", { stdio: "inherit" });

      const porcelain = execSync("git status --porcelain").toString("utf8").trim();
      if (!porcelain) {
        await updateStatus(pageId, "Synced");
        await updateText(
          pageId,
          "Sync log",
          `No repo changes after applying ${files.length} file(s). Marked as Synced.`
        );
        continue;
      }

      execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { stdio: "inherit" });
      execSync("git push", { stdio: "inherit" });

      const sha = execSync("git rev-parse HEAD").toString("utf8").trim();

      await updateStatus(pageId, "Synced");
      await updateText(pageId, "Commit SHA", sha);
      await updateText(pageId, "Sync log", `Applied ${files.length} file(s).\nSHA: ${sha}`);
    } catch (err) {
      const msg = err?.stack || String(err);
      // Requires you to add a "Failed" status option in the Notion DB
      await updateStatus(pageId, "Failed").catch(() => {});
      await updateText(pageId, "Sync log", `Sync failed:\n${msg}`).catch(() => {});
    }
  }
}

await main();