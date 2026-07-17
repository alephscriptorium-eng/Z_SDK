import { buildOpenApiDoc, zeusOpenApiServers, readPackageVersion } from '@zeus/http-contract';
import { FIREHOSE_ROUTES } from '../src/contract.mjs';

export function buildFirehoseSpec() {
  return buildOpenApiDoc(FIREHOSE_ROUTES, {
    title: 'Zeus Firehose View UI API',
    version: readPackageVersion(import.meta.url),
    description: 'REST API for @zeus/firehose-view-ui corpus browser.',
    servers: zeusOpenApiServers('firehose')
  });
}
