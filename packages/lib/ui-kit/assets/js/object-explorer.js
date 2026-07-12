/**
 * Focus-based JSON object explorer (browser).
 * Requires /assets/js/json-path.js (generated from @zeus/presets-sdk).
 */
(function (global) {
  'use strict';

  const JsonPath = global.ZeusJsonPath;
  if (!JsonPath) {
    throw new Error('ZeusJsonPath is required — load /assets/js/json-path.js before object-explorer.js');
  }

  const DEFAULT_ROOT = JsonPath.DEFAULT_ROOT || 'session';
  const parsePath = JsonPath.parsePath.bind(JsonPath);
  const formatPath = JsonPath.formatPath.bind(JsonPath);
  const getAtPath = JsonPath.getAtPath.bind(JsonPath);
  const getParentPath = JsonPath.getParentPath.bind(JsonPath);
  const listChildren = JsonPath.listChildren.bind(JsonPath);
  const getSiblingPaths = JsonPath.getSiblingPaths.bind(JsonPath);
  const buildFocusExport = JsonPath.buildFocusExport.bind(JsonPath);
  const typeOfValue = JsonPath.typeOfValue.bind(JsonPath);
  const isRootPath = JsonPath.isRootPath.bind(JsonPath);

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function countChildTypes(value) {
    const counts = { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0, undefined: 0 };
    const items = Array.isArray(value) ? value : Object.values(value);
    for (const item of items) {
      const t = typeOfValue(item);
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }

  function renderTypeChips(counts) {
    const order = ['object', 'array', 'string', 'number', 'boolean', 'null'];
    return order
      .filter(function (t) { return counts[t] > 0; })
      .map(function (t) {
        return '<span class="badge oe-type-chip oe-type-chip-' + t + '">' + t + ' ' + counts[t] + '</span>';
      })
      .join('');
  }

  /**
   * @param {unknown} value
   * @param {{ maxStringPreview?: number, path?: string }} opts
   * @returns {string}
   */
  function renderDetailHtml(value, opts) {
    opts = opts || {};
    const maxString = opts.maxStringPreview || 500;
    const t = typeOfValue(value);

    if (t === 'undefined') {
      return '<div class="oe-scalar oe-scalar-undefined">' +
        '<span class="state-badge" data-state="loading">undefined</span>' +
        '<p class="oe-scalar-hint">La ruta no existe o el valor no está definido.</p></div>';
    }

    if (t === 'null') {
      return '<div class="oe-scalar oe-scalar-null">' +
        '<span class="oe-scalar-label">null</span>' +
        '<p class="oe-scalar-hint">Valor nulo</p></div>';
    }

    if (t === 'boolean') {
      const cls = value ? 'true' : 'false';
      return '<div class="oe-scalar oe-scalar-boolean">' +
        '<span class="state-badge oe-bool-badge oe-bool-' + cls + '" data-state="' + (value ? 'playing' : 'warning') + '">' +
        String(value) + '</span></div>';
    }

    if (t === 'number') {
      return '<div class="oe-scalar oe-scalar-number">' +
        '<span class="oe-scalar-value">' + escapeHtml(value) + '</span>' +
        '<span class="oe-scalar-meta badge badge-muted">number</span></div>';
    }

    if (t === 'string') {
      const full = String(value);
      const truncated = full.length > maxString;
      const visible = truncated ? full.slice(0, maxString) : full;
      return '<div class="oe-scalar oe-scalar-string">' +
        '<div class="oe-string-quote">"' + escapeHtml(visible) + (truncated ? '…' : '') + '"</div>' +
        '<div class="oe-scalar-meta action-row">' +
          '<span class="badge badge-muted">' + full.length + ' caracteres</span>' +
          (truncated ? '<button type="button" class="btn btn-ghost btn-ghost-sm" data-oe-expand-string>Ver completo</button>' : '') +
          '<button type="button" class="btn btn-ghost btn-ghost-sm" data-oe-copy-value>Copiar valor</button>' +
        '</div>' +
        (truncated ? '<pre class="oe-string-full" hidden data-oe-string-full>' + escapeHtml(full) + '</pre>' : '') +
      '</div>';
    }

    if (t === 'array') {
      const counts = countChildTypes(value);
      const keys = value.length ? 'Índices 0–' + (value.length - 1) : 'Vacío';
      return '<div class="oe-container-summary">' +
        '<p class="oe-summary-title">Array · <strong>' + value.length + '</strong> elementos</p>' +
        '<p class="oe-summary-sub">' + keys + '</p>' +
        '<div class="oe-summary-chips action-row">' + renderTypeChips(counts) + '</div>' +
        '<p class="oe-scalar-hint">Selecciona un índice en la lista para explorar.</p></div>';
    }

    if (t === 'object') {
      const keys = Object.keys(value);
      const counts = countChildTypes(value);
      const preview = keys.slice(0, 8).map(function (k) {
        return '<span class="badge badge-primary">' + escapeHtml(k) + '</span>';
      }).join('');
      return '<div class="oe-container-summary">' +
        '<p class="oe-summary-title">Object · <strong>' + keys.length + '</strong> claves</p>' +
        (keys.length ? '<div class="oe-summary-keys action-row">' + preview + (keys.length > 8 ? '<span class="badge badge-muted">+' + (keys.length - 8) + '</span>' : '') + '</div>' : '') +
        '<div class="oe-summary-chips action-row">' + renderTypeChips(counts) + '</div>' +
        '<p class="oe-scalar-hint">Selecciona una clave en la lista para explorar.</p></div>';
    }

    return '<pre class="oe-detail-fallback">' + escapeHtml(String(value)) + '</pre>';
  }

  function canEnter(type) {
    return type === 'object' || type === 'array';
  }

  function bindDetailActions(detailBodyEl, value) {
    const expandBtn = detailBodyEl.querySelector('[data-oe-expand-string]');
    const fullEl = detailBodyEl.querySelector('[data-oe-string-full]');
    if (expandBtn && fullEl) {
      expandBtn.addEventListener('click', function () {
        const hidden = fullEl.hidden;
        fullEl.hidden = !hidden;
        expandBtn.textContent = hidden ? 'Ocultar' : 'Ver completo';
      });
    }
    const copyValBtn = detailBodyEl.querySelector('[data-oe-copy-value]');
    if (copyValBtn && typeof value === 'string') {
      copyValBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(value).catch(function () {});
      });
    }
  }

  /**
   * @param {HTMLElement} container
   * @param {object} options
   * @param {() => unknown} options.getData
   * @param {string} [options.path]
   * @param {string} [options.rootLabel]
   * @param {(path: string) => void} [options.onPathChange]
   * @param {Array<{ label: string, path: string }>} [options.rootTabs]
   * @param {number} [options.maxArrayChildren]
   * @param {number} [options.maxStringPreview]
   */
  function mount(container, options) {
    if (!container || !options || typeof options.getData !== 'function') {
      throw new Error('ObjectExplorer.mount requires container and getData');
    }

    const rootLabel = options.rootLabel || DEFAULT_ROOT;
    const maxArray = options.maxArrayChildren || 50;
    const maxStringPreview = options.maxStringPreview || 500;
    let currentPath = options.path || rootLabel;
    let selectedChildPath = null;

    container.innerHTML =
      '<div class="object-explorer" tabindex="0" data-oe-root>' +
        '<div class="oe-root-tabs action-row" data-oe-tabs></div>' +
        '<div class="oe-toolbar action-row">' +
          '<nav class="oe-breadcrumb" data-oe-breadcrumb aria-label="Path"></nav>' +
          '<div class="oe-nav-buttons">' +
            '<button type="button" class="btn btn-outline btn-small" data-oe-up disabled>Subir</button>' +
            '<button type="button" class="btn btn-outline btn-small" data-oe-prev disabled>Anterior</button>' +
            '<button type="button" class="btn btn-outline btn-small" data-oe-next disabled>Siguiente</button>' +
            '<button type="button" class="btn btn-ghost btn-ghost-sm" data-oe-copy title="Copiar path">Copiar path</button>' +
            '<button type="button" class="btn btn-outline btn-small" data-oe-copy-json title="Copiar JSON del foco">Copiar JSON</button>' +
            '<button type="button" class="btn btn-outline btn-small" data-oe-download-json title="Descargar JSON del foco">Descargar</button>' +
          '</div>' +
        '</div>' +
        '<div class="oe-children-wrap">' +
          '<div class="oe-children-header"><span>Clave</span><span>Tipo</span><span>Vista previa</span></div>' +
          '<div class="oe-children list-panel" data-oe-children></div>' +
        '</div>' +
        '<div class="oe-detail inset-panel">' +
          '<div class="oe-detail-header">' +
            '<span class="oe-detail-title" data-oe-detail-title>Valor</span>' +
            '<span class="badge oe-detail-type" data-oe-detail-type></span>' +
          '</div>' +
          '<div class="oe-detail-body" data-oe-detail-body></div>' +
        '</div>' +
      '</div>';

    const rootEl = container.querySelector('[data-oe-root]');
    const tabsEl = container.querySelector('[data-oe-tabs]');
    const breadcrumbEl = container.querySelector('[data-oe-breadcrumb]');
    const childrenEl = container.querySelector('[data-oe-children]');
    const detailTitleEl = container.querySelector('[data-oe-detail-title]');
    const detailTypeEl = container.querySelector('[data-oe-detail-type]');
    const detailBodyEl = container.querySelector('[data-oe-detail-body]');
    const btnUp = container.querySelector('[data-oe-up]');
    const btnPrev = container.querySelector('[data-oe-prev]');
    const btnNext = container.querySelector('[data-oe-next]');
    const btnCopy = container.querySelector('[data-oe-copy]');
    const btnCopyJson = container.querySelector('[data-oe-copy-json]');
    const btnDownloadJson = container.querySelector('[data-oe-download-json]');

    function getFocusExport() {
      const root = options.getData();
      if (root == null) return null;
      return buildFocusExport(root, currentPath, {
        rootLabel: rootLabel,
        maxValueChars: options.maxExportValueChars || 50000
      });
    }

    function getFocusExportJson(pretty) {
      const packet = getFocusExport();
      if (!packet) return null;
      return pretty ? JSON.stringify(packet, null, 2) : JSON.stringify(packet);
    }

    function safeExportFilename() {
      const safe = currentPath.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_|_$/g, '') || rootLabel;
      return 'zeus-focus-' + safe + '.json';
    }

    function downloadFocusExport() {
      const json = getFocusExportJson(true);
      if (!json) return;
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeExportFilename();
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function setPath(path) {
      currentPath = path || rootLabel;
      selectedChildPath = null;
      if (typeof options.onPathChange === 'function') {
        options.onPathChange(currentPath);
      }
      render();
    }

    function renderTabs() {
      if (!options.rootTabs || !options.rootTabs.length) {
        tabsEl.hidden = true;
        return;
      }
      tabsEl.hidden = false;
      tabsEl.innerHTML = options.rootTabs.map(function (tab) {
        const active = currentPath === tab.path || currentPath.startsWith(tab.path + '.') ? ' active' : '';
        return '<button type="button" class="btn btn-outline btn-small oe-root-tab' + active + '" data-path="' +
          escapeHtml(tab.path) + '">' + escapeHtml(tab.label) + '</button>';
      }).join('');
      tabsEl.querySelectorAll('[data-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setPath(btn.getAttribute('data-path'));
        });
      });
    }

    function renderBreadcrumb() {
      const segments = parsePath(currentPath, rootLabel);
      const parts = [
        '<button type="button" class="oe-crumb' + (segments.length === 0 ? ' oe-crumb-current' : '') +
        '" data-path="' + escapeHtml(rootLabel) + '">' + escapeHtml(rootLabel) + '</button>'
      ];
      for (let i = 0; i < segments.length; i++) {
        parts.push('<span class="oe-crumb-sep">›</span>');
        const subPath = formatPath(segments.slice(0, i + 1), rootLabel);
        const isLast = i === segments.length - 1;
        parts.push(
          '<button type="button" class="oe-crumb' + (isLast ? ' oe-crumb-current' : '') + '" data-path="' +
          escapeHtml(subPath) + '">' + escapeHtml(segments[i]) + '</button>'
        );
      }
      breadcrumbEl.innerHTML = parts.join('');
      breadcrumbEl.querySelectorAll('.oe-crumb[data-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setPath(btn.getAttribute('data-path'));
        });
      });
    }

    function renderDetail(value) {
      const t = typeOfValue(value);
      detailTitleEl.textContent = currentPath;
      detailTypeEl.textContent = t;
      detailTypeEl.className = 'badge oe-detail-type oe-child-type-' + t;
      detailBodyEl.innerHTML = renderDetailHtml(value, { maxStringPreview: maxStringPreview, path: currentPath });
      bindDetailActions(detailBodyEl, value);
    }

    function renderChildren(value) {
      const children = listChildren(value, currentPath, { maxArray: maxArray, rootLabel: rootLabel });
      const t = typeOfValue(value);

      if (!children.length) {
        if (t !== 'object' && t !== 'array') {
          childrenEl.innerHTML = '<p class="oe-empty list-empty">Valor escalar — usa Subir para navegar</p>';
        } else {
          childrenEl.innerHTML = '<p class="oe-empty list-empty">Sin propiedades</p>';
        }
        return;
      }

      childrenEl.innerHTML = children.map(function (child) {
        if (!child.childPath) {
          return '<div class="oe-child oe-child-meta"><span class="oe-child-key">' + escapeHtml(child.key) +
            '</span><span class="oe-child-type">' + escapeHtml(child.type) + '</span><span class="oe-child-preview">' +
            escapeHtml(child.preview) + '</span></div>';
        }
        const enterable = canEnter(child.type);
        const selected = selectedChildPath === child.childPath ? ' selected' : '';
        return '<button type="button" class="list-item oe-child' + selected + '" data-path="' +
          escapeHtml(child.childPath) + '">' +
          '<span class="oe-child-key">' + escapeHtml(child.key) + (enterable ? ' →' : '') + '</span>' +
          '<span class="oe-child-type oe-child-type-' + child.type + '">' + escapeHtml(child.type) + '</span>' +
          '<span class="oe-child-preview">' + escapeHtml(child.preview) + '</span></button>';
      }).join('');

      childrenEl.querySelectorAll('[data-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectedChildPath = btn.getAttribute('data-path');
          setPath(selectedChildPath);
        });
      });
    }

    function render() {
      const root = options.getData();
      if (root == null) {
        childrenEl.innerHTML = '<p class="oe-empty list-empty">Esperando datos…</p>';
        detailBodyEl.innerHTML = '<p class="oe-scalar-hint">—</p>';
        detailTypeEl.textContent = '';
        return;
      }

      renderTabs();
      renderBreadcrumb();

      const segments = parsePath(currentPath, rootLabel);
      const value = segments.length === 0 ? root : getAtPath(root, currentPath, rootLabel);
      const siblings = getSiblingPaths(currentPath, root, rootLabel);

      btnUp.disabled = isRootPath(currentPath, rootLabel);
      btnPrev.disabled = !siblings.prev;
      btnNext.disabled = !siblings.next;

      renderDetail(value);
      renderChildren(value);
    }

    btnUp.addEventListener('click', function () {
      setPath(getParentPath(currentPath, rootLabel));
    });

    btnPrev.addEventListener('click', function () {
      const root = options.getData();
      const sib = getSiblingPaths(currentPath, root, rootLabel);
      if (sib.prev) setPath(sib.prev);
    });

    btnNext.addEventListener('click', function () {
      const root = options.getData();
      const sib = getSiblingPaths(currentPath, root, rootLabel);
      if (sib.next) setPath(sib.next);
    });

    btnCopy.addEventListener('click', function () {
      navigator.clipboard.writeText(currentPath).catch(function () {});
    });

    btnCopyJson.addEventListener('click', function () {
      const json = getFocusExportJson(true);
      if (json) navigator.clipboard.writeText(json).catch(function () {});
    });

    btnDownloadJson.addEventListener('click', downloadFocusExport);

    rootEl.addEventListener('keydown', function (e) {
      const root = options.getData();
      const sib = getSiblingPaths(currentPath, root, rootLabel);
      if (e.key === 'ArrowUp' || e.key === 'Escape') {
        if (!isRootPath(currentPath, rootLabel)) {
          e.preventDefault();
          setPath(getParentPath(currentPath, rootLabel));
        }
      } else if (e.key === 'ArrowLeft' && sib.prev) {
        e.preventDefault();
        setPath(sib.prev);
      } else if (e.key === 'ArrowRight' && sib.next) {
        e.preventDefault();
        setPath(sib.next);
      }
    });

    render();

    return {
      setPath: setPath,
      getPath: function () { return currentPath; },
      refresh: render,
      getRootLabel: function () { return rootLabel; },
      getFocusExport: getFocusExport,
      getFocusExportJson: getFocusExportJson,
      downloadFocusExport: downloadFocusExport
    };
  }

  global.ZeusObjectExplorer = { mount: mount, JsonPath: global.ZeusJsonPath, DEFAULT_ROOT: DEFAULT_ROOT };
})(typeof window !== 'undefined' ? window : globalThis);
