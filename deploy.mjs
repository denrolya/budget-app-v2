#!/usr/bin/env node
/**
 * Deployment script for budget app-v2.
 * Node 20+, zero extra dependencies.
 *
 * Usage:
 *   node deploy.mjs deploy          # git pull → down → up --build → image prune
 *   node deploy.mjs restart         # restart container without rebuilding (fast)
 *   node deploy.mjs status [n]      # container status + last N log lines (default 20)
 *   node deploy.mjs logs [n]        # tail live logs (Ctrl+C to stop)
 *   node deploy.mjs shell           # interactive shell inside nginx container
 *   node deploy.mjs clean           # docker image prune on server
 *
 * Or via npm:
 *   npm run deploy
 *   npm run deploy:logs
 *   npm run deploy:status
 *   npm run deploy:shell
 *   npm run deploy:clean
 *
 * Config: create .env.deploy (gitignored) with DEPLOY_HOST / DEPLOY_USER / DEPLOY_DIR
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Config ──────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

/** Parse a simple KEY=VALUE .env file (no multiline, no quotes stripping) */
function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val; // don't override shell env
  }
}

loadEnv(join(__dir, '.env.deploy'));

const HOST = (process.env.DEPLOY_HOST ?? 'your.host.name').replace(/^https?:\/\//, '').replace(/\/$/, '');
const USER = process.env.DEPLOY_USER ?? 'username';
const DIR  = process.env.DEPLOY_DIR  ?? '/opt/your/app';
const TARGET = `${USER}@${HOST}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Run a command over SSH and inherit stdio (shows output live). */
function ssh(cmd) {
  const result = spawnSync(
    'ssh',
    ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', TARGET, cmd],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** SSH with a forced pty (-t) — needed for interactive shells and log follows. */
function sshTty(cmd) {
  const result = spawnSync(
    'ssh',
    ['-t', '-o', 'StrictHostKeyChecking=accept-new', TARGET, cmd],
    { stdio: 'inherit' },
  );
  if (result.status !== 0 && result.status !== 130) process.exit(result.status ?? 1); // 130 = Ctrl+C
}

/** Auto-detect 'docker compose' (v2 plugin) or legacy 'docker-compose'. */
function detectCompose() {
  const r = spawnSync('ssh', [TARGET, 'docker compose version'], { stdio: 'pipe' });
  return r.status === 0 ? 'docker compose' : 'docker-compose';
}

// ── Commands ─────────────────────────────────────────────────────────────────

const commands = {
  deploy() {
    console.log(`\n==> Deploying to ${TARGET}:${DIR}`);
    const compose = detectCompose();
    console.log(`    compose: ${compose}\n`);
    ssh(`cd ${DIR} && git pull --ff-only`);
    ssh(`cd ${DIR} && ${compose} down`);
    ssh(`cd ${DIR} && ${compose} up -d --build`);
    ssh('docker image prune -f');
    console.log('\n✅ Done.');
  },

  restart() {
    console.log(`\n==> Restarting container on ${TARGET}`);
    const compose = detectCompose();
    ssh(`cd ${DIR} && ${compose} restart`);
    console.log('\n✅ Done.');
  },

  status() {
    const n = args[0] ?? 20;
    const compose = detectCompose();
    ssh(`cd ${DIR} && ${compose} ps`);
    ssh(`cd ${DIR} && ${compose} logs --tail=${n}`);
  },

  logs() {
    const n = args[0] ?? 50;
    const compose = detectCompose();
    sshTty(`cd ${DIR} && ${compose} logs -f --tail=${n}`);
  },

  shell() {
    const compose = detectCompose();
    sshTty(`cd ${DIR} && ${compose} exec web /bin/sh`);
  },

  clean() {
    console.log(`\n==> Pruning dangling images on ${TARGET}`);
    ssh('docker image prune -f');
    console.log('\n✅ Done.');
  },

  help() {
    const cmds = [
      ['deploy',          'git pull → down → up --build → image prune'],
      ['restart',         'Restart container without rebuilding (fast)'],
      ['status [n]',      'Container status + last N log lines (default 20)'],
      ['logs [n]',        'Tail live container logs (Ctrl+C to stop)'],
      ['shell',           'Interactive shell inside the nginx container'],
      ['clean',           'docker image prune — reclaim disk space'],
      ['help',            'Show this help'],
    ];
    console.log(`\n  budget-app-v2 deploy  →  ${TARGET}:${DIR}\n`);
    for (const [cmd, desc] of cmds) {
      console.log(`  node deploy.mjs ${cmd.padEnd(20)}  ${desc}`);
    }
    console.log(`\n  Or: npm run deploy / npm run deploy:logs / etc.\n`);
  },
};

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, command = 'help', ...args] = process.argv;

if (!commands[command]) {
  console.error(`\n  ❌ Unknown command: "${command}"\n`);
  commands.help();
  process.exit(1);
}

commands[command]();
