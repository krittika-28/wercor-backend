const pool = require('../config/database');

class AgencyModel {
 
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        a.*,
        c.name as city_name,
        co.name as country_name,
        co.continent,
        STRING_AGG(DISTINCT cat.name, ', ') as categories,
        STRING_AGG(DISTINCT cat.slug, ', ') as category_slugs
      FROM agencies a
      LEFT JOIN cities c ON a.city_id = c.id
      LEFT JOIN countries co ON a.country_id = co.id
      LEFT JOIN agency_categories ac ON a.id = ac.agency_id
      LEFT JOIN categories cat ON ac.category_id = cat.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

   
    if (filters.category) {
      query += ` AND EXISTS (
        SELECT 1 FROM agency_categories ac2 
        JOIN categories cat2 ON ac2.category_id = cat2.id 
        WHERE ac2.agency_id = a.id AND cat2.slug = $${paramCount}
      )`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.country) {
      query += ` AND co.slug = $${paramCount}`;
      params.push(filters.country);
      paramCount++;
    }

    if (filters.continent) {
      query += ` AND co.continent = $${paramCount}`;
      params.push(filters.continent);
      paramCount++;
    }

    if (filters.city) {
      query += ` AND c.slug = $${paramCount}`;
      params.push(filters.city);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        a.name ILIKE $${paramCount} OR 
        a.description ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.verified) {
      query += ` AND a.is_verified = true`;
    }

    query += ` GROUP BY a.id, c.name, co.name, co.continent`;

    if (filters.featured) {
      query += ` ORDER BY a.is_featured DESC, a.created_at DESC`;
    } else {
      query += ` ORDER BY a.created_at DESC`;
    }

   
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  
  static async getBySlug(slug) {
    const query = `
      SELECT 
        a.*,
        c.name as city_name,
        c.slug as city_slug,
        co.name as country_name,
        co.slug as country_slug,
        co.continent,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cat.id,
              'name', cat.name,
              'slug', cat.slug
            )
          ) FILTER (WHERE cat.id IS NOT NULL),
          '[]'
        ) as categories
      FROM agencies a
      LEFT JOIN cities c ON a.city_id = c.id
      LEFT JOIN countries co ON a.country_id = co.id
      LEFT JOIN agency_categories ac ON a.id = ac.agency_id
      LEFT JOIN categories cat ON ac.category_id = cat.id
      WHERE a.slug = $1
      GROUP BY a.id, c.name, c.slug, co.name, co.slug, co.continent
    `;

    const result = await pool.query(query, [slug]);

   
    if (result.rows.length > 0) {
      await pool.query(
        'UPDATE agencies SET view_count = view_count + 1 WHERE slug = $1',
        [slug]
      );
    }

    return result.rows[0];
  }

  static async create(agencyData) {
    const {
      name, slug, description, website, email, phone,
      city_id, country_id, address, categories
    } = agencyData;

  
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert agency
      const agencyQuery = `
        INSERT INTO agencies (
          name, slug, description, website, email, phone,
          city_id, country_id, address
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const agencyResult = await client.query(agencyQuery, [
        name, slug, description, website, email, phone,
        city_id, country_id, address
      ]);

      const agency = agencyResult.rows[0];

      // Insert categories
      if (categories && categories.length > 0) {
        const categoryQuery = `
          INSERT INTO agency_categories (agency_id, category_id)
          VALUES ($1, $2)
        `;

        for (const categoryId of categories) {
          await client.query(categoryQuery, [agency.id, categoryId]);
        }
      }

      await client.query('COMMIT');
      return agency;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  
  static async getCount(filters = {}) {
    let query = 'SELECT COUNT(DISTINCT a.id) as count FROM agencies a';
    const params = [];
    let paramCount = 1;
    const joins = [];
    const conditions = [];

    if (filters.category) {
      joins.push('JOIN agency_categories ac ON a.id = ac.agency_id');
      joins.push('JOIN categories cat ON ac.category_id = cat.id');
      conditions.push(`cat.slug = $${paramCount}`);
      params.push(filters.category);
      paramCount++;
    }

    if (filters.country) {
      joins.push('JOIN countries co ON a.country_id = co.id');
      conditions.push(`co.slug = $${paramCount}`);
      params.push(filters.country);
      paramCount++;
    }

    if (filters.continent) {
      if (!joins.includes('JOIN countries co ON a.country_id = co.id')) {
        joins.push('JOIN countries co ON a.country_id = co.id');
      }
      conditions.push(`co.continent = $${paramCount}`);
      params.push(filters.continent);
      paramCount++;
    }

    if (filters.city) {
      joins.push('JOIN cities c ON a.city_id = c.id');
      conditions.push(`c.slug = $${paramCount}`);
      params.push(filters.city);
      paramCount++;
    }

    if (joins.length > 0) {
      query += ' ' + joins.join(' ');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = AgencyModel;