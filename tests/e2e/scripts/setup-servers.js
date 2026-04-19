import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const backend = spawn('yarn', ['workspace', '@mini-campaign-manager/backend', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

const frontend = spawn('yarn', ['workspace', '@mini-campaign-manager/frontend', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => process.stdout.write(`[backend] ${data}`));
backend.stderr.on('data', (data) => process.stderr.write(`[backend] ${data}`));
frontend.stdout.on('data', (data) => process.stdout.write(`[frontend] ${data}`));
frontend.stderr.on('data', (data) => process.stderr.write(`[frontend] ${data}`));

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {}
    await setTimeout(1000);
  }
  throw new Error(`Server at ${url} not ready after ${timeout}ms`);
}

async function main() {
  console.log('Waiting for backend (http://127.0.0.1:3001)...');
  await waitForServer('http://127.0.0.1:3001');
  console.log('Backend ready!');

  console.log('Waiting for frontend (http://127.0.0.1:5173)...');
  await waitForServer('http://127.0.0.1:5173');
  console.log('Frontend ready!');

  console.log('All servers ready, running tests...');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});