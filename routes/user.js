const express = require('express');
const { register, login } = require('../controllers/userController');

const router = express.Router();

// Rutas
router.post('/register', register); // Registrar usuario
router.post('/login', login);       // Iniciar sesión

module.exports = router;
