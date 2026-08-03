const canvas = document.querySelector('#package-canvas');
const stage = document.querySelector('.stage');
const context = canvas.getContext('2d');
const packageSelect = document.querySelector('#package-select');
const searchInput = document.querySelector('#package-search');
const focusInput = document.querySelector('#focus-relations');
const nodeWidth = 168;
const nodeHeight = 72;
const waveColors = { 1: '#f1c75b', 2: '#6dd8d2', 3: '#ff7369' };

const state = {
  catalog: null,
  activeWaves: new Set([1, 2, 3]),
  activeCategories: new Set(),
  query: '',
  focusOnly: false,
  selected: 'protocol',
  hovered: null,
  visiblePackages: [],
  visibleEdges: [],
  nodes: new Map(),
  lanes: [],
  worldBounds: { x: 0, y: 0, width: 900, height: 560 },
  zoom: 1,
  panX: 0,
  panY: 0,
  dragging: false,
  pointerX: 0,
  pointerY: 0
};

function packageById(id) {
  return state.catalog?.packages.find((item) => item.id === id) ?? null;
}

function relatedIds(id) {
  const related = new Set();
  for (const edge of state.catalog?.edges ?? []) {
    if (edge.from === id) related.add(edge.to);
    if (edge.to === id) related.add(edge.from);
  }
  return related;
}

function packageMatchesQuery(item, query) {
  if (!query) return true;
  const searchable = [
    item.name,
    item.description,
    item.role,
    item.group,
    ...item.symbols,
    ...item.subpaths
  ].join(' ').toLocaleLowerCase('es');
  return searchable.includes(query);
}

function baseVisiblePackages() {
  return state.catalog.packages.filter((item) => (
    state.activeWaves.has(item.wave)
    && state.activeCategories.has(item.category)
    && packageMatchesQuery(item, state.query)
  ));
}

function reconcileSelection(candidates) {
  if (candidates.some((item) => item.id === state.selected)) return;
  state.selected = candidates.find((item) => item.id === 'protocol')?.id
    ?? candidates[0]?.id
    ?? null;
}

function filteredPackages() {
  const candidates = baseVisiblePackages();
  reconcileSelection(candidates);
  if (!state.focusOnly || !state.selected) return candidates;
  const neighborhood = relatedIds(state.selected);
  neighborhood.add(state.selected);
  return candidates.filter((item) => neighborhood.has(item.id));
}

function layoutPackages(packages) {
  const definitions = state.catalog.waves.filter((wave) => (
    state.activeWaves.has(wave.id)
    && packages.some((item) => item.wave === wave.id)
  ));

  if (definitions.length === 0) {
    state.nodes = new Map();
    state.lanes = [];
    state.worldBounds = { x: 0, y: 0, width: 900, height: 560 };
    return;
  }

  const laneCount = definitions.length;
  const laneWidth = laneCount === 1 ? 980 : laneCount === 2 ? 760 : 590;
  const columnCount = laneCount === 1 ? 5 : laneCount === 2 ? 4 : 3;
  const laneGap = 26;
  const outerMargin = 22;
  const nodeGapX = 16;
  const nodeGapY = 22;
  const lanePackages = definitions.map((wave) => ({
    wave,
    packages: packages
      .filter((item) => item.wave === wave.id)
      .sort((left, right) => (
        left.category.localeCompare(right.category)
        || left.name.localeCompare(right.name)
      ))
  }));
  const maxRows = Math.max(...lanePackages.map(({ packages: items }) => (
    Math.ceil(items.length / columnCount)
  )));
  const worldHeight = Math.max(540, 110 + maxRows * (nodeHeight + nodeGapY));
  const nodes = new Map();

  state.lanes = lanePackages.map(({ wave, packages: items }, laneIndex) => {
    const x = outerMargin + laneIndex * (laneWidth + laneGap);
    items.forEach((item, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      nodes.set(item.id, {
        item,
        x: x + 22 + column * (nodeWidth + nodeGapX),
        y: 88 + row * (nodeHeight + nodeGapY)
      });
    });
    return {
      wave,
      count: items.length,
      x,
      y: 24,
      width: laneWidth,
      height: worldHeight - 48
    };
  });

  state.nodes = nodes;
  state.worldBounds = {
    x: 0,
    y: 0,
    width: outerMargin * 2 + laneCount * laneWidth + (laneCount - 1) * laneGap,
    height: worldHeight
  };
}

