const express = require('express');
const { register, login, updateProfile, changePassword, deleteAccount } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rutas
router.post('/register', [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email')
        .isEmail().withMessage('Debe ser un correo válido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return register(req, res); // Llama al controlador si las validaciones pasan
}
); 
router.post('/login',  [
    body('email').isEmail().withMessage('Debe ser un correo válido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return login(req, res); // Llama al controlador si las validaciones pasan
}
);       
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.delete('/delete-account', authenticateToken, deleteAccount);

router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Perfil del usuario', user: req.user });
});






module.exports = router;
