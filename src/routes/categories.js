const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');

// GET all categories
router.get('/', CategoryController.getCategories);

// GET single category by slug
router.get('/:slug', CategoryController.getCategory);

// GET category AI overview
router.get('/:slug/overview', CategoryController.getCategoryOverview);

module.exports = router;