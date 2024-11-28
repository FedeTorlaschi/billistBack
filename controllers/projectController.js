const Project = require('../models/Project');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const TicketUser = require('../models/TicketUser');

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
