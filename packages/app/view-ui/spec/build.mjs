import { buildOpenApiDoc, zeusOpenApiServers, readPackageVersion } from '@zeus/http-contract';
import { VIEW_ROUTES } from '../src/contract.mjs';

export function buildViewSpec() {
  return buildOpenApiDoc(VIEW_ROUTES, {
    title: 'Zeus View UI (Cache Explorer) API',
    version: readPackageVersion(import.meta.url),
    description: 'REST API for @zeus/view-ui linea browser.',
    servers: zeusOpenApiServers('view')
  });
}
