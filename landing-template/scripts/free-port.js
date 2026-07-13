import { execSync } from 'node:child_process';

const port = Number(process.argv[2] ?? 5174);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Puerto inválido: ${process.argv[2]}`);
  process.exit(1);
}

function collectPids(targetPort) {
  const pids = new Set();

  const commands = [
    `lsof -ti:${targetPort}`,
    `fuser ${targetPort}/tcp 2>/dev/null`,
  ];

  for (const command of commands) {
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      if (!output) continue;

      output.split(/\s+/).forEach((value) => {
        const pid = Number(value);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      });
    } catch {
      // Puerto libre o comando no disponible.
    }
  }

  return pids;
}

const pids = collectPids(port);

if (pids.size === 0) {
  console.log(`Puerto ${port} libre.`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Proceso ${pid} detenido (puerto ${port}).`);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      console.warn(`No se pudo detener el proceso ${pid}: ${error.message}`);
    }
  }
}
