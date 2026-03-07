#!/usr/bin/env node
/**
 * Deployment script for budget app-v2 (static build → rsync → nginx).
 * Node 20+, zero extra dependencies.
 *
 * Deploy flow:
 *   1. pnpm run build  — build locally (tsc + vite → dist/)
 *   2. rsync dist/     — upload only changed files to the server
 *   3. Done            — nginx serves static files instantly, zero downtime
 *
 * Usage:
 *   node deploy.mjs deploy          # build locally + rsync to server
 *   node deploy.mjs upload          # rsync only (skip build, use existing dist/)
 *   node deploy.mjs nginx:reload    # reload nginx config on server
 *   node deploy.mjs nginx:test      # test nginx config on server
 *   node deploy.mjs logs [n]        # tail nginx access/error logs
 *   node deploy.mjs shell           # ssh into server
 *   node deploy.mjs help            # list all commands
 *
 * Or via npm:
 *   npm run deploy
 *   npm run deploy:upload
 *   npm run deploy:logs
 *
 * Config: create .env.deploy (gitignored) with:
 *   DEPLOY_HOST=dasfas.xyz
 *   DEPLOY_USER=root
 *   DEPLOY_DIST=/var/www/budget-app-v2   # where dist/ lands on server
 *   NGINX_LOG_DIR=/var/log/nginx         # optional, default shown
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Config ───────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv(join(__dir, '.env.deploy'));

const HOST     = (process.env.DEPLOY_HOST  ?? 'your.host.name').replace(/^https?:\/\//, '').replace(/\/$/, '');
const USER     = process.env.DEPLOY_USER   ?? 'username';
const DIST_DIR = process.env.DEPLOY_DIST   ?? '/var/www/budget-app-v2';
const LOG_DIR  = process.env.NGINX_LOG_DIR ?? '/var/log/nginx';
const TARGET   = `${USER}@${HOST}`;
const LOCAL_DIST = join(__dir, 'dist') + '/';

// ── Helpers ───────────────────────────────────────────────────────────────────

function local(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: __dir, ...opts });
}

function ssh(cmd) {
  const result = spawnSync(
    'ssh',
    ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', TARGET, cmd],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function sshTty(cmd) {
  const result = spawnSync(
    'ssh',
    ['-t', '-o', 'StrictHostKeyChecking=accept-new', TARGET, ...(cmd ? [cmd] : [])],
    { stdio: 'inherit' },
  );
  if (result.status !== 0 && result.status !== 130) process.exit(result.status ?? 1);
}

function rsync() {
  // --checksum: compare by content, not mtime (reliable for build artifacts)
  // --delete:   remove files on server that no longer exist locally
  local(
    `rsync -avz --checksum --delete --progress ${LOCAL_DIST} ${TARGET}:${DIST_DIR}/`,
  );
}

// ── Commands ──────────────────────────────────────────────────────────────────

const commands = {
  deploy() {
    if (!existsSync(LOCAL_DIST.slice(0, -1))) {
      console.log('\n  ⚙  No dist/ found — building first...\n');
    }
    console.log(`\n==> Building...`);
    local('pnpm run build');

    console.log(`\n==> Uploading to ${TARGET}:${DIST_DIR}/`);
    rsync();

    console.log('\n✅ Done.');
  },

  upload() {
    if (!existsSync(LOCAL_DIST.slice(0, -1))) {
      console.error('\n  ❌ dist/ not found. Run "node deploy.mjs deploy" to build first.\n');
      process.exit(1);
    }
    console.log(`\n==> Uploading to ${TARGET}:${DIST_DIR}/`);
    rsync();
    console.log('\n✅ Done.');
  },

  'nginx:reload'() {
    console.log(`\n==> Reloading nginx on ${TARGET}`);
    ssh('nginx -s reload');
    console.log('\n✅ Done.');
  },

  'nginx:test'() {
    console.log(`\n==> Testing nginx config on ${TARGET}`);
    ssh('nginx -t');
  },

  logs() {
    const n = args[0] ?? 50;
    sshTty(`tail -n ${n} -f ${LOG_DIR}/access.log ${LOG_DIR}/error.log`);
  },

  shell() {
    console.log(`\n==> Opening shell on ${TARGET}`);
    sshTty();
  },

  help() {
    const cmds = [
      ['deploy',        'Build locally + rsync dist/ to server'],
      ['upload',        'rsync only — skip build, use existing dist/'],
      ['nginx:reload',  'Reload nginx config on server (after nginx.conf change)'],
      ['nginx:test',    'Test nginx config validity on server'],
      ['logs [n]',      'Tail nginx access + error logs (Ctrl+C to stop)'],
      ['shell',         'SSH into server'],
      ['help',          'Show this help'],
    ];
    console.log(`\n  budget-app-v2 deploy  →  ${TARGET}:${DIST_DIR}\n`);
    for (const [cmd, desc] of cmds) {
      console.log(`  node deploy.mjs ${cmd.padEnd(22)}  ${desc}`);
    }
    console.log(`\n  Or: npm run deploy / npm run deploy:upload / etc.\n`);
  },
};

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, command = 'help', ...args] = process.argv;

const handler = commands[command];
if (!handler) {
  console.error(`\n  ❌ Unknown command: "${command}"\n`);
  commands.help();
  process.exit(1);
}

handler();
