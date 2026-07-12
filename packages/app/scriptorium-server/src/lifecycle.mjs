/** @typedef {() => void | Promise<void>} ShutdownFn */

let shuttingDown = false;

/**
 * @param {ShutdownFn} closeFn
 * @param {{ label?: string }} [options]
 */
export function registerShutdown(closeFn, { label = 'scriptorium-server' } = {}) {
  const shutdown = async (reason, exitCode = 0) => {
    if (shuttingDown) {
      process.exit(exitCode || 1);
    }
    shuttingDown = true;

    if (reason) {
      console.log(`\n[${label}] shutting down (${reason})…`);
    }

    const forceTimer = setTimeout(() => {
      console.error(`[${label}] forced exit — run: npm run stop:services -- "stopped" scriptorium-server`);
      process.exit(1);
    }, 5000);
    forceTimer.unref?.();

    try {
      await closeFn();
      clearTimeout(forceTimer);
      process.exit(exitCode);
    } catch (err) {
      clearTimeout(forceTimer);
      console.error(`[${label}] shutdown error:`, err);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT', 0));
  process.once('SIGTERM', () => shutdown('SIGTERM', 0));

  if (process.platform === 'win32') {
    process.once('SIGBREAK', () => shutdown('SIGBREAK', 0));
  }

  if (process.stdin.isTTY) {
    process.stdin.on('end', () => shutdown('stdin-end', 0));
  }

  process.on('uncaughtException', (err) => {
    console.error(`[${label}] uncaught exception:`, err);
    shutdown('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(`[${label}] unhandled rejection:`, reason);
    shutdown('unhandledRejection', 1);
  });
}
