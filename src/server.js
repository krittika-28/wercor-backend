const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');

// Import routes
const agencyRoutes = require('./routes/agencies');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/agencies', agencyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Agency Directory API is running!',
    version: '2.0.0',
    timestamp: new Date()
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Agency Directory API',
    version: '2.0.0',
    endpoints: {
      agencies: {
        list: 'GET /api/agencies',
        single: 'GET /api/agencies/:slug',
        create: 'POST /api/agencies',
        update: 'PUT /api/agencies/:id',
        delete: 'DELETE /api/agencies/:id'
      },
      categories: {
        list: 'GET /api/categories',
        single: 'GET /api/categories/:slug',
        overview: 'GET /api/categories/:slug/overview'
      },
      locations: {
        continents: 'GET /api/locations/continents',
        countries: 'GET /api/locations/countries',
        country: 'GET /api/locations/countries/:slug',
        cities: 'GET /api/locations/cities',
        city: 'GET /api/locations/cities/:slug'
      }
    },
    filters: {
      agencies: ['category', 'country', 'continent', 'city', 'search', 'featured', 'limit'],
      countries: ['continent'],
      cities: ['country']
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    const counts = await pool.query(`
      SELECT 'countries' as table_name, COUNT(*) as count FROM countries
      UNION ALL
      SELECT 'cities', COUNT(*) FROM cities
      UNION ALL
      SELECT 'categories', COUNT(*) FROM categories
      UNION ALL
      SELECT 'agencies', COUNT(*) FROM agencies
      UNION ALL
      SELECT 'agency_categories', COUNT(*) FROM agency_categories
    `);

    res.json({
      status: 'Database connected!',
      time: result.rows[0].now,
      tables: counts.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database connection failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});