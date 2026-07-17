/**
 * View kit · panel de log DOM — coloreado, acotado, lo más nuevo arriba.
 * En el tablero hace de ledger del Notario en vivo.
 */

/**
 * @param {string} elId id del contenedor (el layout del kit renderiza #view-log)
 * @param {object} [opts]
 * @param {number} [opts.max] máximo de líneas retenidas
 */
export function createLogPanel(elId = 'view-log', opts = {}) {
  const max = opts.max ?? 200;
  const el = document.getElementById(elId);

  return {
    /**
     * @param {object} line
     * @param {string} line.badge   tag corto de rol/kind
     * @param {string} [line.color] color css del badge
     * @param {string} line.text
     */
    append(line) {
      if (!el) return;
      const row = document.createElement('div');
      row.className = 'log-line';
      const badge = document.createElement('span');
      badge.className = 'log-badge';
      badge.textContent = line.badge;
      if (line.color) badge.style.color = line.color;
      const text = document.createElement('span');
      text.className = 'log-text';
      text.textContent = ` ${line.text}`;
      row.append(badge, text);
      el.prepend(row);
      while (el.childElementCount > max) el.lastElementChild.remove();
    },
    clear() {
      if (el) el.replaceChildren();
    }
  };
}
