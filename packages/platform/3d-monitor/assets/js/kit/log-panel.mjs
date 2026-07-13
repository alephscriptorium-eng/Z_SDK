/**
 * View kit · DOM log panel — colored, capped, newest-first event log.
 */

/**
 * @param {string} elId container element id (kit layout renders #view-log)
 * @param {object} [opts]
 * @param {number} [opts.max] max retained lines
 */
export function createLogPanel(elId = 'view-log', opts = {}) {
  const max = opts.max ?? 200;
  const el = document.getElementById(elId);

  return {
    /**
     * @param {object} line
     * @param {string} line.badge   short role/actor tag
     * @param {string} [line.color] css color for the badge
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
