/**
 * Session console — emit inbound protocol events with schema-guided payloads.
 */

function resolveSchemaRef(schema, root) {
  if (!schema?.$ref || typeof schema.$ref !== 'string') return schema;
  const name = schema.$ref.replace(/^#\/\$defs\//, '');
  return root?.$defs?.[name] ?? schema;
}

function exampleFromSchema(schema, root = schema) {
  if (!schema || typeof schema !== 'object') return {};
  schema = resolveSchemaRef(schema, root);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type;
  switch (type) {
    case 'string':
      return schema.format === 'uuid' ? '00000000-0000-0000-0000-000000000001' : '';
    case 'number':
    case 'integer':
      return schema.minimum ?? 0;
    case 'boolean':
      return false;
    case 'array':
      return schema.items ? [exampleFromSchema(schema.items, root)] : [];
    case 'object': {
      const out = {};
      const props = schema.properties || {};
      const keys = new Set([...Object.keys(props), ...(schema.required || [])]);
      for (const key of keys) {
        if (props[key]) out[key] = exampleFromSchema(props[key], root);
      }
      return out;
    }
    default:
      if (schema.allOf?.length) return exampleFromSchema(schema.allOf[0], root);
      if (schema.anyOf?.length) return exampleFromSchema(schema.anyOf[0], root);
      if (schema.oneOf?.length) return exampleFromSchema(schema.oneOf[0], root);
      return {};
  }
}

function isSessionError(value) {
  return Boolean(value && typeof value === 'object' && value.event && value.code);
}

function appendLog(logEl, line, kind = 'info') {
  const entry = document.createElement('div');
  entry.className = `session-console-log-entry session-console-log-${kind}`;
  entry.textContent = line;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

const REPLY_TIMEOUT_MS = 12000;

/**
 * Emit an inbound event according to manifest ack / replyEvent metadata.
 * @param {object} client
 * @param {{ ack?: boolean, replyEvent?: string } | undefined} entry
 * @param {string} event
 * @param {unknown} payload
 */
export async function emitInboundEvent(client, entry, event, payload) {
  const hasAck = entry?.ack === true;
  const replyEvent = entry?.replyEvent;

  if (replyEvent) {
    const replyPromise = client.waitForEvent(replyEvent, null, REPLY_TIMEOUT_MS);
    if (hasAck) {
      return client.emitWithAck(event, payload).then(
        (ackResult) => ({ kind: 'ack+reply', ackResult, replyPromise, replyEvent }),
        (err) => {
          if (isSessionError(err)) {
            return { kind: 'ack-error', ackResult: err, replyPromise: null, replyEvent };
          }
          throw err;
        }
      );
    }
    client.emit(event, payload);
    return replyPromise.then((replyResult) => ({
      kind: 'reply-only',
      replyResult,
      replyEvent
    }));
  }

  if (hasAck) {
    const ackResult = await client.emitWithAck(event, payload);
    return { kind: 'ack', ackResult };
  }

  client.emit(event, payload);
  return { kind: 'fire-and-forget' };
}

/**
 * @param {HTMLElement} host
 * @param {{ client: object }} options
 */
export function mountSessionConsole(host, { client }) {
  host.innerHTML =
    '<section class="session-console">' +
    '<h3>Session console</h3>' +
    '<div class="session-console-controls action-row">' +
    '<label>Event <select id="session-console-event"></select></label>' +
    '<button type="button" class="btn btn-primary" id="session-console-emit">Emit</button>' +
    '</div>' +
    '<label>Payload (JSON)<textarea id="session-console-payload" rows="8" spellcheck="false"></textarea></label>' +
    '<div id="session-console-log" class="session-console-log" aria-live="polite"></div>' +
    '</section>';

  const eventSelect = host.querySelector('#session-console-event');
  const payloadInput = host.querySelector('#session-console-payload');
  const emitBtn = host.querySelector('#session-console-emit');
  const logEl = host.querySelector('#session-console-log');

  /** @type {{ inbound: Array<{ name: string, schema: object, ack?: boolean, replyEvent?: string }> }} */
  let manifest = { inbound: [] };

  const logSessionError = (payload) => {
    appendLog(logEl, `← session:error ${JSON.stringify(payload)}`, 'error');
  };

  const offError = client.onError?.(logSessionError);

  function fillPayloadForEvent(name) {
    const entry = manifest.inbound.find((e) => e.name === name);
    const sample = exampleFromSchema(entry?.schema || { type: 'object' });
    payloadInput.value = JSON.stringify(sample, null, 2);
  }

  eventSelect.addEventListener('change', () => fillPayloadForEvent(eventSelect.value));

  emitBtn.addEventListener('click', async () => {
    const event = eventSelect.value;
    if (!event) return;
    let payload = {};
    try {
      payload = JSON.parse(payloadInput.value || '{}');
    } catch (err) {
      appendLog(logEl, `Invalid JSON: ${err.message}`, 'error');
      return;
    }

    const entry = manifest.inbound.find((e) => e.name === event);
    appendLog(logEl, `→ ${event} ${JSON.stringify(payload)}`, 'emit');

    try {
      const outcome = await emitInboundEvent(client, entry, event, payload);

      if (outcome.kind === 'ack+reply') {
        appendLog(logEl, `← ack ${JSON.stringify(outcome.ackResult)}`, 'reply');
        if (!isSessionError(outcome.ackResult)) {
          const reply = await outcome.replyPromise;
          appendLog(logEl, `← ${outcome.replyEvent} ${JSON.stringify(reply)}`, 'reply');
        }
      } else if (outcome.kind === 'ack-error') {
        // session:error logged via client.onError
      } else if (outcome.kind === 'ack') {
        appendLog(logEl, `← ack ${JSON.stringify(outcome.ackResult)}`, 'reply');
      } else if (outcome.kind === 'reply-only') {
        appendLog(logEl, `← ${outcome.replyEvent} ${JSON.stringify(outcome.replyResult)}`, 'reply');
      } else {
        appendLog(logEl, '← (fire-and-forget)', 'info');
      }
    } catch (err) {
      appendLog(logEl, `Error: ${err?.message || String(err)}`, 'error');
    }
  });

  return fetch('/spec/session-manifest.json')
    .then((res) => res.json())
    .then((data) => {
      manifest = data;
      eventSelect.innerHTML = '';
      for (const entry of manifest.inbound || []) {
        const opt = document.createElement('option');
        opt.value = entry.name;
        opt.textContent = entry.name;
        eventSelect.appendChild(opt);
      }
      if (manifest.inbound?.length) fillPayloadForEvent(manifest.inbound[0].name);
      appendLog(logEl, `Loaded ${manifest.inbound?.length || 0} inbound events`, 'info');
    })
    .catch((err) => {
      appendLog(logEl, `Manifest load failed: ${err.message}`, 'error');
    });
}

export { exampleFromSchema, isSessionError };