function updateVisibleGraph({ fit = false } = {}) {
  state.visiblePackages = filteredPackages();
  const visibleIds = new Set(state.visiblePackages.map((item) => item.id));
  state.visibleEdges = state.catalog.edges.filter((edge) => (
    visibleIds.has(edge.from) && visibleIds.has(edge.to)
  ));
  layoutPackages(state.visiblePackages);
  updateControls();
  updateInspector();
  if (fit) fitMap();
  else draw();
}

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
  canvas.dataset.pixelRatio = String(pixelRatio);
  draw();
}

function fitMap() {
  const rect = stage.getBoundingClientRect();
  const topInset = rect.width < 760 ? 126 : 112;
  const bottomInset = rect.width < 760 ? 118 : 82;
  const usableWidth = Math.max(180, rect.width - 36);
  const usableHeight = Math.max(160, rect.height - topInset - bottomInset);
  const bounds = state.worldBounds;
  state.zoom = Math.min(
    usableWidth / bounds.width,
    usableHeight / bounds.height,
    1.05
  );
  state.zoom = Math.max(0.18, state.zoom);
  state.panX = (rect.width - bounds.width * state.zoom) / 2 - bounds.x * state.zoom;
  state.panY = topInset
    + (usableHeight - bounds.height * state.zoom) / 2
    - bounds.y * state.zoom;
  updateZoomOutput();
  draw();
}

function updateZoomOutput() {
  document.querySelector('#zoom-level').value = `${Math.round(state.zoom * 100)}%`;
}

function worldPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.panX) / state.zoom,
    y: (clientY - rect.top - state.panY) / state.zoom
  };
}

function hitNode(clientX, clientY) {
  const point = worldPoint(clientX, clientY);
  return [...state.nodes.values()].reverse().find((node) => (
    point.x >= node.x
    && point.x <= node.x + nodeWidth
    && point.y >= node.y
    && point.y <= node.y + nodeHeight
  ));
}

