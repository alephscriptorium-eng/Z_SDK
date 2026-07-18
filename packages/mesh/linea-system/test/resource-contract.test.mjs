import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCE_PAYLOADS } from '@zeus/http-contract/mcp-resources';
import { connectMcp } from '@zeus/test-utils';
import { startAll } from '../src/start.mjs';
import { hasLiveLineasRegistry, SKIP_NO_LIVE_LINEAS } from './helpers/live-volumes.mjs';

const TEST_PORTS = { espana: 14121, wpHistoria: 14122 };

test(
  'linea MCP linea://info matches RESOURCE_PAYLOADS',
  { skip: hasLiveLineasRegistry() ? false : SKIP_NO_LIVE_LINEAS },
  async (t) => {
    const prev = {
      espana: process.env.ZEUS_MCP_LINEA_ESPAN,
      wp: process.env.ZEUS_MCP_LINEA_WP,
      validate: process.env.ZEUS_VALIDATE_RESOURCES
    };
    process.env.ZEUS_MCP_LINEA_ESPAN = String(TEST_PORTS.espana);
    process.env.ZEUS_MCP_LINEA_WP = String(TEST_PORTS.wpHistoria);
    process.env.ZEUS_VALIDATE_RESOURCES = '1';

    const handles = await startAll();
    const client = await connectMcp(TEST_PORTS.espana);

    t.after(async () => {
      await client.close();
      await Promise.allSettled(handles.map((h) => h.close()));
      if (prev.espana == null) delete process.env.ZEUS_MCP_LINEA_ESPAN;
      else process.env.ZEUS_MCP_LINEA_ESPAN = prev.espana;
      if (prev.wp == null) delete process.env.ZEUS_MCP_LINEA_WP;
      else process.env.ZEUS_MCP_LINEA_WP = prev.wp;
      if (prev.validate == null) delete process.env.ZEUS_VALIDATE_RESOURCES;
      else process.env.ZEUS_VALIDATE_RESOURCES = prev.validate;
    });

    const info = await client.readResource({ uri: 'linea://info' });
    const payload = JSON.parse(info.contents[0].text);
    const schema = RESOURCE_PAYLOADS.get('linea://info');
    assert.ok(schema?.safeParse(payload).success);
  }
);
