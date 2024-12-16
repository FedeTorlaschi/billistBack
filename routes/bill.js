const express = require('express');
const { body } = require('express-validator');
const { createBill, updateBill, deleteBill, getBillById, getBillsByProjectId, getBillsByUserId } = require('../controllers/billControler');
const upload = require('../middlewares/uploadMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// RUTAS --------------------------------------------------------------------------------------------------------------------------------------------
// CREAR GASTO
router.post('/create', authenticateToken, [
    body('description').notEmpty().withMessage('Descripción faltante'),
    body('total_amount').notEmpty().withMessage('Monto faltante').isNumeric().withMessage('Monto inválido'),
    body('id_project').notEmpty().withMessage('ID de proyecto faltante').isInt().withMessage('ID de proyecto inválido'),
    body('date').notEmpty().withMessage('Fecha faltante').isDate().withMessage('Fecha inválida'),
    body('contributors').notEmpty().withMessage('Contribuyentes faltantes')
], createBill);
// MODIFICAR GASTO
router.put('/:id', authenticateToken, updateBill);
// ELIMINAR GASTO
router.delete('/:id', authenticateToken, deleteBill);
// OBTENER GASTO POR ID
router.get('/:id', authenticateToken, getBillById);
// OBTENER GASTOS DE UN PROYECTO POR SU ID
router.get('/project/:projectId', authenticateToken, getBillsByProjectId);
// OBTENER GASTOS DE UN USUARIO POR ID
router.get('/user/:userId', authenticateToken, getBillsByUserId);


// router.post(
//     '/upload',
//     authenticate,
//     upload.single('image'),
//     [
//         body('date').notEmpty().withMessage('La fecha es obligatoria').isDate().withMessage('Debe ser una fecha válida'),
//         body('description').notEmpty().withMessage('La descripción es obligatoria'),
//         body('amount').isNumeric().withMessage('El monto debe ser un número válido'),
//         body('id_project').isInt().withMessage('El ID del proyecto debe ser un número entero'),
//         body('divisionType').notEmpty().withMessage('El tipo de división es obligatorio').isIn(['equitativa', 'personalizada']),
//         //body('contributions').optional().isArray().withMessage('Las contribuciones deben ser un arreglo'),
//         //body('contributions.*.userId').isInt().withMessage('El ID de usuario debe ser un número entero'),
//         //body('contributions.*.contributionPercentage')
//         //    .isNumeric()
//         //    .withMessage('El porcentaje de contribución debe ser un número válido'),
//     ],
//     billController.uploadTicket
// );
// router.get('/:projectId', authenticate, billController.getTicketsByProject);
// router.get('/user', authenticate, billController.getTicketsByUser);



module.exports = router;