const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// The base path is already protected by middleware in server.js

router.get('/', interviewController.getAllTemplates);
router.post('/', interviewController.createTemplate);
router.delete('/:id', interviewController.deleteTemplate);

module.exports = router;
