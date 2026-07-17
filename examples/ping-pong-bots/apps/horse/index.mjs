import { createClient, connectAndJoin, config } from '@zeus/rooms';
import {
  resolvePresetOffer,
  broadcastPresetOffer,
  createPresetHorseProxy,
  horsePresetFixture
} from '@zeus/presets-sdk/horse';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.HORSE_USER || 'horse-demo';

const client = createClient(USER);

const { preset, catalog, upstream } = horsePresetFixture;
const offer = resolvePresetOffer(preset, catalog);
broadcastPresetOffer(client, config.room, USER, offer);

const proxy = createPresetHorseProxy({ offer, upstream });
proxy.attach(client, config.room, USER);

console.log(
  `\n🐴 HORSE app · user=${USER} · room=${config.room} · preset=${preset.name}` +
  ` · tools=[${offer.tools.map((t) => t.name).join(', ')}]\n`
);

await connectAndJoin(client, USER, { type: 'HorseBot', features: ['horse', 'horse-preset'] });

process.on('SIGINT', () => {
  proxy.detach();
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  process.exit(0);
});
