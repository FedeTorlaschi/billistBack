const express = require('express');
const router = express.Router();
const { createProject, updateProject, deleteProject, getProjectById, getProjectByName, getProjects, addMemberToProject, deleteMemberFromProject, getProjectMembers, getMemberBalance, getTotalSpentInProject, getTotalContributedByUser, getGeneralBalance } = require('../controllers/projectController');
const { updateDistributionPercentages } = require('../controllers/userProjectController');
const authenticateToken = require('../middlewares/authMiddleware'); 
const { body, validationResult } = require('express-validator');

// RUTAS --------------------------------------------------------------------------------------------------------------------------------------------
// CREAR PROYECTO
router.post('/create', authenticateToken, [
    body('name').notEmpty().withMessage('Nombre faltante'),
    body('description').isLength({ max: 500 }).withMessage('Descripción mayor a 500 caracteres'),
    body('distribution').notEmpty().withMessage('Distribución faltante')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return createProject(req, res); // llama al controlador si las validaciones pasan
});
// MODIFICAR PROYECTO
router.put('/:id', authenticateToken, [
    body('name').notEmpty().withMessage('Nombre faltante'),
    body('description').isLength({ max: 500 }).withMessage('Descripción mayor a 500 caracteres'),
    body('distribution').notEmpty().withMessage('Distribución faltante')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return updateProject(req, res); // llama al controlador si las validaciones pasan
});
// ELIMINAR PROYECTO POR ID
router.delete('/:id', authenticateToken, deleteProject);
// OBTENER PROYECTO POR ID
router.get('/:id', authenticateToken, getProjectById);
// OBTENER PROYECTO POR NOMBRE
router.post('/name', authenticateToken, getProjectByName);
// OBTENER PROYECTOS DEL USUARIO EN SESIÓN
router.get('/', authenticateToken, getProjects);
// AGREGAR MIEMBRO
router.post('/add-member', authenticateToken, [
    body('projectId').isInt().withMessage('El ID del proyecto debe ser un número entero'),
    body('userId').isInt().withMessage('El ID del usuario debe ser un número entero'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return addMemberToProject(req, res); // Llama al controlador si las validaciones pasan
});
// ELIMINAR MIEMBRO
router.delete('/member', authenticateToken, deleteMemberFromProject);
// OBTENER TODOS LOS MIEMBROS DE UN PROYECTO
router.get('/members/:projectId', authenticateToken, getProjectMembers);
// OBTENER EL BALANCE GENERAL DE UN MIEMBRO DE UN PROYECTO
router.get('/member-balance/:projectId/:userId', authenticateToken, getMemberBalance);
// OBTENER TOTAL GASTADO EN UN PROYECTO
router.get('/spent/:projectId', authenticateToken, getTotalSpentInProject);
// OBTENER TOTAL GASTADO POR UN USUARIO EN UN PROYECTO
router.get('/total-contributed/:projectId/:userId', authenticateToken, getTotalContributedByUser);
// MODIFICAR PORCENTAJES DE DISTRIBUCIÓN DEL PROYECTO
router.put('/redistribute/:projectId', authenticateToken, updateDistributionPercentages);
// OBTENER EL BALANCE GENERAL DEL USUARIO EN SESIÓN EN TOTAL
router.get('/gral-balance', authenticateToken, getGeneralBalance);

// router.get('/:projectId/my-ticket-balances', authenticateToken, projectController.getUserTicketBalances);
// router.get('/:projectId/user-balances', authenticateToken, projectController.getUserBalancesInProject);
// router.get('/:projectId/balances', authenticateToken, projectController.getProjectBalances);
// router.get('/:projectId/users', authenticateToken, projectController.getProjectUsers);
// router.get('/:projectId/tickets/sum', authenticateToken, projectController.getProjectTicketsSum);
// router.get('/:projectId/tickets', authenticateToken, projectController.getTicketsByProject);
// router.get('/:projectId/creator-balance', authenticateToken, projectController.getCreatorBalanceSum);
// router.get('/:projectId/not-creator-balance', authenticateToken, projectController.getNotCreatorBalanceSum);
// router.get('/:id', authenticateToken, projectController.getProjectById);

module.exports = router;