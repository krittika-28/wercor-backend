const pool = require('../config/database');

// Get all countries with agency count
const getCountries = async (req, res) => {
  try {
    const { continent } = req.query;

    let query = `
      SELECT 
        co.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
    `;

    const params = [];

    if (continent) {
      query += ` WHERE co.continent = $1`;
      params.push(continent);
    }

    query += `
      GROUP BY co.id
      ORDER BY agency_count DESC, co.name ASC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all continents with counts
const getContinents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        co.continent,
        COUNT(DISTINCT co.id) as country_count,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      WHERE co.continent IS NOT NULL
      GROUP BY co.continent
      ORDER BY agency_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single country by slug with cities
const getCountry = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get country with agency count
    const countryResult = await pool.query(`
      SELECT 
        co.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      WHERE co.slug = $1
      GROUP BY co.id
    `, [slug]);

    if (countryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // Get cities with agency count for this country
    const citiesResult = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      LEFT JOIN agencies a ON c.id = a.city_id
      WHERE c.country_id = $1
      GROUP BY c.id
      ORDER BY agency_count DESC, c.name ASC
    `, [countryResult.rows[0].id]);

    const country = {
      ...countryResult.rows[0],
      cities: citiesResult.rows
    };

    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all cities
const getCities = async (req, res) => {
  try {
    const { country } = req.query;

    let query = `
      SELECT 
        c.*,
        co.name as country_name,
        co.slug as country_slug,
        co.continent,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN agencies a ON c.id = a.city_id
    `;

    const params = [];

    if (country) {
      query += ` WHERE co.slug = $1`;
      params.push(country);
    }

    query += `
      GROUP BY c.id, co.name, co.slug, co.continent
      ORDER BY agency_count DESC, c.name ASC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single city by slug
const getCity = async (req, res) => {
  try {
    const { slug } = req.params;
    const { country } = req.query;

    let query = `
      SELECT 
        c.*,
        co.name as country_name,
        co.slug as country_slug,
        co.continent,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN agencies a ON c.id = a.city_id
      WHERE c.slug = $1
    `;

    const params = [slug];

    if (country) {
      query += ` AND co.slug = $2`;
      params.push(country);
    }

    query += ` GROUP BY c.id, co.name, co.slug, co.continent`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'City not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCountries,
  getContinents,
  getCountry,
  getCities,
  getCity
};