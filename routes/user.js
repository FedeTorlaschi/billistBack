const express = require('express');
const { register, login, updateProfile, changePassword, deleteAccount } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas
router.post('/register', register); // Registrar usuario
router.post('/login', login);       // Iniciar sesión
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.delete('/delete-account', authenticateToken, deleteAccount);

router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Perfil del usuario', user: req.user });
});






module.exports = router;
