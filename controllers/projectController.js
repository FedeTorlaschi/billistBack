const Project = require('../models/Project');
const User = require('../models/User');
const recalculateBalances = require('../middlewares/recalculateBalances');

// CREAR PROYECTO
exports.createProject = async (req, res) => {
    try {
        const { name, description, distribution } = req.body;
        const userId = req.user.id;  // suponiendo que tenemos la autenticación configurada
        // crear el proyecto
        const created_at = new Date().toISOString().split('T')[0];
        const project = await Project.create({ name, description, distribution, created_at });
        // agregar el creador del proyecto (usuario) al proyecto
        await project.addUser(userId);
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
        // Eliminar las relaciones del proyecto en UserProjet, Bill, UserBill y Balance
        await UserProject.destroy({ where: { project_id: id } });
        await Bill.destroy({ where: { project_id: id } });
        await UserBill.destroy({ where: { project_id: id } });
        await Balance.destroy({ where: { project_id: id } });
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
                through: { attributes: ['custom'] } // Incluir solo el campo "custom" de la relación
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
    const { name } = req.body.name; // Nombre del proyecto a buscar
    try {
        // Buscar el proyecto por nombre, incluyendo los usuarios relacionados
        const project = await Project.findOne({
            where: { name },
            include: {
                model: User,
                through: { attributes: ['custom'] } // Incluir solo el campo "custom" de la relación
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

// AGREGAR UN MIEMBRO A UN PROYECTO
exports.addMemberToProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
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
        const existingRelation = await project.hasUser(user);
        if (existingRelation) {
            return res.status(400).json({ message: 'El usuario ya es miembro del proyecto' });
        }
        // Agregar al usuario al proyecto
        await project.addUser(user);
        // Recalcular los balances
        await recalculateBalances(projectId);
        res.status(200).json({ message: 'Usuario agregado al proyecto con éxito' });
    } catch (error) {
        console.error('Error al agregar miembro al proyecto:', error);
        res.status(500).json({ message: 'Error al agregar miembro al proyecto', error });
    }
};

// ELIMINAR UN MIEMBRO DE UN PROYECTO
exports.deleteMemberFromProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
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
        // Verificar si existe la relación
        const existingRelation = await project.hasUser(user);
        if (!existingRelation) {
            return res.status(400).json({ message: 'El usuario no es miembro del proyecto' });
        }
        // Eliminar al usuario del proyecto
        await project.removeUser(user);
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
                [Op.or]: [
                    { id_user_payer: userId },  // Si el usuario ha pagado
                    { id_user_payed: userId }   // O si el usuario ha recibido pagos
                ]
            }
        });
        if (!userBalances || userBalances.length === 0) {
            return res.status(404).json({ message: 'No se encontraron balances para este usuario en el proyecto' });
        }
        // Calcular el balance total
        const totalBalance = userBalances.reduce((acc, balance) => acc + balance.amount, 0);
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
        const totalSpent = await Bill.sum('total_amount', {
            where: {
                id_project: projectId
            }
        });
        if (totalSpent === null) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        res.status(200).json({ totalSpent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el total gastado en el proyecto', error });
    }
};

// OBTENER EL TOTAL APORTADO POR UN USUARIO EN UN PROYECTO
exports.getTotalContributedByUser = async (req, res) => {
    const { projectId, userId } = req.params;  // ID del proyecto y del usuario
    try {
        // Buscar todos los gastos del proyecto
        const bills = await Bill.findAll({
            where: {
                id_project: projectId
            }
        });
        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        // Calcular el total aportado por el usuario
        let totalContributed = 0;
        for (let bill of bills) {
            const contributors = bill.contributors;  // Asumimos que la lista de contribuyentes se encuentra en el gasto
            for (let contributor of contributors) {
                if (contributor.userId === parseInt(userId)) {
                    totalContributed += contributor.amount;
                }
            }
        }
        res.status(200).json({ totalContributed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el total aportado por el usuario en el proyecto', error });
    }
};