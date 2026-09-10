// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `legacy/` is the archived task-app and Expo template, kept for reference
    // only — it is excluded from tsconfig too and never bundled.
    ignores: ['dist/*', 'legacy/*', '.expo/*', 'node_modules/*'],
  },
]);
