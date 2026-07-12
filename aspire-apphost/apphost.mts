// Aspire TypeScript AppHost
// For more information, see: https://aspire.dev

import { createBuilder } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

const api = await builder.addNodeApp('api', '../backend', 'src/server.js')
  .withRunScript('dev')
  .withHttpEndpoint({ env: 'PORT' })
  .withEnvironment('QB_DB_PATH', 'data/quality-buddy.db')
  .withExternalHttpEndpoints();

const apiHttp = await api.getEndpoint('http');

const web = await builder.addViteApp('web', '../frontend')
  .withEnvironment('VITE_API_URL', apiHttp)
  .withEnvironment('BROWSER', 'none')
  .withReference(api)
  .waitFor(api)
  .withExternalHttpEndpoints()
  .withBrowserLogs();

await builder.build().run();
