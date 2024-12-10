const Project = require('../models/Project');
const Ticket = require('../models/Ticket');
const User = require('../models/User')
const { validationResult } = require('express-validator');
const TicketUser = require('../models/TicketUser');

// CREAR GASTO
exports.createBill = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { description, total_amount, id_project, payers } = req.body;
        if (!description || !total_amount || !id_project) {
            return res.status(422).json({ message: 'Faltan datos obligatorios' });
        };

        // Crear el gasto
        const date = new Date();
        const ticket = await Ticket.create({ description, total_amount, id_project, date });

        // Crear la relación en TicketUser para los que pagan este gasto y cuánto
        for (const payer of payers) {
            const userTicket = await TicketUser.create({
                ticketId: ticket.id, 
                payerId: payer.id,
                amount: payer.amount
            });
        }

        res.status(201).json({ message: 'Gasto creado con éxito', bill });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el gasto', error });
    }
};
// exports.createTicket = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     // const { date, description, amount, projectId, divisionType, contributions } = req.body;
//     const { description, total_amount, id_project, payers } = req.body;
//     if (!description || !total_amount || !id_project) {
//         return res.status(422).json({ message: 'Faltan datos obligatorios' });
//     };
//     const userId = req.user.id; // Usuario autenticado
//     const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Ruta de la imagen

//     try {
//         // Verificar si el proyecto existe y si el usuario pertenece a él
//         const project = await Project.findByPk(projectId, { include: User });
//         if (!project) {
//             return res.status(404).json({ message: 'El proyecto no existe' });
//         }

//         const isUserInProject = project.Users.some(user => user.id === userId);
//         if (!isUserInProject) {
//             return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
//         }

//         // Crear el ticket
//         const ticket = await Ticket.create({
//             date,
//             description,
//             amount,
//             image: imagePath,
//             divisionType,
//             projectId,
//             userId,
//         });

//         // Calcular saldos y dividir gastos
//         const totalUsers = project.Users.length;
//         let balances = [];

//         if (divisionType === 'equitativa') {
//             const share = amount / totalUsers;
//             balances = project.Users.map(user => ({
//                 TicketId: ticket.id,
//                 UserId: user.id,
//                 balance: user.id === userId ? amount - share : -share,
//             }));
//         } else if (divisionType === 'personalizada' && contributions) {
//             balances = JSON.parse(contributions).map(({ userId, contributionPercentage }) => {
//                 const userShare = (contributionPercentage / 100) * amount;
//                 return {
//                     TicketId: ticket.id,
//                     UserId: userId,
//                     balance: req.user.id === userId ? amount - userShare : -userShare,
//                 };
//             });
//         } else {
//             return res.status(400).json({ message: 'Tipo de división no válido o faltan contribuciones' });
//         }

//         // Guardar los balances en la tabla intermedia
//         await TicketUser.bulkCreate(balances);

//         res.status(201).json({ message: 'Ticket subido con éxito', ticket });
//     } catch (error) {
//         console.error('Error al subir el ticket:', error);
//         res.status(500).json({ message: 'Error al subir el ticket' });
//     }
// };

// MODIFICAR GASTO <--- no sé si lo tenemos que permitir

// ELIMINAR GASTO <--- no sé si lo tenemos que permitir

// OBTENER LOS GASTOS DE UN PROYECTO POR SU ID EN URL

exports.getTicketsByProject = async (req, res) => {
    try {
        const { id_project } = req.params;
        const tickets = await Ticket.findAll({
            where: { id_project },
            include: ['user'], // Incluye datos del usuario que subió el ticket
        });
        if (!tickets.length) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tickets' });
    }
};

// OBTENER LOS GASTOS DE UN USUARIO POR SU ID
exports.getTicketsByUserId = async (req, res) => {
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