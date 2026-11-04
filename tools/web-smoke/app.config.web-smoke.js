// Copied to app.config.js by tools/web-smoke/run.sh for the browser smoke test only, then removed.
// "single" turns off pre-rendering pages in Node, where the app's start-up code can't run.
module.exports = ({ config }) => ({ ...config, web: { ...config.web, output: 'single' } });
