import { defineConfig, type Options } from 'tsup';

const BASE_CONFIG: Options = {
  dts: true,
  format: ['cjs', 'esm'],
  platform: 'browser',
  sourcemap: true,
  target: ['chrome110', 'edge110', 'firefox110', 'ios16', 'node20']
};

export default defineConfig([
  {
    ...BASE_CONFIG,
    entry: { 'copilot-studio-direct-to-engine-chat-adapter': './src/index.ts' }
  },
  {
    ...BASE_CONFIG,
    entry: { 'copilot-studio-direct-to-engine-chat-adapter.bundle': './src/index.ts' },
    noExternal: [/./u],
    minify: true
  }
]);
