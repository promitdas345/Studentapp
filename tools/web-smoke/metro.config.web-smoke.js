// Copied to metro.config.js by tools/web-smoke/run.sh for the browser smoke test only, then removed.
// On the web, Expo's SQLite storage needs extra setup the app doesn't use, so its localStorage
// install is skipped there; the browser's own localStorage takes its place.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const resolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite/localStorage/install') return { type: 'empty' };
  return (resolve ?? context.resolveRequest)(context, moduleName, platform);
};
module.exports = config;
