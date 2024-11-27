const Project = require('../models/Project');
const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

exports.uploadTicket = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { date, description, amount, projectId } = req.body;
        const project = await Project.findByPk(projectId);

        if (!project) {
            return res.status(404).json({ message: 'El proyecto no existe' });
        }

        const ticket = await Ticket.create({
            date,
            description,
            amount,
            image: req.file?.path || null, // Ruta de la imagen (si se subió)
            userId: req.user.id, // ID del usuario logueado
            projectId,
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir el ticket' });
    }
};

exports.getTicketsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const tickets = await Ticket.findAll({
            where: { projectId },
            include: ['user'], // Incluye datos del usuario que subió el ticket
        });

        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tickets' });
    }
};

exports.getTicketsByUser = async (req, res) => {
    try {
        const userId = req.user.id; 

        const tickets = await Ticket.findAll({
           // where: { userId }, // Filtrar por el usuario logueado
           // include: ['project'], // Incluye información del proyecto asociado
           //attributes: ['id', 'name', 'description'],
           include: {
               model: User,
               attributes: [],
               where: { id: userId }
           }
        });

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'No se encontraron tickets para este usuario' });
        }

        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tickets del usuario' });
    }
};

