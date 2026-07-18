/**
 * Client for world draft + Notario release (WP-U70 / U111).
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function status(msg, isError) {
    const el = $('world-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', Boolean(isError));
  }

  /** gameId → kind from option labels is unavailable; fetch materials once. */
  let gameKinds = {};

  function syncNarrativeFields() {
    const gameId = $('gameId')?.value;
    const field = $('world-story-field');
    const kind = gameKinds[gameId] || (gameId === 'plaza' ? 'narrative' : 'toy');
    if (field) {
      field.style.display = kind === 'narrative' ? '' : 'none';
    }
    if (kind === 'narrative' && $('storyBoard') && !$('storyBoard').value.trim()) {
      const defaults = window.__ZEUS_NARRATIVE_DEFAULTS__;
      if (defaults && defaults[gameId]) {
        $('storyBoard').value = JSON.stringify(defaults[gameId], null, 2);
      }
    }
  }

  function readDraftFromForm() {
    const cloakBoxes = document.querySelectorAll('input[name="cloakIds"]:checked');
    const cloakIds = Array.from(cloakBoxes).map((el) => el.value);
    const labelset = ($('labelset').value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const gameId = $('gameId').value;
    const draft = {
      gameId,
      version: $('version').value,
      sceneId: $('sceneId').value,
      labelset,
      lineId: $('lineId').value,
      casosMd: $('casosMd').value,
      cloakIds
    };
    const kind = gameKinds[gameId] || (gameId === 'plaza' ? 'narrative' : 'toy');
    if (kind === 'narrative') {
      const raw = ($('storyBoard') && $('storyBoard').value) || '';
      try {
        draft.storyBoard = raw.trim() ? JSON.parse(raw) : null;
      } catch {
        draft.storyBoard = raw;
      }
    } else {
      draft.storyBoard = null;
    }
    return draft;
  }

  async function loadMaterialsMeta() {
    try {
      const res = await fetch('/api/world/materials');
      const body = await res.json();
      if (body.success && body.materials?.games) {
        gameKinds = Object.fromEntries(body.materials.games.map((g) => [g.id, g.kind]));
        if (body.materials.narrativeDefaults) {
          window.__ZEUS_NARRATIVE_DEFAULTS__ = body.materials.narrativeDefaults;
        }
      }
    } catch {
      // keep fallbacks
    }
    syncNarrativeFields();
  }

  async function saveDraft() {
    status('Guardando…');
    const res = await fetch('/api/world/draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readDraftFromForm())
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      status(body.error || 'Error al guardar', true);
      return null;
    }
    status('Borrador guardado.');
    return body.draft;
  }

  async function resetDraft() {
    status('Reseteando…');
    const res = await fetch('/api/world/draft/reset', { method: 'POST' });
    const body = await res.json();
    if (!res.ok || !body.success) {
      status(body.error || 'Error al resetear', true);
      return;
    }
    window.location.reload();
  }

  async function release() {
    const draft = await saveDraft();
    if (!draft) return;
    status('Materializando pack y ejecutando Notario…');
    const res = await fetch('/api/world/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft, skipTests: true })
    });
    const body = await res.json();
    const box = $('world-release-result');
    if (!res.ok || !body.success) {
      status(body.error || 'Release falló', true);
      if (box) {
        box.textContent = body.error || JSON.stringify(body);
      }
      return;
    }
    status('Release OK.');
    if (box) {
      box.innerHTML =
        '<p><strong>OK</strong> tarball: ' +
        (body.tarball || '—') +
        '</p><p>Instalar: <code>' +
        (body.installHint || '') +
        '</code></p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = $('btn-save-draft');
    const releaseBtn = $('btn-release');
    const resetBtn = $('btn-reset-draft');
    const gameSelect = $('gameId');
    if (gameSelect) gameSelect.addEventListener('change', syncNarrativeFields);
    loadMaterialsMeta();
    if (saveBtn) saveBtn.addEventListener('click', () => saveDraft().catch((e) => status(e.message, true)));
    if (releaseBtn) releaseBtn.addEventListener('click', () => release().catch((e) => status(e.message, true)));
    if (resetBtn) resetBtn.addEventListener('click', () => resetDraft().catch((e) => status(e.message, true)));
  });
})();
