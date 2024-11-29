const Project = require('../models/Project');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const TicketUser = require('../models/TicketUser');
const sequelize = require('../config/db'); 

exports.createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;  // Suponiendo que tenemos la autenticación configurada

        // Crear el proyecto
        const project = await Project.create({ name, description });

        // Agregar el creador del proyecto (usuario) al proyecto
        await project.addUser(userId);

        res.status(201).json({ message: 'Proyecto creado con éxito', project });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el proyecto', error });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const userId = req.user.id;  
        const projects = await Project.findAll({
            attributes: ['id', 'name', 'description'],
            include: {
                model: User,
                attributes: [],
                where: { id: userId }
            }
        });

        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los proyectos', error });
    }
};

exports.addMemberToProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
        
        // Verificar que el proyecto existe
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // Agregar el usuario al proyecto
        await project.addUser(userId);

        res.status(200).json({ message: 'Miembro agregado al proyecto con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar miembro al proyecto', error });
    }
};

exports.getUserTicketBalances = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id; // ID del usuario logueado extraído del token

        // Buscar los tickets del proyecto con los balances relacionados al usuario
        const project = await Project.findOne({
            where: { id: projectId },
            include: [
                {
                    model: Ticket,
                    as: 'tickets',
                    include: [
                        {
                            model: TicketUser,
                            as: 'TicketUsers',
                            where: { UserId: userId }, // Filtrar por el usuario logueado
                            attributes: ['balance'],
                         }
                            ]

                }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Construir respuesta con balances por ticket
        const ticketBalances = project.tickets.map(ticket => ({
            ticketId: ticket.id,
            createdBy: ticket.User,
            description: ticket.description,
            balance: ticket.TicketUsers[0]?.balance || 0 // Puede no haber TicketUser si no hay balance
        }));

        return res.status(200).json({
            projectId,
            userId,
            ticketBalances
        });
    } catch (error) {
        console.error('Error al obtener balances por ticket:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};



exports.getUserBalancesInProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id; // ID del usuario autenticado
    
    try {
        // Obtener todos los usuarios del proyecto con su nombre y email
        const usersInProject = await User.findAll({
            include: {
                model: Project,
                where: { id: projectId },
                attributes: []
            },
            attributes: ['id', 'name', 'email']
        });

        // Si no hay usuarios en el proyecto
        if (!usersInProject || usersInProject.length === 0) {
            return res.status(404).json({ message: 'No se encontraron usuarios en el proyecto.' });
        }

        // Cálculo del balance cruzado
        const balances = [];
        const loggedUserBalance = {}; // Para calcular los saldos del usuario autenticado con otros usuarios

        // Obtener todos los tickets y sus balances
        const ticketUsers = await TicketUser.findAll({
            include: [
                { model: Ticket, where: { projectId }, attributes: ['id', 'userId'] },
                { model: User, attributes: ['id', 'name', 'email'] }
            ],
            attributes: ['UserId', 'TicketId', 'balance']
        });

        // Crear un mapa para almacenar los saldos
        ticketUsers.forEach(({ UserId, balance, Ticket }) => {
            const ticketOwner = Ticket.userId; // Usuario que creó el ticket
            if (!loggedUserBalance[UserId]) loggedUserBalance[UserId] = {};
            if (!loggedUserBalance[UserId][ticketOwner]) loggedUserBalance[UserId][ticketOwner] = 0;

            loggedUserBalance[UserId][ticketOwner] += balance;
        });

        // Calcular los saldos cruzados para el usuario autenticado
        usersInProject.forEach(otherUser => {
            if (otherUser.id !== userId) {
                const balanceConOtro = (loggedUserBalance[userId]?.[otherUser.id] || 0) -
                                       (loggedUserBalance[otherUser.id]?.[userId] || 0);

                balances.push({
                    user: userId,
                    userComparacion: {
                        id: otherUser.id,
                        name: otherUser.name,
                        email: otherUser.email
                    },
                    saldo: balanceConOtro
                });
            }
        });

        res.json(balances);
    } catch (error) {
        console.error('Error al obtener los balances del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

exports.getProjectBalances = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validar que se pase el projectId
        if (!projectId) {
            return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
        }

        // Obtener los balances totales por usuario para el proyecto especificado
        const balances = await TicketUser.findAll({
            attributes: [
                'UserId',
                [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance']
            ],
            include: [
                {
                    model: Ticket,
                    attributes: [], // No queremos información del ticket aquí
                    where: { ProjectId: projectId } // Filtrar por proyecto
                },
                {
                    model: User,
                    attributes: ['name', 'email'] // Información del usuario
                }
            ],
            group: ['UserId', 'User.name', 'User.email'], // Agrupar por atributos del usuario
        });

        res.json(balances);
    } catch (error) {
        console.error('Error al obtener balances del proyecto:', error);
        res.status(500).json({ message: 'Error al obtener balances del proyecto.', error });
    }
};