function drawGrid(width, height) {
  const gridSize = 80 * state.zoom;
  if (gridSize < 20) return;
  context.save();
  context.strokeStyle = 'rgba(109, 216, 210, 0.07)';
  context.lineWidth = 1;
  const offsetX = ((state.panX % gridSize) + gridSize) % gridSize;
  const offsetY = ((state.panY % gridSize) + gridSize) % gridSize;
  for (let x = offsetX; x < width; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = offsetY; y < height; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

function fitText(text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 2 && context.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function drawLanes() {
  for (const lane of state.lanes) {
    const color = waveColors[lane.wave.id];
    context.save();
    context.fillStyle = `${color}09`;
    context.strokeStyle = `${color}38`;
    context.lineWidth = 1;
    context.fillRect(lane.x, lane.y, lane.width, lane.height);
    context.strokeRect(lane.x + 0.5, lane.y + 0.5, lane.width - 1, lane.height - 1);
    context.fillStyle = color;
    context.font = '10px "Cascadia Code", Consolas, monospace';
    context.fillText(`OLA 0${lane.wave.id}`, lane.x + 18, lane.y + 25);
    context.fillStyle = 'rgba(233, 238, 232, 0.82)';
    context.font = '600 15px Bahnschrift, "DIN Alternate", sans-serif';
    context.fillText(lane.wave.label.toUpperCase(), lane.x + 18, lane.y + 48);
    context.fillStyle = 'rgba(233, 238, 232, 0.42)';
    context.font = '9px "Cascadia Code", Consolas, monospace';
    context.fillText(`${lane.count} PAQUETES VISIBLES`, lane.x + 18, lane.y + 65);
    context.restore();
  }
}

function edgeEndpoints(fromNode, toNode) {
  const start = {
    x: fromNode.x + nodeWidth / 2,
    y: fromNode.y + nodeHeight / 2
  };
  const end = {
    x: toNode.x + nodeWidth / 2,
    y: toNode.y + nodeHeight / 2
  };
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const boundaryDistance = Math.min(
    (nodeWidth / 2 + 5) / Math.max(Math.abs(Math.cos(angle)), 0.01),
    (nodeHeight / 2 + 5) / Math.max(Math.abs(Math.sin(angle)), 0.01)
  );
  return {
    angle,
    startX: start.x + Math.cos(angle) * boundaryDistance,
    startY: start.y + Math.sin(angle) * boundaryDistance,
    endX: end.x - Math.cos(angle) * boundaryDistance,
    endY: end.y - Math.sin(angle) * boundaryDistance
  };
}

function drawEdge(edge) {
  const fromNode = state.nodes.get(edge.from);
  const toNode = state.nodes.get(edge.to);
  if (!fromNode || !toNode) return;
  const active = edge.from === state.selected || edge.to === state.selected;
  const points = edgeEndpoints(fromNode, toNode);
  const color = active ? '#6dd8d2' : 'rgba(181, 207, 201, 0.13)';

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = active ? 1.8 : 0.8;
  context.setLineDash(active ? [7, 4] : [3, 7]);
  context.beginPath();
  context.moveTo(points.startX, points.startY);
  context.lineTo(points.endX, points.endY);
  context.stroke();
  context.setLineDash([]);
  context.translate(points.endX, points.endY);
  context.rotate(points.angle);
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-7, -3.5);
  context.lineTo(-7, 3.5);
  context.closePath();
  context.fill();
  context.restore();
}

function drawNode(node) {
  const { item, x, y } = node;
  const category = state.catalog.categories[item.category];
  const selected = item.id === state.selected;
  const hovered = item.id === state.hovered;
  const related = state.selected ? relatedIds(state.selected).has(item.id) : false;
  const faded = state.selected && !selected && !related && !state.focusOnly;

  context.save();
  context.globalAlpha = faded ? 0.58 : 1;
  context.fillStyle = selected ? `${category.color}18` : 'rgba(20, 27, 30, 0.96)';
  context.strokeStyle = selected || hovered ? category.color : 'rgba(199, 220, 214, 0.25)';
  context.lineWidth = selected ? 2 : 1;
  context.fillRect(x, y, nodeWidth, nodeHeight);
  context.strokeRect(x + 0.5, y + 0.5, nodeWidth - 1, nodeHeight - 1);
  context.fillStyle = category.color;
  context.fillRect(x, y, 4, nodeHeight);

  context.fillStyle = waveColors[item.wave];
  context.font = '8px "Cascadia Code", Consolas, monospace';
  context.fillText(`0${item.wave}`, x + 13, y + 16);
  context.fillStyle = 'rgba(225, 233, 229, 0.48)';
  context.fillText(category.label.toUpperCase(), x + 35, y + 16);

  context.fillStyle = '#eef2ed';
  context.font = '600 13px Bahnschrift, "DIN Alternate", sans-serif';
  context.fillText(fitText(item.id, nodeWidth - 24), x + 13, y + 39);

  context.fillStyle = category.color;
  context.font = '8px "Cascadia Code", Consolas, monospace';
  const surfaceLabel = item.symbols.length
    ? `${item.symbols.length} SIMBOLOS / ${item.subpaths.length} SUBPATHS`
    : `MANIFEST / ${item.subpaths.length} SUBPATHS`;
  context.fillText(fitText(surfaceLabel, nodeWidth - 24), x + 13, y + 58);
  context.restore();
}

function drawEmpty() {
  context.save();
  context.fillStyle = 'rgba(233, 238, 232, 0.42)';
  context.font = '11px "Cascadia Code", Consolas, monospace';
  context.textAlign = 'center';
  context.fillText('SIN PAQUETES PARA ESTA COMBINACION', state.worldBounds.width / 2, 270);
  context.restore();
}

function draw() {
  const pixelRatio = Number(canvas.dataset.pixelRatio || 1);
  const width = canvas.width / pixelRatio;
  const height = canvas.height / pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  drawGrid(width, height);

  context.setTransform(
    pixelRatio * state.zoom,
    0,
    0,
    pixelRatio * state.zoom,
    pixelRatio * state.panX,
    pixelRatio * state.panY
  );
  drawLanes();
  state.visibleEdges.forEach(drawEdge);
  state.nodes.forEach(drawNode);
  if (state.visiblePackages.length === 0) drawEmpty();
}

function relationNames(id, direction) {
  const ids = state.catalog.edges
    .filter((edge) => edge[direction] === id)
    .map((edge) => edge[direction === 'from' ? 'to' : 'from']);
  if (ids.length === 0) return 'ninguno en packages';
  return ids
    .map((relatedId) => packageById(relatedId)?.name ?? `@zeus/${relatedId}`)
    .sort()
    .join(' / ');
}

function updateInspector() {
  const item = packageById(state.selected);
  const inspector = document.querySelector('.inspector');
  if (!item) {
    document.querySelector('#package-name').textContent = 'sin resultados';
    document.querySelector('#package-summary').textContent = 'Ajusta las olas, funciones o la busqueda.';
    packageSelect.replaceChildren();
    return;
  }

  const category = state.catalog.categories[item.category];
  const waveIndex = state.catalog.waves.findIndex((wave) => wave.id === item.wave) + 1;
  const visibleIndex = state.visiblePackages.findIndex((candidate) => candidate.id === item.id) + 1;
  document.querySelector('#sheet-number').textContent = `${waveIndex}.${String(Math.max(visibleIndex, 1)).padStart(2, '0')}`;
  document.querySelector('#package-category').textContent = category.label;
  document.querySelector('#package-namespace').textContent = '@zeus';
  document.querySelector('#package-name').textContent = item.id;
  document.querySelector('#package-role').textContent = `OLA 0${item.wave} / ${item.role.toUpperCase()}`;
  document.querySelector('#package-summary').textContent = item.description;
  document.querySelector('#package-version').textContent = item.version;
  document.querySelector('#package-group').textContent = item.group;
  document.querySelector('#package-manifest-role').textContent = item.role;
  document.querySelector('#export-count').textContent = `${item.symbols.length} SIMBOLOS`;
  document.querySelector('#surface-status').textContent = item.evidence.length
    ? `${item.subpaths.length} subpaths · ${item.evidence.length} declaraciones publicas`
    : `${item.subpaths.length} subpaths · sin .d.ts publico declarado`;
  document.querySelector('#depends-on').textContent = relationNames(item.id, 'from');
  document.querySelector('#used-by').textContent = relationNames(item.id, 'to');
  document.querySelector('#source-path').textContent = item.evidence.length
    ? `${item.evidence[0]}${item.evidence.length > 1 ? ` +${item.evidence.length - 1}` : ''}`
    : item.manifestPath;
  inspector.style.setProperty('--category-color', category.color);

  const symbols = item.symbols.length ? item.symbols : ['Sin declaraciones publicas'];
  const exportList = document.querySelector('#package-exports');
  exportList.replaceChildren(...symbols.map((symbol) => {
    const entry = document.createElement('li');
    entry.textContent = symbol;
    return entry;
  }));

  packageSelect.replaceChildren(...state.visiblePackages.map((candidate) => {
    const option = document.createElement('option');
    option.value = candidate.id;
    option.textContent = candidate.name;
    option.selected = candidate.id === item.id;
    return option;
  }));
}

function updateControls() {
  const activeWaveIds = [...state.activeWaves].sort();
  const activeWaveCount = activeWaveIds.length;
  document.querySelector('#scope-label').textContent = activeWaveCount === 1
    ? '1 OLA ACTIVA'
    : `${activeWaveCount} OLAS ACTIVAS`;
  document.querySelector('#scope-count').textContent = `${state.visiblePackages.length} de ${state.catalog.packages.length} paquetes`;
  document.querySelector('#map-index-wave').textContent = activeWaveIds.length
    ? `E / ${activeWaveIds.map((wave) => `0${wave}`).join('+')}`
    : 'E / --';
  document.querySelector('#map-index-count').textContent = `${state.visiblePackages.length} NODOS / ${state.visibleEdges.length} ENLACES`;

  document.querySelectorAll('.wave-toggle input').forEach((input) => {
    input.checked = state.activeWaves.has(Number(input.value));
  });
  document.querySelectorAll('.legend-item').forEach((button) => {
    const active = state.activeCategories.has(button.dataset.category);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function populateControls() {
  const legend = document.querySelector('#category-legend');
  legend.replaceChildren(...Object.entries(state.catalog.categories).map(([categoryId, category]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'legend-item is-active';
    button.dataset.category = categoryId;
    button.setAttribute('aria-pressed', 'true');
    button.style.setProperty('--legend-color', category.color);
    const swatch = document.createElement('i');
    const label = document.createElement('span');
    const count = state.catalog.packages.filter((item) => item.category === categoryId).length;
    label.textContent = `${category.label} ${count}`;
    button.append(swatch, label);
    button.addEventListener('click', () => {
      if (state.activeCategories.has(categoryId)) state.activeCategories.delete(categoryId);
      else state.activeCategories.add(categoryId);
      updateVisibleGraph({ fit: true });
    });
    return button;
  }));

  document.querySelectorAll('.wave-toggle input').forEach((input) => {
    input.addEventListener('change', () => {
      const wave = Number(input.value);
      if (input.checked) state.activeWaves.add(wave);
      else state.activeWaves.delete(wave);
      updateVisibleGraph({ fit: true });
    });
  });
}

function selectPackage(id) {
  if (!packageById(id)) return;
  state.selected = id;
  updateInspector();
  draw();
}

function zoomAt(factor, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const anchorX = clientX ?? rect.left + rect.width / 2;
  const anchorY = clientY ?? rect.top + rect.height / 2;
  const world = worldPoint(anchorX, anchorY);
  state.zoom = Math.min(2.5, Math.max(0.16, state.zoom * factor));
  state.panX = anchorX - rect.left - world.x * state.zoom;
  state.panY = anchorY - rect.top - world.y * state.zoom;
  updateZoomOutput();
  draw();
}

canvas.addEventListener('pointerdown', (event) => {
  const hit = hitNode(event.clientX, event.clientY);
  if (hit) {
    selectPackage(hit.item.id);
    return;
  }
  state.dragging = true;
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  canvas.classList.add('is-dragging');
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (state.dragging) {
    state.panX += event.clientX - state.pointerX;
    state.panY += event.clientY - state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    draw();
    return;
  }
  const hit = hitNode(event.clientX, event.clientY);
  const nextHovered = hit?.item.id ?? null;
  if (nextHovered !== state.hovered) {
    state.hovered = nextHovered;
    canvas.style.cursor = hit ? 'pointer' : 'grab';
    draw();
  }
});

canvas.addEventListener('pointerup', (event) => {
  state.dragging = false;
  canvas.classList.remove('is-dragging');
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener('pointerleave', () => {
  if (!state.dragging && state.hovered) {
    state.hovered = null;
    draw();
  }
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomAt(event.deltaY < 0 ? 1.1 : 0.9, event.clientX, event.clientY);
}, { passive: false });

canvas.addEventListener('keydown', (event) => {
  if (event.key === '+' || event.key === '=') zoomAt(1.15);
  else if (event.key === '-') zoomAt(0.87);
  else if (event.key === '0') fitMap();
  else return;
  event.preventDefault();
});

packageSelect.addEventListener('change', () => selectPackage(packageSelect.value));
searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLocaleLowerCase('es');
  updateVisibleGraph({ fit: true });
});
focusInput.addEventListener('change', () => {
  state.focusOnly = focusInput.checked;
  updateVisibleGraph({ fit: true });
});
document.querySelector('#clear-filters').addEventListener('click', () => {
  state.activeWaves = new Set([1, 2, 3]);
  state.activeCategories = new Set(Object.keys(state.catalog.categories));
  state.query = '';
  state.focusOnly = false;
  searchInput.value = '';
  focusInput.checked = false;
  updateVisibleGraph({ fit: true });
});
document.querySelector('#zoom-in').addEventListener('click', () => zoomAt(1.15));
document.querySelector('#zoom-out').addEventListener('click', () => zoomAt(0.87));
document.querySelector('#fit-map').addEventListener('click', fitMap);

async function initialize() {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  state.catalog = await response.json();
  state.activeCategories = new Set(Object.keys(state.catalog.categories));
  populateControls();
  updateVisibleGraph();
  resizeCanvas();
  fitMap();
  const observer = new ResizeObserver(() => {
    resizeCanvas();
    fitMap();
  });
  observer.observe(stage);
}

initialize().catch((error) => {
  console.error(error);
  document.querySelector('#package-name').textContent = 'catalogo no disponible';
  document.querySelector('#package-summary').textContent = error.message;
});