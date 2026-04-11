const express = require('express');
const router = express.Router();
const AgencyController = require('../controllers/agencyController');

// GET all agencies
router.get('/', AgencyController.getAgencies);

// GET single agency by slug
router.get('/:slug', AgencyController.getAgency);

// POST create new agency
router.post('/', AgencyController.createAgency);

// PUT update agency
router.put('/:id', AgencyController.updateAgency);

// DELETE agency
router.delete('/:id', AgencyController.deleteAgency);

module.exports = router;