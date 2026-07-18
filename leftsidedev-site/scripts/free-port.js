import net from 'node:net';

const port = Number(process.argv[2] || 5175);

const server = net.createServer();
server.once('error', () => process.exit(0));
server.once('listening', () => {
  server.close(() => process.exit(0));
});
server.listen(port, '127.0.0.1');
