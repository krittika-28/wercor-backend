const pool = require('../config/database');

class CategoryModel {
  
  static async getAll() {
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT ac.agency_id) as agency_count
      FROM categories c
      LEFT JOIN agency_categories ac ON c.id = ac.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

 
  static async getBySlug(slug) {
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT ac.agency_id) as agency_count
      FROM categories c
      LEFT JOIN agency_categories ac ON c.id = ac.category_id
      WHERE c.slug = $1
      GROUP BY c.id
    `;

    const result = await pool.query(query, [slug]);
    return result.rows[0];
  }
}

module.exports = CategoryModel;