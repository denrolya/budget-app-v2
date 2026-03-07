#!/usr/bin/env node
/**
 * Deployment script for budget app-v2 (static build → rsync → nginx).
 * Node 20+, zero extra dependencies.
 *
 * Release-based deploy:
 *   Keeps the last N releases on the server and switches the `current`
 *   symlink atomically — zero downtime, instant rollback.
 *
 *   /var/www/app-v2/
 *   ├── releases/
 *   │   ├── 20260307_143022/   ← old
 *   │   └── 20260307_160000/   ← current
 *   └── current -> releases/20260307_160000
 *
 * Usage:
 *   node deploy.mjs deploy          # build + upload new release + go live
 *   node deploy.mjs upload          # upload only (skip build, use existing dist/)
 *   node deploy.mjs releases        # list releases on server
 *   node deploy.mjs rollback [n]    # roll back n releases (default: 1 = previous)
 *   node deploy.mjs nginx:reload    # reload nginx on server
 *   node deploy.mjs nginx:test      # test nginx config on server
 *   node deploy.mjs logs [n]        # tail nginx access/error logs
 *   node deploy.mjs shell           # ssh into server
 *   node deploy.mjs help            # list all commands
 *
 * Config: .env (gitignored)
 *   DEPLOY_HOST=dasfas.xyz
 *   DEPLOY_USER=drolya
 *   DEPLOY_BASE=/var/www/app-v2    # base dir; releases go in $DEPLOY_BASE/releases/
 *   DEPLOY_KEEP=5                  # number of releases to keep (optional, default: 5)
 *   NGINX_LOG_DIR=/var/log/nginx   # optional
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Config ────────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv(join(__dir, '.env.production'));

const HOST = (process.env.DEPLOY_HOST ?? 'your.host.name').replace(/^https?:\/\//, '').replace(/\/$/, '');
const USER = process.env.DEPLOY_USER ?? 'username';
const BASE_DIR = process.env.DEPLOY_BASE ?? '/var/www/app-v2';
const KEEP = parseInt(process.env.DEPLOY_KEEP ?? '5', 10);
const LOG_DIR = process.env.NGINX_LOG_DIR ?? '/var/log/nginx';
const TARGET = `${USER}@${HOST}`;
const LOCAL_DIST = join(__dir, 'dist') + '/';

// ── Helpers ───────────────────────────────────────────────────────────────────

function local(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: __dir, ...opts });
}

function ssh(cmd) {
  const result = spawnSync('ssh', ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', TARGET, cmd], {
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function sshCapture(cmd) {
  const result = spawnSync('ssh', ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', TARGET, cmd], {
    encoding: 'utf8',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout.trim();
}

function sshTty(cmd) {
  const result = spawnSync('ssh', ['-t', '-o', 'StrictHostKeyChecking=accept-new', TARGET, ...(cmd ? [cmd] : [])], {
    stdio: 'inherit',
  });
  if (result.status !== 0 && result.status !== 130) process.exit(result.status ?? 1);
}

function makeTimestamp() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

function uploadRelease(ts) {
  const relDir = `${BASE_DIR}/releases/${ts}`;
  ssh(`mkdir -p ${relDir}`);
  local(`rsync -avz --checksum --delete --progress ${LOCAL_DIST} ${TARGET}:${relDir}/`);
  return relDir;
}

function activateRelease(relDir) {
  // ln -sfn is atomic on Linux (uses rename syscall) — zero downtime swap
  ssh(`ln -sfn ${relDir} ${BASE_DIR}/current`);
  console.log(`  ✓ current → ${relDir.split('/').pop()}`);
}

function pruneReleases() {
  ssh(`ls -1dt ${BASE_DIR}/releases/*/ 2>/dev/null | tail -n +${KEEP + 1} | xargs rm -rf 2>/dev/null; true`);
}

// ── Commands ──────────────────────────────────────────────────────────────────

const commands = {
  deploy() {
    if (!existsSync(LOCAL_DIST.slice(0, -1))) {
      console.log('\n  ⚙  No dist/ found — building first...\n');
    }
    console.log('\n==> Building...');
    local('pnpm run build');

    const ts = makeTimestamp();
    console.log(`\n==> Uploading release ${ts} → ${TARGET}:${BASE_DIR}/releases/${ts}/`);
    const relDir = uploadRelease(ts);

    console.log('\n==> Activating...');
    activateRelease(relDir);

    console.log(`\n==> Pruning old releases (keeping ${KEEP})...`);
    pruneReleases();

    console.log('\n✅ Done.');
  },

  upload() {
    if (!existsSync(LOCAL_DIST.slice(0, -1))) {
      console.error('\n  ❌ dist/ not found. Run "node deploy.mjs deploy" to build first.\n');
      process.exit(1);
    }
    const ts = makeTimestamp();
    console.log(`\n==> Uploading release ${ts} → ${TARGET}:${BASE_DIR}/releases/${ts}/`);
    const relDir = uploadRelease(ts);

    console.log('\n==> Activating...');
    activateRelease(relDir);

    console.log(`\n==> Pruning old releases (keeping ${KEEP})...`);
    pruneReleases();

    console.log('\n✅ Done.');
  },

  releases() {
    console.log(`\n==> Releases on ${TARGET}:${BASE_DIR}/releases/\n`);
    const current = sshCapture(`readlink ${BASE_DIR}/current 2>/dev/null || echo ''`);
    const list = sshCapture(`ls -1dt ${BASE_DIR}/releases/*/ 2>/dev/null || echo ''`);
    if (!list) {
      console.log('  (no releases found)\n');
      return;
    }
    const releases = list.split('\n').filter(Boolean);
    releases.forEach((r, i) => {
      const name = r.replace(/\/$/, '').split('/').pop();
      const isCurrent = r.replace(/\/$/, '') === current.replace(/\/$/, '');
      const marker = isCurrent ? ' ← current' : '';
      console.log(`  [${i}] ${name}${marker}`);
    });
    console.log(`\n  rollback: node deploy.mjs rollback [n]  (n = index above)\n`);
  },

  rollback() {
    const n = parseInt(args[0] ?? '1', 10);
    console.log(`\n==> Rolling back ${n} release(s) on ${TARGET}`);
    const list = sshCapture(`ls -1dt ${BASE_DIR}/releases/*/ 2>/dev/null || echo ''`);
    if (!list) {
      console.error('  ❌ No releases found on server.');
      process.exit(1);
    }
    const releases = list.split('\n').filter(Boolean);
    if (releases.length <= n) {
      console.error(`  ❌ Only ${releases.length} release(s) available, cannot roll back ${n}.`);
      process.exit(1);
    }
    const relDir = releases[n].replace(/\/$/, '');
    activateRelease(relDir);
    console.log('\n✅ Done.');
  },

  'nginx:reload'() {
    console.log(`\n==> Reloading nginx on ${TARGET}`);
    ssh('sudo nginx -s reload');
    console.log('\n✅ Done.');
  },

  'nginx:test'() {
    console.log(`\n==> Testing nginx config on ${TARGET}`);
    ssh('sudo nginx -t');
  },

  logs() {
    const n = args[0] ?? 50;
    sshTty(`tail -n ${n} -f ${LOG_DIR}/budget.app.v2.access.log ${LOG_DIR}/budget.app.v2.error.log`);
  },

  shell() {
    console.log(`\n==> Opening shell on ${TARGET}`);
    sshTty();
  },

  help() {
    const cmds = [
      ['deploy', 'Build locally + upload new release + go live'],
      ['upload', 'Upload only — skip build, use existing dist/'],
      ['releases', 'List releases on server with current marker'],
      ['rollback [n]', 'Roll back n releases (default: 1 = previous)'],
      ['nginx:reload', 'Reload nginx config on server'],
      ['nginx:test', 'Test nginx config validity on server'],
      ['logs [n]', 'Tail nginx access + error logs (Ctrl+C to stop)'],
      ['shell', 'SSH into server'],
      ['help', 'Show this help'],
    ];
    console.log(`\n  budget-app-v2 deploy  →  ${TARGET}:${BASE_DIR}\n`);
    for (const [cmd, desc] of cmds) {
      console.log(`  node deploy.mjs ${cmd.padEnd(22)}  ${desc}`);
    }
    console.log(`\n  Or: npm run deploy / npm run deploy:upload / etc.\n`);
  },
};

// ── Entry point ───────────────────────────────────────────────────────────────

const [, , command = 'help', ...args] = process.argv;

const handler = commands[command];
if (!handler) {
  console.error(`\n  ❌ Unknown command: "${command}"\n`);
  commands.help();
  process.exit(1);
}

handler();
