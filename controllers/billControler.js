const Bill = require('../models/Bill');
const User = require('../models/User');
const Project = require('../models/Project');
const Balance = require('../models/Balance');
const UserProject = require('../models/UserProject');
const recalculateBalances = require('../middlewares/recalculateBalances');

// CREAR GASTO
exports.createBill = async (req, res) => {
    const { description, total_amount, id_project, image, date, contributors } = req.body;
    try {
        // 1. Obtener la configuración de distribución del proyecto
        const project = await Project.findByPk(id_project);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        
        // 2. Crear el gasto
        const bill = await Bill.create({
            description,
            total_amount,
            id_project,
            image,
            date
        });
        // Recalcular los balances después de crear el gasto
        await recalculateBalances(id_project);
        res.status(201).json({ message: 'Gasto creado y balances actualizados', bill });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el gasto y actualizar balances', error });
    }
};

// MODIFICAR GASTO
exports.updateBill = async (req, res) => {
    const { id } = req.params; // ID del gasto que se va a actualizar
    const { total_amount, description, date, users } = req.body;
    try {
        // Buscar el gasto por ID
        const bill = await Bill.findByPk(id);
        if (!bill) {
            return res.status(404).json({ message: 'Gasto no encontrado' });
        }
        // Actualizar los campos del gasto
        if (total_amount) bill.total_amount = total_amount;
        if (description) bill.description = description;
        if (date) bill.date = date;
        // Guardar los cambios
        await bill.save();
        // Actualizar los usuarios relacionados (quiénes pagaron este gasto)
        if (users && users.length > 0) {
            // Primero, eliminar las relaciones anteriores
            await UserBill.destroy({ where: { billId: bill.id } });
            // Luego, crear nuevas relaciones
            for (let user of users) {
                const { userId, partialAmount } = user;
                // Verificar que el monto parcial no sea mayor al monto total del gasto
                if (partialAmount <= total_amount) {
                    await UserBill.create({
                        billId: bill.id,
                        userId: userId,
                        partial_amount: partialAmount,
                    });
                } else {
                    return res.status(400).json({ message: 'El monto parcial no puede ser mayor al monto total del gasto' });
                }
            }
        }
        res.status(200).json({ message: 'Gasto modificado con éxito', bill });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al modificar el gasto', error });
    }
};

// ELIMINAR GASTO
exports.deleteBill = async (req, res) => {
    const { id } = req.params; // ID del gasto a eliminar
    try {
        // Buscar el gasto por ID
        const bill = await Bill.findByPk(id);
        if (!bill) {
            return res.status(404).json({ message: 'Gasto no encontrado' });
        }
        // Eliminar las relaciones en UserBill (quién pagó este gasto)
        await UserBill.destroy({ where: { billId: bill.id } });
        // Eliminar el gasto
        await bill.destroy();
        res.status(200).json({ message: 'Gasto eliminado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el gasto', error });
    }
};

// OBTENER GASTO POR ID
exports.getBillById = async (req, res) => {
    const { id } = req.params; // ID del gasto a buscar
    try {
        // Buscar el gasto por ID e incluir los usuarios relacionados y el proyecto
        const bill = await Bill.findByPk(id, {
            include: [
                {
                    model: User,
                    through: { attributes: ['partial_amount'] } // Incluimos el campo 'partial_amount' de la relación UserBill
                },
                {
                    model: Project,
                    attributes: ['name', 'description'] // Incluir detalles del proyecto asociado
                }
            ]
        });

        if (!bill) {
            return res.status(404).json({ message: 'Gasto no encontrado' });
        }

        res.status(200).json(bill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el gasto', error });
    }
};

// OBTENER GASTOS DE UN PROYECTO POR ID
exports.getBillsByProjectId = async (req, res) => {
    const { projectId } = req.params; // ID del proyecto
    try {
        const bills = await Bill.findAll({
            where: { id_project: projectId },
            include: [
                {
                    model: User,
                    through: { attributes: ['partial_amount'] } // Incluir el monto parcial de cada usuario
                }
            ]
        });
        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: 'No se encontraron gastos para este proyecto' });
        }
        res.status(200).json(bills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los gastos del proyecto', error });
    }
};

// OBTENER GASTOS DE UN USUARIO POR ID
exports.getBillsByUserId = async (req, res) => {
    const { userId } = req.params; // ID del usuario
    try {
        const bills = await Bill.findAll({
            include: {
                model: User,
                where: { id: userId },
                through: { attributes: ['partial_amount'] } // Incluir el monto parcial de este usuario
            }
        });
        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: 'No se encontraron gastos para este usuario' });
        }
        res.status(200).json(bills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los gastos del usuario', error });
    }
};