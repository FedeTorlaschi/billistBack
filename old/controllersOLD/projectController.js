const Project = require('../models/Project');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const TicketUser = require('../models/TicketUser');
const { Op } = require('sequelize');
const sequelize = require('../config/db'); 
//const Op = require('../config/db'); 

const { sendTemplateEmail } = require('../middlewares/emailService');

// CREAR PROYECTO
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

// MODIFICAR PROYECTO
exports.updateProject = async (req, res) => {
    const { id } = req.params; // ID del proyecto que se va a actualizar
    const { name, description, division } = req.body; // Datos del proyecto y usuarios actualizados
    try {
        // Buscar el proyecto por ID
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Actualizar los campos del proyecto
        if (name) project.name = name;
        if (description) project.description = description;
        if (division) project.division = division;
        // Guardar cambios en la base de datos
        await project.save();
        res.status(200).json({ message: 'Proyecto modificado exitosamente', project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ocurrió un error al intentar modificar el proyecto' });
    }
};

// ELIMINAR PROYECTO
exports.deleteProject = async (req, res) => {
    const { id } = req.params; // ID del proyecto a eliminar
    try {
        // Buscar el proyecto por ID
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ mensaje: 'El proyecto no existe' });
        }
        // Eliminar las relaciones del proyecto en UserProject
        await UserProject.destroy({ where: { ProjectId: id } });
        // Eliminar el proyecto
        await project.destroy();
        res.status(200).json({ mensaje: 'Proyecto eliminado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Ocurrió un error al intentar eliminar el proyecto' });
    }
};

