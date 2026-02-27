#!/usr/bin/env node
/**
 * Sync exports from a Notion database into the repo.
 * Expects env: NOTION_TOKEN, NOTION_DATABASE_ID.
 * Queries the database for pages with status "Ready to sync" (or similar),
 * exports each page to markdown under docs/notion-exports/ (or NOTION_EXPORT_DIR).
 *
 * Run: node scripts/notion_sync.mjs
 * In CI: workflow passes NOTION_TOKEN and NOTION_DATABASE_ID from secrets.
 */

import { Client } from '@notionhq/client'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID
const EXPORT_DIR = process.env.NOTION_EXPORT_DIR || join(rootDir, 'docs', 'notion-exports')

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_TOKEN })

/** Get plain text from a rich text array. */
function richTextToPlain(richText) {
  if (!Array.isArray(richText)) return ''
  return richText.map((t) => t.plain_text || '').join('')
}

/** Recursively get block content as markdown-like lines. */
async function blocksToMarkdown(blockId, indent = 0) {
  const { results } = await notion.blocks.children.list({ block_id: blockId })
  const lines = []
  const prefix = '  '.repeat(indent)
  for (const block of results) {
    const b = block
    if (b.type === 'paragraph' && b.paragraph?.rich_text) {
      lines.push(prefix + richTextToPlain(b.paragraph.rich_text))
    } else if (b.type === 'heading_1' && b.heading_1?.rich_text) {
      lines.push(prefix + '# ' + richTextToPlain(b.heading_1.rich_text))
    } else if (b.type === 'heading_2' && b.heading_2?.rich_text) {
      lines.push(prefix + '## ' + richTextToPlain(b.heading_2.rich_text))
    } else if (b.type === 'heading_3' && b.heading_3?.rich_text) {
      lines.push(prefix + '### ' + richTextToPlain(b.heading_3.rich_text))
    } else if (b.type === 'bulleted_list_item' && b.bulleted_list_item?.rich_text) {
      lines.push(prefix + '- ' + richTextToPlain(b.bulleted_list_item.rich_text))
    } else if (b.type === 'numbered_list_item' && b.numbered_list_item?.rich_text) {
      lines.push(prefix + '1. ' + richTextToPlain(b.numbered_list_item.rich_text))
    } else if (b.type === 'to_do' && b.to_do?.rich_text) {
      const done = b.to_do.checked ? 'x' : ' '
      lines.push(prefix + `- [${done}] ` + richTextToPlain(b.to_do.rich_text))
    } else if (b.type === 'code' && b.code?.rich_text) {
      lines.push(prefix + '```\n' + richTextToPlain(b.code.rich_text) + '\n```')
    } else if (b.type === 'quote' && b.quote?.rich_text) {
      lines.push(prefix + '> ' + richTextToPlain(b.quote.rich_text))
    }
    if (b.has_children) {
      const child = await blocksToMarkdown(b.id, indent + 1)
      lines.push(...child)
    }
  }
  return lines
}

/** Sanitize a string for use in a filename. */
function slug(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'untitled'
}

async function main() {
  // Query database: filter by Status = "Ready to sync" (adjust property name to match your DB)
  const { results } = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      or: [
        { property: 'Status', select: { equals: 'Ready to sync' } },
        { property: 'Ready to sync', checkbox: { equals: true } },
      ],
    },
  })

  if (results.length === 0) {
    console.log('No "Ready to sync" pages found.')
    return
  }

  mkdirSync(EXPORT_DIR, { recursive: true })

  for (const page of results) {
    const title = richTextToPlain(page.properties?.title?.title ?? page.properties?.Name?.title ?? [])
    const safeName = slug(title) || page.id.replace(/-/g, '')
    const filePath = join(EXPORT_DIR, `${safeName}.md`)
    const body = await blocksToMarkdown(page.id)
    const content = `# ${title}\n\nNotion page ID: ${page.id}\n\n${body.join('\n')}\n`
    writeFileSync(filePath, content, 'utf8')
    console.log('Exported:', title, '->', filePath)
  }

  console.log('Sync complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
