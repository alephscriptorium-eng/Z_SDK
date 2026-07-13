/**
 * Panel Q — inventario de presets (WP-12).
 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {object} opts
 * @param {string[]} opts.startPack nombres de preset del gamemap
 * @param {object|null} opts.equipped cloak actual del actor
 * @param {object[]} opts.presets lista de /api/mcp/presets
 */
export function renderCloakInventory({ startPack = [], equipped = null, presets = [] }) {
  const byName = new Map(presets.map((p) => [p.name, p]));
  const names = [...new Set([...startPack, ...presets.map((p) => p.name)])];
  const unlocked = new Set(startPack);

  const rows = names.map((name) => {
    const p = byName.get(name);
    const active = equipped?.presetId === name || equipped?.presetId === p?.id;
    const locked = startPack.length > 0 && !unlocked.has(name);
    const label = p?.name ?? name;
    const desc = p?.description ? `<span class="cloak-desc">${esc(p.description)}</span>` : '';
    return `<button type="button" class="arg-btn cloak-item${active ? ' cloak-item-active' : ''}${locked ? ' cloak-item-locked' : ''}" data-preset-name="${esc(name)}"${locked ? ' disabled' : ''}>${esc(label)}${desc}</button>`;
  });

  return [
    equipped
      ? `<p class="overlay-muted">equipado · <strong>${esc(equipped.label ?? equipped.presetId)}</strong></p>`
      : '<p class="overlay-muted">sin cloak — vas desnudo por el delta</p>',
    `<div class="cloak-list">${rows.length ? rows.join('') : '<p class="overlay-muted">cargando inventario…</p>'}</div>`,
    '<p class="overlay-hint">[Q] cerrar</p>'
  ].join('\n');
}

/**
 * @param {HTMLElement} root
 * @param {(presetName: string) => void} onEquip
 */
export function bindCloakInventory(root, onEquip) {
  root.querySelectorAll('.cloak-item:not(.cloak-item-locked)').forEach((btn) => {
    btn.addEventListener('click', () => onEquip(btn.dataset.presetName));
  });
}

/**
 * Carga presets del PresetStore.
 * @returns {Promise<object[]>}
 */
export async function fetchPresetSummaries() {
  const res = await fetch('/api/mcp/presets');
  if (!res.ok) throw new Error('no se pudo cargar /api/mcp/presets');
  const body = await res.json();
  return body.presets ?? [];
}
