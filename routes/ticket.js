const express = require('express');
const { body } = require('express-validator');
const upload = require('../middlewares/uploadMiddleware');
const  authenticate  = require('../middlewares/authMiddleware');
const ticketController = require('../controllers/ticketController');

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
    ],
    ticketController.uploadTicket
);

// Obtener tickets de un proyecto
router.get('/:projectId', authenticate, ticketController.getTicketsByProject);
router.get('/user', authenticate, ticketController.getTicketsByUser);

module.exports = router;
