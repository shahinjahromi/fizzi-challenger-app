// Vercel serverless entry: all /api/* requests are rewritten here.
// Server must be built first (server/dist).
const app = require('../server/dist/index').default;
module.exports = app;
