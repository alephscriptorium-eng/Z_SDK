import { createServer, resolveLifecyclePort } from './server.mjs';

const port = resolveLifecyclePort();
const bundle = createServer({ port });
const handle = await bundle.start();
console.log(`[ciudad-lifecycle] listening :${port}`);
export default handle;
