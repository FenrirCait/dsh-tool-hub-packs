#!/usr/bin/env node
/**
 * Build index.json for the official compat pack repository.
 *
 * Every file is hashed; the manager downloads exactly these URLs and verifies each sha256.
 * Usage: node scripts/build-index.mjs [owner/repo] [branch]
 */
import { createHash } from 'node:crypto'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ownerRepo = process.argv[2] ?? 'FenrirCait/dsh-tool-hub-packs'
const branch = process.argv[3] ?? 'main'
const raw = (path) => `https://raw.githubusercontent.com/${ownerRepo}/${branch}/${path.split('\\').join('/')}`
const packsDir = join(root, 'packs')
const entries = []

async function walk(dir) {
  const out = []
  for (const name of (await readdir(dir)).sort()) {
    const full = join(dir, name)
    const info = await stat(full)
    if (info.isDirectory()) out.push(...await walk(full))
    else if (info.isFile()) out.push(full)
  }
  return out
}

for (const id of (await readdir(packsDir)).sort()) {
  const dir = join(packsDir, id)
  if (!(await stat(dir)).isDirectory()) continue
  const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'))
  const files = []
  for (const file of await walk(dir)) {
    const rel = relative(dir, file).split('\\').join('/')
    const bytes = await readFile(file)
    files.push({ path: rel, url: raw('packs/' + id + '/' + rel), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
  entries.push({
    id,
    name: manifest.name,
    version: manifest.version,
    ...(manifest.description === undefined ? {} : { description: manifest.description }),
    files,
  })
}

const index = { schema: 1, generatedAt: new Date().toISOString(), packs: entries }
await writeFile(join(root, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')
console.log('index.json:', entries.length, 'pack(s)', entries.map(entry => entry.id + '@' + entry.version).join(', '))
