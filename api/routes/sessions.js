const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController.js');

// The base path is already protected by middleware in server.js

router.get('/', sessionController.getAllSessions);
router.post('/', sessionController.createSession);
router.put('/:id/complete', sessionController.completeSession);
router.patch('/:id/status', sessionController.updateSessionStatus);

module.exports = router;