const Project = require('../models/Project');
const User = require('../models/User');
const UserProject = require('../models/UserProject');
const Bill = require('../models/Bill');
const UserBill = require('../models/UserBill');
const Balance = require('../models/Balance');
const recalculateBalances = require('../middlewares/recalculateBalances');
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // Para transacciones si es necesario

// CREAR PROYECTO
exports.createProject = async (req, res) => {
    try {
        const { name, description, distribution } = req.body;
        const userId = req.user.id;  // suponiendo que tenemos la autenticación configurada
        // crear el proyecto
        const created_at = new Date().toISOString().split('T')[0];
        const project = await Project.create({ name, description, distribution, created_at });
        // agregar el creador del proyecto (usuario) al proyecto
        // await project.addUser(userId);
        const id_user = userId;
        const id_project = project.id;
        const percentage = 100.00;
        console.log ("DATOS: " + id_user + id_project + percentage)
        const relation = await UserProject.create({ id_user, id_project, percentage});
        res.status(201).json({ message: 'Proyecto creado con éxito', project });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el proyecto', error });
    }
};

// MODIFICAR PROYECTO
exports.updateProject = async (req, res) => {
    const { id } = req.params; // ID del proyecto que se va a actualizar
    const { name, description, distribution } = req.body; // Datos del proyecto y usuarios actualizados
    try {
        // Buscar el proyecto por ID
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Actualizar los campos del proyecto
        if (name) project.name = name;
        if (description) project.description = description;
        if (distribution) project.distribution = distribution;
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

        // Buscar los Bills relacionados al proyecto
        const bills = await Bill.findAll({ where: { id_project: id } });
        const billIds = bills.map(bill => bill.id);

        // Eliminar las relaciones en UserBill donde el id_bill esté en billIds
        await UserBill.destroy({ where: { id_bill: billIds } });

        // Eliminar las relaciones del proyecto en UserProject, Bill y Balance
        await UserProject.destroy({ where: { id_project: id } });
        await Bill.destroy({ where: { id_project: id } });
        await Balance.destroy({ where: { id_project: id } });

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
                through: { attributes: [] } // Incluir solo el campo "custom" de la relación
            }
        });
        if (!project) {
            return res.status(404).json({ mensaje: 'Proyecto no encotrado' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Ocurrió un error al intentar obtener el proyecto' });
    }
};

// OBTENER PROYECTO POR SU NOMBRE
exports.getProjectByName = async (req, res) => {
    const { name } = req.body; // Nombre del proyecto a buscar
    try {
        // Buscar el proyecto por nombre, incluyendo los usuarios relacionados
        const project = await Project.findOne({
            where: { name },
            include: {
                model: User,
                through: { attributes: [] } // Incluir solo el campo "custom" de la relación
            }
        });
        if (!project) {
            return res.status(404).json({ mensaje: 'Proyecto no encotrado' });
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
            attributes: ['id', 'name', 'description', 'distribution', 'created_at'],
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

// AGREGAR UN MIEMBRO A UN PROYECTO
exports.addMemberToProject = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { projectId, userId } = req.body;
        // Validar datos
        if (!projectId || !userId) {
            return res.status(401).json({ message: 'ID de proyecto o ID de usuario inválido' });
        }
        // Buscar el proyecto
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Buscar el usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Verificar si ya existe la relación
        const existingRelation = await UserProject.findOne({
            where: {
                id_project: projectId,
                id_user: userId
            }
        });
        if (existingRelation) {
            return res.status(400).json({ message: 'El usuario ya es miembro del proyecto' });
        }
        // Agregar al usuario al proyecto
        const percentage = 0.0; // Porcentaje inicial (esto podría cambiar según tu lógica)
        await UserProject.create({ id_user: userId, id_project: projectId, percentage }, { transaction });
        // Crear las relaciones de balance con los demás usuarios del proyecto
        const projectUsers = await UserProject.findAll({
            where: { id_project: projectId },
            attributes: ['id_user']
        });
        const userIds = projectUsers.map((rel) => rel.id_user);
        // Asegurarse de que existan balances ida y vuelta para cada par de usuarios
        for (const existingUserId of userIds) {
            if (existingUserId !== userId) {
                // Balance desde el nuevo usuario hacia los existentes
                await Balance.findOrCreate({
                    where: {
                        id_project: projectId,
                        id_user_payer: userId,
                        id_user_payed: existingUserId
                    },
                    defaults: { amount: 0 },
                    transaction
                });
                // Balance desde los existentes hacia el nuevo usuario
                await Balance.findOrCreate({
                    where: {
                        id_project: projectId,
                        id_user_payer: existingUserId,
                        id_user_payed: userId
                    },
                    defaults: { amount: 0 },
                    transaction
                });
            }
        }
        // Confirmar la transacción
        await transaction.commit();
        // Recalcular los balances después de agregar el usuario
        await recalculateBalances(projectId);
        res.status(200).json({ message: 'Usuario agregado al proyecto con éxito' });
    } catch (error) {
        // Revertir la transacción en caso de error
        await transaction.rollback();
        console.error('Error al agregar miembro al proyecto:', error);
        res.status(500).json({ message: 'Error al agregar miembro al proyecto', error });
    }
};

// ELIMINAR UN MIEMBRO DE UN PROYECTO
exports.deleteMemberFromProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
        console.log("")
        console.log("")
        console.log("PROJECT ID: " + projectId)
        console.log("USER ID: " + userId)
        console.log("")
        console.log("")
        // Buscar el proyecto
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Buscar el usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Verificar si ya existe la relación
        // const existingRelation = await project.hasUser(user);
        const existingRelation = await UserProject.findOne({
            where: {
                id_project: projectId,
                id_user: userId
            }
        });
        if (!existingRelation) {
            return res.status(400).json({ message: 'El usuario no es miembro del proyecto' });
        }
        // Eliminar al usuario del proyecto
        // await project.removeUser(user);
        existingRelation.destroy();
        // Recalcular los balances
        await recalculateBalances(projectId);
        res.status(200).json({ message: 'Usuario eliminado del proyecto con éxito' });
    } catch (error) {
        console.error('Error al eliminar miembro del proyecto:', error);
        res.status(500).json({ message: 'Error al eliminar miembro del proyecto', error });
    }
};

