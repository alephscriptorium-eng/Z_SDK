/**
 * Plantillas fijas de titulares (calculadora, no poeta).
 * Placeholders: {{id}} {{estado}} {{vivos}} {{latentes}} {{muertos}} {{rotos}}
 */

export const PLANTILLAS = Object.freeze({
  SUBIO: '{{id}} gana pulso',
  BAJO: '{{id}} pierde pulso',
  IGUAL_VIVO: '{{id}} sostiene plaza',
  ROTO: '{{id}} queda roto',
  LATENTE: '{{id}} espera relevo',
  MUERTO: '{{id}} sin pulso',
  CENSO: 'Censo: {{vivos}} vivos · {{latentes}} latentes · {{muertos}} muertos · {{rotos}} rotos',
  WORK: 'Trabajo en {{id}}'
});

export const PLANTILLAS_PENDIENTE = Object.freeze({
  latente: '{{id}} espera señal de presencia',
  roto: '{{id}} espera reparación'
});

/**
 * @param {string} template
 * @param {Record<string, string|number>} vars
 */
export function applyPlantilla(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ''
  );
}
