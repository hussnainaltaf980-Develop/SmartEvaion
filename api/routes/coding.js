
const express = require('express');
const router = express.Router();
const codingController = require('../controllers/codingController.js');

router.get('/problems', codingController.getProblems);
router.post('/execute', codingController.executeCode);

module.exports = router;
