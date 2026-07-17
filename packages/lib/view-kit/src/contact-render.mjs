/**
 * Render puro del menú de contacto HORSE — tres columnas UX §UX-2.6.
 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object|null} offer oferta resuelta (tools/resources/prompts)
 * @param {object} [opts]
 * @param {string} [opts.liveText] zona live
 * @param {{ id: string, label: string }[]} [opts.restActions] acciones REST
 */
export function renderContactMenu(offer, opts = {}) {
  const liveHtml = opts.liveText ?? '— esperando operación —';
  const restActions = opts.restActions ?? [];
  const tools = offer?.tools ?? [];
  const resources = (offer?.resources ?? []).filter((r) => !r._meta?.preset);
  const prompts = offer?.prompts ?? [];
  const presetMeta = offer?._meta?.preset;

  const col = (title, body) =>
    `<div class="contact-col"><div class="contact-col-title">${esc(title)}</div>${body || '<p class="overlay-muted">— vacío —</p>'}</div>`;

  const promptBtns = prompts.map((p) =>
    `<button type="button" class="arg-btn contact-prompt-btn" data-prompt="${esc(p.name)}">${esc(p.name)}</button>`
  ).join('');

  const toolBlocks = tools.map((t) => {
    const schema = t.inputSchema ?? {};
    const props = schema.properties ?? {};
    const fields = Object.keys(props).map((key) => {
      const p = props[key];
      const type = p.type === 'number' ? 'number' : 'text';
      const step = type === 'number' ? ' step="0.1"' : '';
      const def = key === 'aperture' ? ' value="0.6"' : '';
      return `<label class="contact-arg"><span>${esc(key)}</span><input type="${type}" data-tool-field="${esc(key)}" data-tool="${esc(t.name)}"${step}${def} /></label>`;
    }).join('');
    return `<div class="contact-item"><button type="button" class="arg-btn contact-tool-btn" data-tool="${esc(t.name)}">${esc(t.name)}</button>${fields}</div>`;
  }).join('');

  const resourceBtns = resources.map((r) =>
    `<button type="button" class="arg-btn contact-resource-btn" data-resource-uri="${esc(r.uri)}" data-resource-name="${esc(r.name)}">${esc(r.name)}</button>`
  ).join('');

  const restBtns = restActions.map((a) =>
    `<button type="button" class="arg-btn contact-rest-btn" data-rest="${esc(a.id)}">${esc(a.label)}</button>`
  ).join('');

  const presetLine = presetMeta
    ? `<p class="overlay-muted">preset · ${esc(presetMeta.name)}</p>`
    : '';

  return [
    `<div class="contact-live" id="contact-live">${esc(liveHtml)}</div>`,
    presetLine,
    '<div class="contact-columns">',
    col('PROMPTS', promptBtns),
    col('TOOLS', toolBlocks),
    col('RESOURCES', resourceBtns),
    '</div>',
    restBtns ? `<div class="contact-rest">${restBtns}</div>` : '',
    '<button type="button" class="arg-btn arg-btn-close" data-close="1">cerrar contacto</button>'
  ].join('\n');
}

/**
 * @param {HTMLElement} root
 * @param {object} handlers
 */
export function bindContactMenu(root, handlers = {}) {
  root.querySelectorAll('.contact-prompt-btn').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onPrompt?.(btn.dataset.prompt));
  });

  root.querySelectorAll('.contact-tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tool;
      const args = {};
      root.querySelectorAll(`[data-tool="${name}"][data-tool-field]`).forEach((input) => {
      const key = input.dataset?.toolField ?? input.getAttribute?.('data-tool-field');
        let val = input.value;
        if (input.type === 'number' && val !== '') val = Number(val);
        args[key] = val;
      });
      handlers.onTool?.(name, args);
    });
  });

  root.querySelectorAll('.contact-resource-btn').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onResource?.(btn.dataset.resourceName, btn.dataset.resourceUri));
  });

  root.querySelectorAll('.contact-rest-btn').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onRest?.(btn.dataset.rest));
  });

  root.querySelector('[data-close]')?.addEventListener('click', () => handlers.onClose?.());
}

/** @param {HTMLElement} root */
export function setContactLive(root, text) {
  const el = root.querySelector('#contact-live');
  if (el) el.textContent = text;
}

export function formatContactLive(result, error = null) {
  if (error) return `error · ${error.message ?? String(error)}`;
  if (!result) return 'ok';
  try {
    return JSON.stringify(result.result ?? result, null, 2);
  } catch {
    return String(result);
  }
}
