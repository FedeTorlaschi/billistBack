const express = require('express');
const router = express.Router();
const { createProject, getProjects, addMemberToProject } = require('../controllers/projectController');
const projectController = require('../controllers/projectController');
const authenticateToken = require('../middlewares/authMiddleware'); 
const { body, validationResult } = require('express-validator');

// Crear un proyecto
router.post('/create', authenticateToken,
    [
        body('name').notEmpty().withMessage('El nombre del proyecto es obligatorio'),
        body('description')
            .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        return createProject(req, res); // Llama al controlador si las validaciones pasan
    }
);

// Obtener todos los proyectos
router.get('/', authenticateToken, getProjects);

// Agregar un miembro a un proyecto
router.post('/add-member', authenticateToken, [
    body('projectId').isInt().withMessage('El ID del proyecto debe ser un número entero'),
    body('userId').isInt().withMessage('El ID del usuario debe ser un número entero'),
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return addMemberToProject(req, res); // Llama al controlador si las validaciones pasan
}
);

router.get('/:projectId/my-ticket-balances', authenticateToken, projectController.getUserTicketBalances);

router.get('/:projectId/user-balances', authenticateToken, projectController.getUserBalancesInProject);


module.exports = router;
