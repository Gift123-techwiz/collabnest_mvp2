require('reflect-metadata');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taxonomyRoutes = require('./routes/taxonomyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const projectRoutes = require('./routes/projectRoutes');
const roleRoutes = require('./routes/roleRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const taskRoutes = require('./routes/taskRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationPreferenceRoutes = require('./routes/notificationPreferenceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paystackWebhookRoutes = require('./routes/paystackWebhookRoutes');

const app = express();
const base = env.API_BASE_PATH;

// Security headers — applied globally per the Security module (MUST).
// CSP restricts script/style origins (mitigates XSS, security doc R-04);
// HSTS enforces HTTPS on repeat visits once deployed behind TLS.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.paystack.co'],
        frameSrc: ['https://checkout.paystack.com'],
        objectSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Paystack webhook needs the RAW request body to verify the HMAC
// signature — must be mounted before express.json() consumes/parses it.
app.use(paystackWebhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

// Routers that define their own full sub-paths (mounted at the bare API
// base) come first, followed by resource-prefixed routers, with userRoutes
// last since its GET /:id catch-all is the broadest pattern in the app.
app.use(`${base}/auth`, authRoutes);
app.use(base, taxonomyRoutes);
app.use(base, dashboardRoutes);
app.use(`${base}/projects`, projectRoutes);
app.use(`${base}/projects`, roleRoutes);
app.use(base, applicationRoutes);
app.use(base, membershipRoutes);
app.use(base, taskRoutes);
app.use(base, ratingRoutes);
app.use(base, notificationRoutes);
app.use(base, notificationPreferenceRoutes);
app.use(base, settingsRoutes);
app.use(base, analyticsRoutes);
app.use(base, subscriptionRoutes);
app.use(`${base}/users`, userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
