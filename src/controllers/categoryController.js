const pool = require('../config/database');
const OpenAI = require('openai');

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI initialized successfully');
} else {
  console.log('❌ No OpenAI API key found');
}

// Get all categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT ac.agency_id) as agency_count
      FROM categories c
      LEFT JOIN agency_categories ac ON c.id = ac.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single category by slug
const getCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT ac.agency_id) as agency_count
      FROM categories c
      LEFT JOIN agency_categories ac ON c.id = ac.category_id
      WHERE c.slug = $1
      GROUP BY c.id
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get category AI overview
const getCategoryOverview = async (req, res) => {
  try {
    const { slug } = req.params;
    const { country } = req.query; // Optional country filter

    // Get category
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const category = categoryResult.rows[0];

    // Count agencies (optionally filtered by country)
    let countQuery = `
      SELECT COUNT(*) as count FROM agency_categories ac
      JOIN categories c ON ac.category_id = c.id
      JOIN agencies a ON ac.agency_id = a.id
      WHERE c.slug = $1
    `;
    const countParams = [slug];

    if (country) {
      countQuery += ` AND a.country_id = (SELECT id FROM countries WHERE slug = $2)`;
      countParams.push(country);
    }

    const countResult = await pool.query(countQuery, countParams);
    const agencyCount = countResult.rows[0].count;

    // Generate AI overview
    let overview = null;

    if (openai) {
      try {
        console.log('🤖 Generating AI overview for:', category.name);

        const locationContext = country 
          ? `in ${country.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` 
          : 'globally';

        const prompt = `You are an expert in the digital agency landscape. 
Generate a brief, informative overview (2-3 sentences) about ${category.name} agencies ${locationContext}.
There are currently ${agencyCount} such agencies listed.
Focus on:
1. What these agencies typically do
2. Current industry trends
3. Why businesses hire them
Keep it professional and concise.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        });

        overview = completion.choices[0].message.content.trim();
        console.log('✅ AI overview generated successfully');
      } catch (aiError) {
        console.error('❌ AI generation error:', aiError.message);
        overview = null;
      }
    } else {
      console.log('❌ OpenAI not initialized - no API key');
    }

    res.json({
      success: true,
      data: {
        category: category.name,
        agency_count: agencyCount,
        overview: overview || 'Overview not available at this time.'
      }
    });
  } catch (error) {
    console.error('Error generating overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate overview'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  getCategoryOverview
};