import { defineConfig } from 'tsup';

export default defineConfig({
  noExternal: ['eventsource-parser', 'p-retry', 'uuid'],
  platform: 'browser',
  target: ['chrome100', 'edge100', 'firefox100', 'safari16']
});
