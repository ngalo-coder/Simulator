const express = require('express');
const { startSession, chat, endSimulation } = require('../controllers/simulationController');
const router = express.Router();

router.post('/', startSession);
router.post('/:sessionId/chat', chat);
router.post('/:sessionId/end', endSimulation);

module.exports = router;

