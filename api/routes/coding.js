const express = require('express');
const router = express.Router();
const codingController = require('../controllers/codingController');

// The base path is already protected by middleware in server.js

router.post('/execute', codingController.executeCode);

module.exports = router;