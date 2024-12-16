const express = require('express');
const { signup, login, updateUser, updatePassword, deleteUser, getUserById, getUserByEmail, getUserByUsername } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// RUTAS --------------------------------------------------------------------------------------------------------------------------------------------
// REGISTRARSE
router.post('/signup', [
    body('username').notEmpty().withMessage('Username faltante'),
    body('email').isEmail().withMessage('Email faltante o inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Contraseña menor a 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return signup(req, res);
});
// INICIAR SESIÓN
router.post('/login',  [
    body('email').isEmail().withMessage('Email faltante o inválido'),
    body('password').notEmpty().withMessage('Contraseña faltante'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return login(req, res); 
});
// ACTUALIZAR PERFIL DEL USUARIO EN SESIÓN
router.put('/update', authenticateToken, updateUser);
// ACTUALIZAR CONTRASEÑA DEL USUARIO EN SESIÓN
router.put('/password', authenticateToken, updatePassword);
// ELIMINAR CUENTA DEL USUARIO EN SESIÓN
router.delete('/delete', authenticateToken, deleteUser);
// OBTENER USUARIO EN SESIÓN
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Perfil del usuario', user: req.user });
});
// OBTENER USUARIO POR ID
router.get('/:id', authenticateToken, getUserById);
// OBTENER USUARIO POR EMAIL
router.get('/email', authenticateToken, getUserByEmail);
// OBTENER USUARIO POR USERNAME
router.get('/username', authenticateToken, getUserByUsername);



module.exports = router;