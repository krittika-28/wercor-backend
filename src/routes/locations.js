const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');

// GET all continents
router.get('/continents', LocationController.getContinents);

// GET all countries
router.get('/countries', LocationController.getCountries);

// GET single country by slug
router.get('/countries/:slug', LocationController.getCountry);

// GET all cities
router.get('/cities', LocationController.getCities);

// GET single city by slug
router.get('/cities/:slug', LocationController.getCity);

module.exports = router;