/**
 * View kit · ventanitas HTML (WP-24, UX §UX-2.2).
 *
 * createPanel construye una ventanita DOM con barra de título (título +
 * botón ▸/▾ si es colapsable + la propia barra como asa de arrastre si es
 * draggable) y persiste `{collapsed, x, y}` en localStorage con clave
 * `delta:<view>:<id>` — la ley del proyecto: la operativa vive en HTML
 * fuera del canvas, y esas ventanitas se pueden mover y plegar.
 *
 * Sin three ni imports: DOM puro con `doc`/`storage` inyectables para que
 * los tests de node lo ejerciten con stubs.
 */

/** Clave de persistencia por vista: `delta:<view>:<id>`. */
export function panelStorageKey(view, id) {
  return `delta:${view || 'view'}:${id}`;
}

/**
 * Lee el estado persistido de un panel. Nunca lanza: storage roto o JSON
 * corrupto ⇒ `{}`.
 * @param {{getItem(k:string):string|null}} storage
 * @param {string} key
 * @returns {{collapsed?: boolean, x?: number, y?: number}}
 */
export function loadPanelState(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Mezcla `patch` sobre el estado guardado y lo persiste. Nunca lanza.
 * @returns el estado resultante
 */
export function savePanelState(storage, key, patch) {
  const next = { ...loadPanelState(storage, key), ...patch };
  try {
    storage?.setItem?.(key, JSON.stringify(next));
  } catch {
    /* storage lleno/bloqueado: el panel sigue funcionando sin persistir */
  }
  return next;
}

/**
 * Encaja una esquina (x,y) de un panel w×h dentro de unos límites W×H,
 * dejando siempre visible al menos la barra de título.
 */
export function clampToBounds(x, y, w, h, boundsW, boundsH) {
  const maxX = Math.max(0, boundsW - Math.min(w, boundsW));
  const maxY = Math.max(0, boundsH - Math.min(h, boundsH));
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY)
  };
}

/**
 * Ventanita DOM con barra de título, colapso y arrastre opcionales.
 *
 * @param {object} opts
 * @param {string} opts.id                id DOM del panel (y de su clave de storage)
 * @param {string} opts.title             título de la barra
 * @param {boolean} [opts.collapsible]    botón ▸/▾ (default true)
 * @param {boolean} [opts.draggable]      barra como asa de arrastre (default false)
 * @param {boolean} [opts.defaultCollapsed]
 * @param {Element} [opts.mount]          contenedor (default #viewer-stage o body)
 * @param {string}  [opts.view]           vista actual (clave `delta:<view>:<id>`)
 * @param {string}  [opts.className]      clase extra de posicionamiento
 * @param {Document} [opts.doc]           inyectable en tests
 * @param {Storage} [opts.storage]        inyectable en tests
 * @returns {{ el: Element, body: Element, bar: Element, id: string,
 *   setTitle(t:string):void, setCollapsed(c:boolean):void, isCollapsed():boolean,
 *   adopt(node:Element):void, destroy():void }}
 */
export function createPanel(opts) {
  const doc = opts.doc ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) throw new Error('createPanel: sin document (¿falta doc en el test?)');
  const storage =
    opts.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  const collapsible = opts.collapsible !== false;
  const draggable = opts.draggable === true;
  const key = panelStorageKey(opts.view, opts.id);
  const saved = loadPanelState(storage, key);

  const el = doc.createElement('div');
  el.id = opts.id;
  el.className = `arg-panel${draggable ? ' draggable' : ''}${opts.className ? ` ${opts.className}` : ''}`;

  const bar = doc.createElement('div');
  bar.className = 'arg-panel-bar';

  const titleEl = doc.createElement('span');
  titleEl.className = 'arg-panel-title';
  titleEl.textContent = opts.title ?? opts.id;
  bar.appendChild(titleEl);

  let toggleBtn = null;
  const body = doc.createElement('div');
  body.className = 'arg-panel-body';

  let collapsed = false;

  function applyCollapsed() {
    if (collapsed) {
      if (!el.className.includes('collapsed')) el.className += ' collapsed';
    } else {
      el.className = el.className
        .split(' ')
        .filter((c) => c !== 'collapsed')
        .join(' ');
    }
    if (toggleBtn) toggleBtn.textContent = collapsed ? '▸' : '▾';
  }

  function setCollapsed(next, { persist = true } = {}) {
    collapsed = Boolean(next);
    applyCollapsed();
    if (persist) savePanelState(storage, key, { collapsed });
  }

  if (collapsible) {
    toggleBtn = doc.createElement('button');
    toggleBtn.className = 'arg-panel-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute?.('aria-label', 'plegar/desplegar');
    toggleBtn.addEventListener('click', (ev) => {
      ev?.stopPropagation?.();
      setCollapsed(!collapsed);
    });
    bar.appendChild(toggleBtn);
  }

  el.appendChild(bar);
  el.appendChild(body);

  const mount =
    opts.mount ?? doc.getElementById?.('viewer-stage') ?? doc.body ?? null;
  if (mount) mount.appendChild(el);

  // ---- estado persistido: colapso + posición ------------------------------
  setCollapsed(saved.collapsed ?? opts.defaultCollapsed ?? false, { persist: false });

  function applyPosition(x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }

  if (draggable && typeof saved.x === 'number' && typeof saved.y === 'number') {
    applyPosition(saved.x, saved.y);
  }

  // ---- arrastre (asa = barra de título) ------------------------------------
  if (draggable) {
    let dragging = null; // { dx, dy }

    bar.addEventListener('pointerdown', (ev) => {
      if (ev.target === toggleBtn) return;
      const rect = el.getBoundingClientRect?.();
      if (!rect) return;
      dragging = { dx: ev.clientX - rect.left, dy: ev.clientY - rect.top };
      bar.setPointerCapture?.(ev.pointerId);
      ev.preventDefault?.();
    });

    bar.addEventListener('pointermove', (ev) => {
      if (!dragging || !mount) return;
      const mountRect = mount.getBoundingClientRect?.();
      if (!mountRect) return;
      const raw = {
        x: ev.clientX - mountRect.left - dragging.dx,
        y: ev.clientY - mountRect.top - dragging.dy
      };
      const { x, y } = clampToBounds(
        raw.x,
        raw.y,
        el.offsetWidth ?? 0,
        el.offsetHeight ?? 0,
        mountRect.width,
        mountRect.height
      );
      applyPosition(x, y);
    });

    const endDrag = (ev) => {
      if (!dragging) return;
      dragging = null;
      bar.releasePointerCapture?.(ev.pointerId);
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        savePanelState(storage, key, { x, y });
      }
    };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
  }

  return {
    el,
    body,
    bar,
    id: opts.id,
    setTitle(t) {
      titleEl.textContent = t;
    },
    setCollapsed,
    isCollapsed: () => collapsed,
    /** Mueve un nodo ya existente (p.ej. el HUD server-rendered) al cuerpo. */
    adopt(node) {
      if (node) body.appendChild(node);
    },
    destroy() {
      el.remove?.();
    }
  };
}
