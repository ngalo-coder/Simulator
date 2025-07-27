const { createProxyMiddleware } = require('http-proxy-middleware');
const serviceUrls = require('../../config/serviceUrls');

const createProxy = (target, pathRewrite) => {
  if (!target) {
    return (req, res) => {
      res.status(503).send('Service not available');
    };
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
  });
};

const serviceRoutes = (app) => {
  app.use('/api/users', createProxy(serviceUrls.users, { '^/api/users': '' }));
  app.use('/api/simulation', createProxy(serviceUrls.simulation, { '^/api/simulation': '' }));
  app.use('/api/clinical', createProxy(serviceUrls.clinical, { '^/api/clinical': '' }));
  app.use('/api/cases', createProxy(serviceUrls.cases, { '^/api/cases': '' }));
  app.use('/api/analytics', createProxy(serviceUrls.analytics, { '^/api/analytics': '' }));
};

module.exports = serviceRoutes;
