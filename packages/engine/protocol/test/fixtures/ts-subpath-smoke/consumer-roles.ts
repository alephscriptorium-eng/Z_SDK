/**
 * Eje IV sensor B — second independent client on subpath types (WP-U155).
 * Imports `@zeus/protocol/roles` (not peer-card-seat).
 */
import {
  ROLES,
  createIntentCatalog,
  assertIntentRole,
  type Role
} from '@zeus/protocol/roles';

export function rolesCatalogAllowsPlayer(): boolean {
  const role: Role = 'player';
  if (!ROLES.includes(role)) return false;
  const catalog = createIntentCatalog({
    ping: { roles: ['player'] }
  });
  const check = assertIntentRole({ intent: 'ping', role }, catalog);
  return check.ok === true;
}
