const express = require('express');
const { body } = require('express-validator');
const upload = require('../middlewares/uploadMiddleware');
const  authenticate  = require('../middlewares/authMiddleware');
const ticketController = require('../controllers/ticketController');
const TicketUser = require('../models/TicketUser');

const router = express.Router();

// Subir un ticket
router.post(
    '/upload',
    authenticate,
    upload.single('image'),
    [
        body('date').notEmpty().withMessage('La fecha es obligatoria').isDate().withMessage('Debe ser una fecha válida'),
        body('description').notEmpty().withMessage('La descripción es obligatoria'),
        body('amount').isNumeric().withMessage('El monto debe ser un número válido'),
        body('projectId').isInt().withMessage('El ID del proyecto debe ser un número entero'),
        body('divisionType').notEmpty().withMessage('El tipo de división es obligatorio').isIn(['equitativa', 'personalizada']),
        //body('contributions').optional().isArray().withMessage('Las contribuciones deben ser un arreglo'),
        //body('contributions.*.userId').isInt().withMessage('El ID de usuario debe ser un número entero'),
        //body('contributions.*.contributionPercentage')
        //    .isNumeric()
        //    .withMessage('El porcentaje de contribución debe ser un número válido'),
    ],
    ticketController.uploadTicket
);

// Obtener tickets de un proyecto
router.get('/:projectId', authenticate, ticketController.getTicketsByProject);
router.get('/user', authenticate, ticketController.getTicketsByUser);

module.exports = router;
