export default async (req, res) => {
  const backend = await import('../backend/index.js');
  const app = backend.default;
  return app(req, res);
};
