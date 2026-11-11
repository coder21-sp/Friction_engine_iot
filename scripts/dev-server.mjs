import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const aiDir = path.join(rootDir, 'ai-service');
const pythonExe = path.join(rootDir, '.venv', 'Scripts', 'python.exe');

console.log('[HFME] Starting AI service on http://localhost:8000 ...');
const ai = spawn(pythonExe, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: aiDir,
  stdio: 'inherit',
  shell: true,
});

console.log('[HFME] Starting Next.js Web App on http://localhost:3000 ...');
const web = spawn('npm.cmd', ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('[HFME] Stopping services...');
  try { ai.kill(); } catch {}
  try { web.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

ai.on('error', (err) => {
  console.error('[HFME] AI service error:', err);
});

web.on('error', (err) => {
  console.error('[HFME] Web app error:', err);
});

ai.on('exit', (code) => {
  console.log(`[HFME] AI service exited with code ${code}`);
});

web.on('exit', (code) => {
  console.log(`[HFME] Web app exited with code ${code}`);
});
