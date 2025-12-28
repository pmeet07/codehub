const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search?q=...&language=...
router.get('/', searchController.searchRepositories);

// GET /api/search/public (Can be used for "Explore" page default)
router.get('/public', searchController.getAllPublicRepos);

module.exports = router;
