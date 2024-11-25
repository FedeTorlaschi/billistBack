const express = require('express');
const router = express.Router();
const { createProject, getProjects, addMemberToProject } = require('../controllers/projectController');
const authenticateToken = require('../middlewares/authMiddleware'); // Asegúrate de que esto esté funcionando

// Crear un proyecto
router.post('/create', authenticateToken, createProject);

// Obtener todos los proyectos
router.get('/', authenticateToken, getProjects);

// Agregar un miembro a un proyecto
router.post('/add-member', authenticateToken, addMemberToProject);

module.exports = router;
