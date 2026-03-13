#!/usr/bin/env node
// ─── Deploy script ───────────────────────────────────────────
// Run after `npm run build`. Copies dist/ into the gh-pages repo
// and pushes to GitHub.

import { execSync } from 'child_process'
import { cpSync, rmSync, existsSync } from 'fs'
import { resolve } from 'path'

const DIST    = resolve(import.meta.dirname, '..', 'dist')
const DEPLOY  = resolve(import.meta.dirname, '..', '..', 'terrawatch-pwa')
const GIT_URL = 'https://github.com/lovizotto/Terrawatch.git'
const BRANCH  = 'gh-pages'

function run(cmd, opts = {}) {
  console.log(`▶ ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', ...opts })
}

// 1. Wipe old assets in deploy repo
if (existsSync(`${DEPLOY}/assets`)) {
  rmSync(`${DEPLOY}/assets`, { recursive: true })
}

// 2. Copy fresh build
cpSync(DIST, DEPLOY, { recursive: true })
console.log('✓ dist → terrawatch-pwa')

// 3. Git commit & push
const msg = `feat: Rust/WASM build ${new Date().toISOString().slice(0, 16)}`
run(`git -C "${DEPLOY}" add -A`)
run(`git -C "${DEPLOY}" commit -m "${msg}"`)

const token = process.env.GIT_PASSWORD ?? ''
const user  = process.env.GIT_USERNAME ?? 'lovizotto'
const auth  = `https://${user}:${token}@github.com/lovizotto/Terrawatch.git`
run(
  `git -C "${DEPLOY}" -c credential.helper="" push "${auth}" ${BRANCH}`,
  { stdio: ['ignore', 'inherit', 'ignore'] }
)

console.log('✓ Pushed to gh-pages')
