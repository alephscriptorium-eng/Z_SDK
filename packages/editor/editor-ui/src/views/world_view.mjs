/**
 * World-A editor view — gamemap draft + release (WP-U70).
 * Replaces the preset-library landing as the primary editor surface.
 */

import { div, h2, h3, p, section, a, form, label, input, select, option, textarea, button, ul, li, span } from 'hyperaxe';
import { template, pageContainer, contentSection } from './main_views.mjs';

/**
 * @param {{
 *   draft: object,
 *   materials: object,
 *   cloaks?: Array<{id:string,name:string}>,
 *   lastRelease?: object|null
 * }} data
 */
export const worldView = (data = {}) => {
  const draft = data.draft || {};
  const materials = data.materials || { scenes: [], lines: [], games: [] };
  const cloaks = data.cloaks || [];
  const labelsetText = Array.isArray(draft.labelset) ? draft.labelset.join(', ') : '';
  const storyBoardText =
    typeof draft.storyBoard === 'string'
      ? draft.storyBoard
      : draft.storyBoard
        ? JSON.stringify(draft.storyBoard, null, 2)
        : '';
  const isNarrative = (materials.games || []).some(
    (g) => g.id === draft.gameId && g.kind === 'narrative'
  );

  return template(
    'World editor',
    pageContainer(
      contentSection(
        'Zeus World Editor',
        section({ class: 'hero-section world-hero' },
          div({ class: 'hero-content' },
            h2({ class: 'hero-subtitle' }, 'Mundo A · gamemap y release'),
            p({ class: 'hero-description' },
              'Define un juego mínimo — sketch (juguete) o plaza (narrativo: actos / story-board) — ',
              'y dispara el pipeline Notario (WP-U62): start pack + acta + tarball instalable.'
            ),
            div({ class: 'hero-actions' },
              a({ href: '/cloaks', class: 'btn btn-secondary' }, 'Cloaks (MCP)'),
              a({ href: '/settings', class: 'btn btn-secondary' }, 'Settings')
            )
          )
        ),
        { class: 'hero-container' }
      ),

      contentSection(
        'Borrador',
        form({ id: 'world-draft-form', class: 'world-draft-form', method: 'post', action: '#' },
          div({ class: 'world-field' },
            label({ for: 'gameId' }, 'Juego'),
            select({ id: 'gameId', name: 'gameId' },
              ...(materials.games || []).map((g) =>
                option({ value: g.id, selected: draft.gameId === g.id || null }, `${g.label}`)
              )
            )
          ),
          div({ class: 'world-field' },
            label({ for: 'version' }, 'Versión'),
            input({ id: 'version', name: 'version', type: 'text', value: draft.version || '0.1.0' })
          ),
          div({ class: 'world-field' },
            label({ for: 'sceneId' }, 'Escena'),
            select({ id: 'sceneId', name: 'sceneId' },
              ...(materials.scenes || []).map((s) =>
                option({ value: s.id, selected: draft.sceneId === s.id || null }, s.label)
              )
            )
          ),
          div({ class: 'world-field' },
            label({ for: 'labelset' }, 'Labelset (coma-separado)'),
            input({
              id: 'labelset',
              name: 'labelset',
              type: 'text',
              value: labelsetText,
              placeholder: 'alpha, beta'
            })
          ),
          div({ class: 'world-field' },
            label({ for: 'lineId' }, 'Línea (materia prima)'),
            select({ id: 'lineId', name: 'lineId' },
              ...(materials.lines || []).map((l) =>
                option({ value: l.id, selected: draft.lineId === l.id || null }, l.label)
              )
            )
          ),
          div({ class: 'world-field' },
            label({ for: 'casosMd' }, 'Casos (CASOS.md)'),
            textarea({ id: 'casosMd', name: 'casosMd', rows: '14' }, draft.casosMd || '')
          ),
          div({
            class: 'world-field world-field-story',
            id: 'world-story-field',
            style: isNarrative ? null : 'display:none'
          },
            label({ for: 'storyBoard' }, 'Story-board (solve-inline · actos JSON)'),
            p({ class: 'text-muted world-field-hint' },
              'Dialecto mínimo U111 (acts[].widgets). Registro completo de dialectos → U114.'
            ),
            textarea({
              id: 'storyBoard',
              name: 'storyBoard',
              rows: '16',
              spellcheck: 'false'
            }, storyBoardText)
          ),
          cloaks.length > 0 && div({ class: 'world-field' },
            h3('Cloaks opcionales'),
            ul({ class: 'cloak-pick-list' },
              cloaks.map((c) =>
                li(
                  label(
                    input({
                      type: 'checkbox',
                      name: 'cloakIds',
                      value: c.id,
                      checked: Array.isArray(draft.cloakIds) && draft.cloakIds.includes(c.id) ? 'checked' : null
                    }),
                    ` ${c.name || c.id}`
                  )
                )
              )
            )
          ),
          div({ class: 'world-actions' },
            button({ type: 'button', id: 'btn-save-draft', class: 'btn btn-secondary' }, 'Guardar borrador'),
            button({ type: 'button', id: 'btn-release', class: 'btn btn-primary' }, 'Release (Notario)'),
            button({ type: 'button', id: 'btn-reset-draft', class: 'btn btn-secondary' }, 'Reset')
          ),
          p({ id: 'world-status', class: 'world-status text-muted' }, 'Listo.')
        )
      ),

      contentSection(
        'Último release',
        div({ id: 'world-release-result', class: 'world-release-result' },
          data.lastRelease
            ? releaseSummary(data.lastRelease)
            : p({ class: 'text-muted' }, 'Aún no hay release en esta sesión.')
        )
      )
    ),
    {
      currentPage: 'home',
      styles: ['/assets/styles/world-editor.css'],
      scripts: ['/assets/js/world-editor.js']
    }
  );
};

function releaseSummary(rel) {
  return div(
    p(span({ class: 'status-ok' }, 'OK'), ` tarball: ${rel.tarball || '—'}`),
    rel.installHint && p(`Instalar: ${rel.installHint}`),
    rel.packRoot && p(`Pack: ${rel.packRoot}`)
  );
}
