const pool = require('../config/database');

class LocationModel {

  static async getAllCountries() {
    const query = `
      SELECT 
        co.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      GROUP BY co.id
      ORDER BY agency_count DESC, co.name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

 
  static async getCountriesByContinent(continent) {
    const query = `
      SELECT 
        co.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      WHERE co.continent = $1
      GROUP BY co.id
      ORDER BY agency_count DESC, co.name ASC
    `;

    const result = await pool.query(query, [continent]);
    return result.rows;
  }

  static async getAllContinents() {
    const query = `
      SELECT 
        co.continent,
        COUNT(DISTINCT co.id) as country_count,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      GROUP BY co.continent
      ORDER BY agency_count DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

 
  static async getCountryBySlug(slug) {
    const countryQuery = `
      SELECT 
        co.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM countries co
      LEFT JOIN agencies a ON co.id = a.country_id
      WHERE co.slug = $1
      GROUP BY co.id
    `;

    const citiesQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      LEFT JOIN agencies a ON c.id = a.city_id
      WHERE c.country_id = (SELECT id FROM countries WHERE slug = $1)
      GROUP BY c.id
      ORDER BY agency_count DESC, c.name ASC
    `;

    const countryResult = await pool.query(countryQuery, [slug]);
    const citiesResult = await pool.query(citiesQuery, [slug]);

    if (countryResult.rows.length === 0) {
      return null;
    }

    return {
      ...countryResult.rows[0],
      cities: citiesResult.rows
    };
  }


  static async getAllCities() {
    const query = `
      SELECT 
        c.*,
        co.name as country_name,
        co.slug as country_slug,
        co.continent,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN agencies a ON c.id = a.city_id
      GROUP BY c.id, co.name, co.slug, co.continent
      ORDER BY agency_count DESC, c.name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }


  static async getCitiesByCountry(countrySlug) {
    const query = `
      SELECT 
        c.*,
        co.name as country_name,
        co.slug as country_slug,
        COUNT(DISTINCT a.id) as agency_count
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN agencies a ON c.id = a.city_id
      WHERE co.slug = $1
      GROUP BY c.id, co.name, co.slug
      ORDER BY agency_count DESC, c.name ASC
    `;

    const result = await pool.query(query, [countrySlug]);
    return result.rows;
  }


  static async getCityBySlug(slug, countrySlug = null) {
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

    if (countrySlug) {
      query += ` AND co.slug = $2`;
      params.push(countrySlug);
    }

    query += ` GROUP BY c.id, co.name, co.slug, co.continent`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = LocationModel;