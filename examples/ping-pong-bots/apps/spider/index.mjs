import { createClient, connectAndJoin, config } from '@zeus/rooms';
// WP-U161 · excepción ops: /channels no está en @zeus/socket-core (solo client/server).
import { createChannelsFacade } from '@alephscript/mcp-core-sdk/channels';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.SPIDER_USER || 'spider-demo';
const TARGET = process.env.SPIDER_TARGET || process.env.PONG_USER || 'pong-demo';

const client = createClient(USER);
const facade = createChannelsFacade({ client, room: config.room, selfId: USER });

facade.spider.onOpen((peerId) => {
  console.log(`[${USER}] channel open with ${peerId}`);
});

client.io.on('RABBIT', (data) => {
  const from = data?.from;
  if (!from || from === USER) return;
  if (from === TARGET) {
    console.log(`[${USER}] inviting ${from}`);
    facade.spider.open(from);
  }
});

client.io.on('SPIDER', (data) => {
  if (data?.intent === 'rnfp.invite' && data?.from) {
    facade.registry.send(data.from, 'rnfp', { type: 'ACCEPT' });
  }
});

console.log(`\n🕷️ SPIDER app · user=${USER} · target=${TARGET}\n`);

await connectAndJoin(client, USER, { type: 'SpiderBot', features: ['spider'] });

process.on('SIGINT', () => {
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  process.exit(0);
});
