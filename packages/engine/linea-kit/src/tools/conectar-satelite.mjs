/**
 * conectar-satelite — MCP satélite instructions + remote stubs (wiki/ATProto/SSB).
 */

import path from 'node:path';
import { ensureDir, nowIso, writeJson, writeText } from './fs-util.mjs';

/**
 * @param {{
 *   lineDir: string,
 *   lineaId: string,
 *   sateliteRel?: string,
 *   wiki?: { title?: string, apiBase?: string },
 *   atproto?: { collection?: string, endpointHint?: string },
 *   ssb?: { feedType?: string, diskHint?: string }
 * }} options
 */
export function conectarSatelite(options) {
  if (!options.lineDir || !options.lineaId) {
    return {
      ok: false,
      error: 'lineDir and lineaId are required',
      rule: 'conectar-satelite.args'
    };
  }

  const lineDir = path.resolve(options.lineDir);
  const satRel = options.sateliteRel ?? 'wp/historia/';
  const satDir = path.join(lineDir, satRel);
  ensureDir(satDir);

  const remotes = {
    generated_at: nowIso(),
    linea_id: options.lineaId,
    satelite_rel: satRel.endsWith('/') ? satRel : `${satRel}/`,
    remotes: {
      wiki: {
        kind: 'static_authority',
        title: options.wiki?.title ?? 'Toy_Article',
        api_base: options.wiki?.apiBase ?? null,
        note: 'Authority snapshots by oldid; materialize with tool fetch (approval gate).'
      },
      atproto: {
        kind: 'stream',
        collection: options.atproto?.collection ?? 'app.bsky.feed.post',
        endpoint_hint: options.atproto?.endpointHint ?? null,
        note: 'Stream family (DATOS §3); export JSON to DISK_01 — not fetched here.'
      },
      ssb: {
        kind: 'gossip',
        feed_type: options.ssb?.feedType ?? 'tribe*',
        disk_hint: options.ssb?.diskHint ?? 'DISK_04/SSB',
        note: 'Gossip family; exportador SSB→JSON = @zeus/ssb-system (WP-U84). Dump JSON + sync CLI.'
      }
    }
  };

  const mcpConfig = {
    generated_at: remotes.generated_at,
    linea_id: options.lineaId,
    servers: {
      tronco: {
        name: `linea-${options.lineaId}`,
        kind: 'tronco',
        resources: ['linea://info', 'linea://nodo/{year}', 'linea://parte/{id}']
      },
      satelite: {
        name: `linea-${options.lineaId}-satelite`,
        kind: 'satelite',
        resources: [
          'linea://info',
          'linea://cache/stats',
          'linea://wikitext/{oldid}',
          'linea://registros/year/{year}',
          'linea://registro/{id}'
        ],
        tools: ['cache_wikitext']
      }
    },
    point_linea_system: {
      env: 'ZEUS_VOLUMES_ROOT or pass basePath to loadLineaData / startAll',
      lineas_root_hint: path.dirname(lineDir),
      registry_entry_id: options.lineaId
    }
  };

  const remotesPath = path.join(satDir, 'remotes.json');
  const mcpPath = path.join(satDir, 'mcp-satelite.json');
  const instructionsPath = path.join(satDir, 'CONECTAR.md');

  writeJson(remotesPath, remotes);
  writeJson(mcpPath, mcpConfig);
  writeText(
    instructionsPath,
    `# Conectar satélite — ${options.lineaId}

Generado por \`conectar-satelite\` (@zeus/linea-kit).

## Remotos

| familia | archivo | notas |
| ------- | ------ | ----- |
| wiki (estática) | \`remotes.json\` → remotes.wiki | fetch con gate de aprobación |
| ATProto (stream) | remotes.atproto | export a DISK_01; no en este tool |
| SSB (gossip) | remotes.ssb | \`@zeus/ssb-system\` sync CLI |

## MCP

Ver \`mcp-satelite.json\`. Para servir la línea:

\`\`\`bash
# Apuntar linea-system al LINEAS root que contiene esta línea
node -e "import('@zeus/linea-system').then(m => m.startAll('<LINEAS_ROOT>'))"
\`\`\`

O en tests: \`createServer(config, lineData)\` con \`loadLineaData(lineasRoot)\`.

El contrato de entrada al mesh es el **validador U80**, no este archivo.
`
  );

  return {
    ok: true,
    satDir,
    remotesPath,
    mcpPath,
    instructionsPath,
    remotes,
    mcpConfig
  };
}
