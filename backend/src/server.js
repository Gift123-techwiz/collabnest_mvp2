const app = require('./app');
const env = require('./config/env');
const AppDataSource = require('./config/database');

async function start() {
  try {
    await AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('[db] Data source initialized');

    app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] CollabNest backend listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