// OBTENER TODOS LOS INTEGRANTES DE UN PROYECTO
exports.getProjectMembers = async (req, res) => {
    const { projectId } = req.params;  // ID del proyecto que se va a consultar
    try {
        // Buscar el proyecto por ID
        const project = await Project.findByPk(projectId, {
            include: {
                model: User,  // Incluir los usuarios asociados a este proyecto
                attributes: ['id', 'username', 'email'],
                through: { attributes: ['percentage'] }  // Si deseas incluir el porcentaje de distribución
            }
        });
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        res.status(200).json({ members: project.Users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los miembros del proyecto', error });
    }
};

// OBTENER EL BALANCE GENERAL DE UN MIEMBRO EN UN PROYECTO
exports.getMemberBalance = async (req, res) => {
    const { projectId, userId } = req.params;  // IDs del proyecto y del usuario
    try {
        // Buscar los balances del usuario en el proyecto
        const userBalances = await Balance.findAll({
            where: {
                id_project: projectId,
                id_user_payer: userId // Filtrar solo por el usuario que ha pagado
            }
        });

        if (!userBalances || userBalances.length === 0) {
            return res.status(404).json({ message: 'No se encontraron balances para este usuario en el proyecto' });
        }
        // Calcular el balance total
        let totalBalance = 0;
        console.log('')
        console.log('')
        console.log('')
        for (const userBalance of userBalances) {
            console.log('')
            console.log(`ID DEL BALANCE: ${userBalance.id} \n AMOUNT DEL BALANCE: ${userBalance.amount} \n TOTAL BALANCE HASTA AHORA: ${totalBalance}`)
            totalBalance = totalBalance + userBalance.amount;
        }
        // const totalBalance = userBalances.reduce((acc, balance) => acc + balance.amount, 0);
        res.status(200).json({ totalBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el balance del miembro en el proyecto', error });
    }
};

// OBTENER EL TOTAL GASTADO EN UN PROYECTO
exports.getTotalSpentInProject = async (req, res) => {
    const { projectId } = req.params;  // ID del proyecto
    try {
        // Sumar todos los gastos asociados a este proyecto
        const bills = await Bill.findAll({
            where: {
                id_project: projectId,
            }
        });
        if (bills === null) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        let totalSpent = 0;
        for (const bill of bills) {
            totalSpent = totalSpent + bill.total_amount;
        }
        res.status(200).json({ totalSpent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el total gastado en el proyecto', error });
    }
};

// OBTENER EL TOTAL APORTADO POR UN USUARII EN UN PROYECTO
exports.getTotalContributedByUser = async (req, res) => {
    const { projectId, userId } = req.params;  // ID del proyecto y del usuario
    try {
        // Buscar todos los gastos del proyecto
        const bills = await Bill.findAll({
            where: {
                id_project: projectId,
            }
        });
        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        const userBills = [];
        for (const bill of bills) {
            const newBill = await UserBill.findOne({ where: {id_bill: bill.id, id_user: userId} });
            if (newBill!==null) {
                userBills.push(newBill);
            }
        }
        console.log("")
        console.log("")
        console.log(userBills)
        console.log("")
        // Calcular el total aportado por el usuario
        let totalContributed = 0;
        if (userBills.length>0) {
            for (let userBill of userBills) {
                totalContributed += userBill.partial_amount;
            }
        }
        res.status(200).json({ totalContributed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el total aportado por el usuario en el proyecto', error });
    }
};

// OBTENER EL BALANCE GENERAL DEL USUARIO EN SESIÓN EN TOTAL
exports.getGeneralBalance = async (req, res) => {
    try {
        const userId = req.user.id; // Obtener el ID del usuario en sesión
        console.log("")
        console.log("")
        console.log("CALCULANDO BALANCE GENERAL TOTAL DEL USUARIO " + userId)
        console.log("")
        console.log("")
        // Validar que el usuario esté en sesión
        if (!userId) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        // Consultar todos los balances donde el usuario es pagador o pagado
        const balances = await Balance.findAll({
            where: { id_user_payer: userId }
        });

        if (!balances.length) {
            return res.status(404).json({ message: 'No se encontraron balances para este usuario.' });
        }

        // Calcular el balance general
        const generalBalance = balances.reduce((total, balance) => {
            if (balance.id_user_payer === userId) {
                // Si el usuario es pagador, resta el amount
                return total - balance.amount;
            } else if (balance.id_user_payed === userId) {
                // Si el usuario es pagado, suma el amount
                return total + balance.amount;
            }
            return total;
        }, 0);

        res.status(200).json({ generalBalance });
    } catch (error) {
        console.error('Error al obtener el balance general del usuario:', error.message);
        res.status(500).json({ message: 'Error al obtener el balance general del usuario.', error });
    }
};