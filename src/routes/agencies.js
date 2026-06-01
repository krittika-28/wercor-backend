const express = require('express');
const router = express.Router();
const AgencyController = require('../controllers/agencyController');
const { upload } = require('../middleware/upload');

// GET all agencies
router.get('/', AgencyController.getAgencies);

// GET single agency by slug
router.get('/:slug', AgencyController.getAgency);

// POST create new agency (with logo upload)
router.post('/', upload.single('logo'), AgencyController.createAgency);

// PUT update agency (with logo upload)
router.put('/:id', upload.single('logo'), AgencyController.updateAgency);

// DELETE agency
router.delete('/:id', AgencyController.deleteAgency);

module.exports = router;