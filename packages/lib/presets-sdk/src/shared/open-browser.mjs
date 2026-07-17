import { spawn } from 'node:child_process';

/**
 * Open a URL in the default system browser.
 * Opt-in: only opens when `ZEUS_OPEN_BROWSER=1`. Unset, `0`, empty, or any
 * other value → no-op (default: do not open; keeps swarm/CI headless).
 * @param {string} url
 */
export function openBrowser(url) {
  if (process.env.ZEUS_OPEN_BROWSER !== '1') return;

  const child =
    process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' })
      : process.platform === 'darwin'
        ? spawn('open', [url], { detached: true, stdio: 'ignore' })
        : spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });

  child.unref();
}
