const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/validate-token', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'Token válido' });
});

module.exports = router;