// OBTENER PROYECTO POR SU ID
exports.getProjectById = async (req, res) => {
    const { id } = req.params; // ID del proyecto a buscar
    try {
        // Buscar el proyecto por ID, incluyendo los usuarios relacionados
        const project = await Project.findByPk(id, {
            include: {
                model: User,
                through: { attributes: ['percentage'] } // Incluir solo el campo "percentage" de la relación
            }
        });
        if (!project) {
            return res.status(404).json({ mensaje: 'El proyecto no existe' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Ocurrió un error al intentar obtener el proyecto' });
    }
};

// OBTENER PROYECTO POR SU NOMBRE
exports.getProjectByName = async (req, res) => {
    const { name } = req.params; // Nombre del proyecto a buscar
    try {
        // Buscar el proyecto por nombre, incluyendo los usuarios relacionados
        const project = await Project.findOne({
            where: { name },
            include: {
                model: User,
                through: { attributes: ['percentage'] } // Incluir solo el campo "percentage" de la relación
            }
        });
        if (!project) {
            return res.status(404).json({ mensaje: 'El proyecto no existe' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Ocurrió un error al intentar obtener el proyecto' });
    }
};

// OBTENER PROYECTOS DEL USUARIO EN SESIÓN
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

// AGREGAR USUARIO A PROYECTO
exports.addMemberToProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
        
        // Verificar que el proyecto existe
        const project = await Project.findByPk(projectId);
        const user = await User.findByPk(userId);

        if (!project || !user) {
            return res.status(404).json({ message: 'Proyecto o usuario no encontrado.' });
        }

        // Agregar el usuario al proyecto
        await project.addUser(user);
        
        // Enviar correo con plantilla
        try {
            await sendTemplateEmail(user.email, '¡Nuevo Proyecto Asignado!', 'userAddedToProject', {
                username: user.username,
                projectName: project.name,
                projectDescription: project.description || 'Sin descripción',
                addedBy: req.user.name,
            });
            console.log('Correo enviado con éxito.');
        } catch (emailError) {
            console.error('Error al enviar el correo:', emailError);
        }
        res.status(200).json({ message: 'Miembro agregado al proyecto con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar miembro al proyecto', error });
    }
};













































// // OBTENER LOS BALANCES DE UN TICKET ¿¿¿¿????
// exports.getUserTicketBalances = async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const userId = req.user.id; // ID del usuario logueado extraído del token

//         // Buscar los tickets del proyecto con los balances relacionados al usuario
//         const project = await Project.findOne({
//             where: { id: projectId },
//             include: [
//                 {
//                     model: Ticket,
//                     as: 'tickets',
//                     include: [
//                         {
//                             model: TicketUser,
//                             as: 'TicketUsers',
//                             where: { UserId: userId }, // Filtrar por el usuario logueado
//                             attributes: ['balance'],
//                          }
//                             ]

//                 }
//             ]
//         });

//         if (!project) {
//             return res.status(404).json({ message: 'Proyecto no encontrado' });
//         }
//         // Construir respuesta con balances por ticket
//         const ticketBalances = project.tickets.map(ticket => ({
//             ticketId: ticket.id,
//             createdBy: ticket.User,
//             description: ticket.description,
//             balance: ticket.TicketUsers[0]?.balance || 0 // Puede no haber TicketUser si no hay balance
//         }));

//         return res.status(200).json({
//             projectId,
//             userId,
//             ticketBalances
//         });
//     } catch (error) {
//         console.error('Error al obtener balances por ticket:', error);
//         return res.status(500).json({ message: 'Error interno del servidor' });
//     }
// };

// // OBTENER BALANCES ENTRE USUARIOS EN UN PROYECTO POR SU ID
// exports.getUserBalancesInProject = async (req, res) => {
//     const { projectId } = req.params;
//     const userId = req.user.id; // ID del usuario autenticado
    
//     try {
//         // Obtener todos los usuarios del proyecto con su nombre y email
//         const usersInProject = await User.findAll({
//             include: {
//                 model: Project,
//                 where: { id: projectId },
//                 attributes: []
//             },
//             attributes: ['id', 'name', 'email']
//         });

//         // Si no hay usuarios en el proyecto
//         if (!usersInProject || usersInProject.length === 0) {
//             return res.status(404).json({ message: 'No se encontraron usuarios en el proyecto.' });
//         }

//         // Cálculo del balance cruzado
//         const balances = [];
//         const loggedUserBalance = {}; // Para calcular los saldos del usuario autenticado con otros usuarios

//         // Obtener todos los tickets y sus balances
//         const ticketUsers = await TicketUser.findAll({
//             include: [
//                 { model: Ticket, where: { projectId }, attributes: ['id', 'userId'] },
//                 { model: User, attributes: ['id', 'name', 'email'] }
//             ],
//             attributes: ['UserId', 'TicketId', 'balance']
//         });

//         // Crear un mapa para almacenar los saldos
//         ticketUsers.forEach(({ UserId, balance, Ticket }) => {
//             const ticketOwner = Ticket.userId; // Usuario que creó el ticket
//             if (!loggedUserBalance[UserId]) loggedUserBalance[UserId] = {};
//             if (!loggedUserBalance[UserId][ticketOwner]) loggedUserBalance[UserId][ticketOwner] = 0;

//             loggedUserBalance[UserId][ticketOwner] += balance;
//         });

//         // Calcular los saldos cruzados para el usuario autenticado
//         usersInProject.forEach(otherUser => {
//             if (otherUser.id !== userId) {
//                 const balanceConOtro = (loggedUserBalance[userId]?.[otherUser.id] || 0) -
//                                        (loggedUserBalance[otherUser.id]?.[userId] || 0);

//                 balances.push({
//                     user: userId,
//                     userComparacion: {
//                         id: otherUser.id,
//                         name: otherUser.name,
//                         email: otherUser.email
//                     },
//                     saldo: balanceConOtro
//                 });
//             }
//         });

//         res.json(balances);
//     } catch (error) {
//         console.error('Error al obtener los balances del usuario:', error);
//         res.status(500).json({ message: 'Error interno del servidor', error });
//     }
// };

// // OBTENER
// exports.getProjectBalances = async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         // Validar que se pase el projectId
//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         // Obtener los balances totales por usuario para el proyecto especificado
//         const balances = await TicketUser.findAll({
//             attributes: [
//                 'UserId',
//                 [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance']
//             ],
//             include: [
//                 {
//                     model: Ticket,
//                     attributes: [], // No queremos información del ticket aquí
//                     where: { ProjectId: projectId } // Filtrar por proyecto
//                 },
//                 {
//                     model: User,
//                     attributes: ['name', 'email'] // Información del usuario
//                 }
//             ],
//             group: ['UserId', 'User.name', 'User.email'], // Agrupar por atributos del usuario
//         });

//         res.json(balances);
//     } catch (error) {
//         console.error('Error al obtener balances del proyecto:', error);
//         res.status(500).json({ message: 'Error al obtener balances del proyecto.', error });
//     }
// };

// exports.getProjectUsers = async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         // Validar que se pase el projectId
//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         // Obtener los usuarios asociados al proyecto
//         const users = await User.findAll({
//             include: [
//                 {
//                     model: Project,
//                     attributes: [], // No necesitamos los atributos del proyecto
//                     where: { id: projectId } // Filtrar por el ID del proyecto
//                 }
//             ],
//             attributes: ['id', 'name', 'email'] // Atributos a devolver del usuario
//         });

//         if (!users || users.length === 0) {
//             return res.status(404).json({ message: 'No se encontraron usuarios para este proyecto.' });
//         }

//         res.json(users);
//     } catch (error) {
//         console.error('Error al obtener usuarios del proyecto:', error);
//         res.status(500).json({ message: 'Error al obtener usuarios del proyecto.', error });
//     }
// };

// exports.getProjectById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Validar que el ID sea un número
//         if (isNaN(id)) {
//             return res.status(400).json({ message: 'El ID del proyecto debe ser un número válido.' });
//         }

//         // Buscar el proyecto por ID
//         const project = await Project.findOne({
//             where: { id },
//         });

//         if (!project) {
//             return res.status(404).json({ message: 'Proyecto no encontrado.' });
//         }

//         res.status(200).json(project);
//     } catch (error) {
//         console.error('Error al obtener el proyecto:', error);
//         res.status(500).json({ message: 'Error al obtener el proyecto.', error });
//     }
// };

// exports.getProjectTicketsSum = async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         // Validar que el ID del proyecto esté presente
//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         // Calcular la suma de los amounts
//         const totalAmount = await Ticket.findOne({
//             attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']],
//             where: { ProjectId: projectId },
//         });

//         // Formatear la respuesta
//         const result = totalAmount?.dataValues?.totalAmount || 0;

//         res.status(200).json({ projectId, totalAmount: parseFloat(result) });
//     } catch (error) {
//         console.error('Error al calcular la suma de amounts de los tickets:', error);
//         res.status(500).json({ message: 'Error al obtener la suma de los tickets.', error });
//     }
// };

// exports.getTicketsByProject = async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         const tickets = await Ticket.findAll({
//             where: { projectId },
//         });

//         if (!tickets || tickets.length === 0) {
//             return res.status(404).json({ message: 'No se encontraron tickets para este proyecto.' });
//         }

//         res.status(200).json({ tickets });
//     } catch (error) {
//         console.error('Error al obtener tickets por proyecto:', error);
//         res.status(500).json({ message: 'Error al obtener tickets por proyecto.', error });
//     }
// };

// exports.getCreatorBalanceSum = async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const userId = req.user.id; // Usuario logueado

//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         const totalBalance = await TicketUser.findOne({
//             attributes: [[sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance']],
//             include: [
//                 {
//                     model: Ticket,
//                     attributes: [], // No seleccionamos columnas del modelo Ticket
//                     where: {
//                         userId, // Tickets creados por el usuario logueado
//                         projectId,
//                     },
//                 },
//             ],
//             where: {
//                 UserId: userId, // Usuario relacionado con los balances
//             },
//             raw: true, // Devuelve un objeto plano
//         });

//         const total = totalBalance?.totalBalance || 0;

//         res.status(200).json({ totalBalance: total });
//     } catch (error) {
//         console.error('Error al obtener la suma de balances de tickets creados por el usuario:', error);
//         res.status(500).json({ message: 'Error al obtener la suma de balances.', error });
//     }
// };

// exports.getNotCreatorBalanceSum = async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const userId = req.user.id; // Usuario logueado

//         if (!projectId) {
//             return res.status(400).json({ message: 'El ID del proyecto es obligatorio.' });
//         }

//         const totalBalance = await TicketUser.findOne({
//             attributes: [[sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance']],
//             include: [
//                 {
//                     model: Ticket,
//                     attributes: [], // No seleccionamos columnas del modelo Ticket
//                     where: {
//                         projectId,
//                         userId: { [Op.ne]: userId }, // Excluye los tickets creados por el usuario logueado
//                     },
//                 },
//             ],
//             where: {
//                 UserId: userId, // Usuario relacionado con los balances
//             },
//             raw: true, // Devuelve un objeto plano
//         });

//         const total = totalBalance?.totalBalance || 0;

//         res.status(200).json({ totalBalance: total });
//     } catch (error) {
//         console.error('Error al obtener la suma de balances de tickets no creados por el usuario:', error);
//         res.status(500).json({ message: 'Error al obtener la suma de balances.', error });
//     }
// };