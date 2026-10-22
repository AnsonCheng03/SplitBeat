import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const flowsDirectory = fileURLToPath(new URL('../../.maestro/flows/', import.meta.url));
const requestedFlow = process.env.E2E_MAESTRO_FLOW?.trim() || 'session-smoke.yaml';

if (basename(requestedFlow) !== requestedFlow || !requestedFlow.endsWith('.yaml')) {
  throw new Error('E2E_MAESTRO_FLOW must be a YAML flow filename in .maestro/flows.');
}

const flowPath = join(flowsDirectory, requestedFlow);
if (!existsSync(flowPath)) {
  throw new Error(`Maestro flow not found: ${requestedFlow}`);
}

const command = process.platform === 'win32' ? 'maestro.cmd' : 'maestro';
const maestro = spawn(command, ['test', ...process.argv.slice(2), flowPath], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

maestro.on('error', (error) => {
  console.error(`Could not start Maestro: ${error.message}`);
  process.exitCode = 1;
});

maestro.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
