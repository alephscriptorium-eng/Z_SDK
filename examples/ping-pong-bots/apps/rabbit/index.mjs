import { config, createClient, connectAndJoin } from '@zeus/rooms';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.RABBIT_USER || 'rabbit-demo';
const INTERVAL_MS = Number(process.env.RABBIT_INTERVAL_MS || 5000);

const client = createClient(USER);
const peers = new Set();

client.io.on('RABBIT', (data) => {
  const from = data?.from;
  if (!from || from === USER) return;
  if (!peers.has(from)) {
    peers.add(from);
    console.log(`[${USER}] peer discovered: ${from} (total: ${peers.size})`);
  }
});

function beacon() {
  client.room('RABBIT', { from: USER, ts: Date.now(), peers: [...peers] }, config.room);
}

console.log(`\n🐰 RABBIT app · user=${USER} · room=${config.room}\n`);

await connectAndJoin(client, USER, { type: 'RabbitBot', features: ['rabbit'] });
beacon();
const timer = setInterval(beacon, INTERVAL_MS);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log(`\n[${USER}] saliendo · peers=${peers.size}`);
  client.io.close();
  process.exit(0);
});
