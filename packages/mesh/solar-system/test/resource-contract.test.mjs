import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCE_PAYLOADS } from '@zeus/http-contract/mcp-resources';
import { connectMcp } from '@zeus/test-utils';
import { startAll } from '../src/start.mjs';

const TEST_PORTS = { sun: 14151, moon: 14152, earth: 14153 };
const FIXED_TIMESTAMP = 1_700_000_000_000;

test('solar MCP body://info matches RESOURCE_PAYLOADS', async (t) => {
  const prev = {
    sun: process.env.ZEUS_MCP_SUN,
    moon: process.env.ZEUS_MCP_MOON,
    earth: process.env.ZEUS_MCP_EARTH,
    validate: process.env.ZEUS_VALIDATE_RESOURCES
  };
  process.env.ZEUS_MCP_SUN = String(TEST_PORTS.sun);
  process.env.ZEUS_MCP_MOON = String(TEST_PORTS.moon);
  process.env.ZEUS_MCP_EARTH = String(TEST_PORTS.earth);
  process.env.ZEUS_VALIDATE_RESOURCES = '1';

  const handles = await startAll();
  const client = await connectMcp(TEST_PORTS.sun);

  t.after(async () => {
    await client.close();
    await Promise.allSettled(handles.map((h) => h.close()));
    if (prev.sun == null) delete process.env.ZEUS_MCP_SUN;
    else process.env.ZEUS_MCP_SUN = prev.sun;
    if (prev.moon == null) delete process.env.ZEUS_MCP_MOON;
    else process.env.ZEUS_MCP_MOON = prev.moon;
    if (prev.earth == null) delete process.env.ZEUS_MCP_EARTH;
    else process.env.ZEUS_MCP_EARTH = prev.earth;
    if (prev.validate == null) delete process.env.ZEUS_VALIDATE_RESOURCES;
    else process.env.ZEUS_VALIDATE_RESOURCES = prev.validate;
  });

  const info = await client.readResource({ uri: 'body://info' });
  const payload = JSON.parse(info.contents[0].text);
  const schema = RESOURCE_PAYLOADS.get('body://info');
  assert.ok(schema?.safeParse(payload).success);

  const position = await client.readResource({ uri: `body://position/${FIXED_TIMESTAMP}` });
  const positionPayload = JSON.parse(position.contents[0].text);
  const positionSchema = RESOURCE_PAYLOADS.get('body://position/{timestamp}');
  assert.ok(positionSchema?.safeParse(positionPayload).success);
});
