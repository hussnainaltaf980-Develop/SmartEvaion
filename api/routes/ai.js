const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController.js');

// All routes are protected by the auth middleware applied in server.js

router.post('/chat', aiController.chat);
router.post('/generate-questions', aiController.generateQuestions);
router.post('/transcribe-audio', aiController.transcribeAudio);
router.post('/evaluate-answer', aiController.evaluateAnswer);
router.post('/evaluate-session', aiController.evaluateSession);

module.exports = router;