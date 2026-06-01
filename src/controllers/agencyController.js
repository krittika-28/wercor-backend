const pool = require('../config/database');
const { sendAgencySubmissionEmail } = require('../utils/sendMail');
const { processLogo } = require('../middleware/upload');

// Get all agencies with filters
const getAgencies = async (req, res) => {
  try {
    const { category, country, continent, city, search, featured, limit } = req.query;

    let query = `
      SELECT 
        a.*,
        c.name as city_name,
        co.name as country_name,
        co.continent,
        STRING_AGG(DISTINCT cat.name, ', ') as categories
      FROM agencies a
      LEFT JOIN cities c ON a.city_id = c.id
      LEFT JOIN countries co ON a.country_id = co.id
      LEFT JOIN agency_categories ac ON a.id = ac.agency_id
      LEFT JOIN categories cat ON ac.category_id = cat.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND EXISTS (
        SELECT 1 FROM agency_categories ac2
        JOIN categories cat2 ON ac2.category_id = cat2.id
        WHERE ac2.agency_id = a.id AND cat2.slug = $${paramCount}
      )`;
      params.push(category);
      paramCount++;
    }

    if (country) {
      query += ` AND co.slug = $${paramCount}`;
      params.push(country);
      paramCount++;
    }

    if (continent) {
      query += ` AND co.continent = $${paramCount}`;
      params.push(continent);
      paramCount++;
    }

    if (city) {
      query += ` AND c.slug = $${paramCount}`;
      params.push(city);
      paramCount++;
    }

    if (search) {
      query += ` AND (a.name ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (featured === 'true') {
      query += ` AND a.is_featured = true`;
    }

    query += ` GROUP BY a.id, c.name, co.name, co.continent`;

    if (featured === 'true') {
      query += ` ORDER BY a.is_featured DESC, a.created_at DESC`;
    } else {
      query += ` ORDER BY a.created_at DESC`;
    }

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      paramCount++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single agency by slug
const getAgency = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as city_name,
        c.slug as city_slug,
        co.name as country_name,
        co.slug as country_slug,
        co.continent
      FROM agencies a
      LEFT JOIN cities c ON a.city_id = c.id
      LEFT JOIN countries co ON a.country_id = co.id
      WHERE a.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const categoriesResult = await pool.query(`
      SELECT cat.id, cat.name, cat.slug
      FROM categories cat
      JOIN agency_categories ac ON cat.id = ac.category_id
      WHERE ac.agency_id = $1
    `, [result.rows[0].id]);

    const agency = result.rows[0];
    agency.categories = categoriesResult.rows;

    await pool.query(
      'UPDATE agencies SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    );

    res.json(agency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new agency
const createAgency = async (req, res) => {
  try {
    const {
      name, slug, description, website, email, phone,
      address, city_id, country_id, categories,
      founded_year, team_size, min_project_size, hourly_rate,
      screenshot_url
    } = req.body;

    // Process logo if uploaded
    let logo_url = null;
    if (req.file) {
      logo_url = await processLogo(req.file);
    }

    // Parse categories
    let categoryList = categories;
    if (typeof categories === 'string') {
      try {
        categoryList = JSON.parse(categories);
      } catch (e) {
        categoryList = [];
      }
    }

    const result = await pool.query(
      `INSERT INTO agencies (
        name, slug, description, website, email, phone, 
        address, city_id, country_id, founded_year, team_size,
        min_project_size, hourly_rate, logo_url, screenshot_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *`,
      [
        name, slug, description, website, email, phone,
        address, city_id, country_id, founded_year, team_size,
        min_project_size, hourly_rate, logo_url, screenshot_url
      ]
    );

    const agency = result.rows[0];

    // Insert categories
    if (categoryList && categoryList.length > 0) {
      for (const categoryId of categoryList) {
        await pool.query(
          'INSERT INTO agency_categories (agency_id, category_id) VALUES ($1, $2)',
          [agency.id, categoryId]
        );
      }
    }

    // Send email notification
    try {
      const [countryRes, cityRes, catRes] = await Promise.all([
        country_id
          ? pool.query('SELECT name, continent FROM countries WHERE id = $1', [country_id])
          : Promise.resolve({ rows: [] }),
        city_id
          ? pool.query('SELECT name FROM cities WHERE id = $1', [city_id])
          : Promise.resolve({ rows: [] }),
        categoryList && categoryList.length > 0
          ? pool.query('SELECT name FROM categories WHERE id = ANY($1::int[])', [categoryList])
          : Promise.resolve({ rows: [] })
      ]);

      const meta = {
        country_name: countryRes.rows[0]?.name || '',
        continent: countryRes.rows[0]?.continent || '',
        city_name: cityRes.rows[0]?.name || '',
        category_names: catRes.rows.map(r => r.name)
      };

      sendAgencySubmissionEmail(req.body, meta).catch(err => {
        console.error('❌ Mailjet failed (non-blocking):', err.message);
      });
    } catch (emailErr) {
      console.error('❌ Email setup error (non-blocking):', emailErr.message);
    }

    res.status(201).json(agency);
  } catch (error) {
    console.error('Error creating agency:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update agency
const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, slug, description, website, email, phone,
      address, city_id, country_id, categories,
      founded_year, team_size, min_project_size, hourly_rate,
      screenshot_url, is_verified, is_featured
    } = req.body;

    // Process logo if uploaded
    let logo_url = req.body.logo_url;
    if (req.file) {
      logo_url = await processLogo(req.file);
    }

    const result = await pool.query(
      `UPDATE agencies SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        website = COALESCE($4, website),
        email = COALESCE($5, email),
        phone = COALESCE($6, phone),
        address = COALESCE($7, address),
        city_id = COALESCE($8, city_id),
        country_id = COALESCE($9, country_id),
        founded_year = COALESCE($10, founded_year),
        team_size = COALESCE($11, team_size),
        min_project_size = COALESCE($12, min_project_size),
        hourly_rate = COALESCE($13, hourly_rate),
        logo_url = COALESCE($14, logo_url),
        screenshot_url = COALESCE($15, screenshot_url),
        is_verified = COALESCE($16, is_verified),
        is_featured = COALESCE($17, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *`,
      [
        name, slug, description, website, email, phone,
        address, city_id, country_id, founded_year, team_size,
        min_project_size, hourly_rate, logo_url, screenshot_url,
        is_verified, is_featured, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    if (categories) {
      await pool.query('DELETE FROM agency_categories WHERE agency_id = $1', [id]);
      for (const categoryId of categories) {
        await pool.query(
          'INSERT INTO agency_categories (agency_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete agency
const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM agencies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.json({ message: 'Agency deleted successfully', agency: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAgencies,
  getAgency,
  createAgency,
  updateAgency,
  deleteAgency
};