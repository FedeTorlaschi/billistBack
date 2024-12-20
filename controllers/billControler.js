const Bill = require('../models/Bill');
const User = require('../models/User');
const Project = require('../models/Project');
const Balance = require('../models/Balance');
const UserProject = require('../models/UserProject');
const UserBill = require('../models/UserBill');
const recalculateBalances = require('../middlewares/recalculateBalances');

// CREAR GASTO
exports.createBill = async (req, res) => {
    const { description, total_amount, id_project, image, date, contributors } = req.body;
    /*
        contributors: [
            { id_user: 1, partial_amount: 50 },
            { id_user: 2, partial_amount: 30 },
        ]
    */
    console.log("Datos recibidos en /bill/create:");
    console.log("Descripción:", description);
    console.log("Total Amount:", total_amount);
    console.log("ID Proyecto:", id_project);
    console.log("Fecha:", date);
    console.log("Contribuyentes:", contributors);
    try {
        // Validar que la suma de los partial_amount sea igual al total_amount
        if (contributors && contributors.length > 0) {
            const sumPartialAmounts = contributors.reduce((sum, contributor) => sum + contributor.partial_amount, 0);
            const EPSILON = 0.01; // Tolerancia para comparación numérica
            if (Math.abs(sumPartialAmounts - total_amount) > EPSILON) {
                return res.status(400).json({
                    message: `La suma de los partial_amount (${sumPartialAmounts}) no coincide con el total_amount (${total_amount}).`
                });
            }
        } else {
            return res.status(400).json({ message: 'La lista de contribuyentes no puede estar vacía.' });
        }
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
        // 3. Asociar usuarios con el gasto a través de la tabla intermedia UserBill
        try {
            const userBillPromises = contributors.map(contributor => {
                if (!contributor.id_user || !contributor.partial_amount) {
                    throw new Error('Cada contribuyente debe tener un id_user y un partial_amount.');
                }
                return UserBill.create({
                    id_user: contributor.id_user,
                    id_bill: bill.id,
                    partial_amount: contributor.partial_amount
                });
            });

            await Promise.all(userBillPromises);
        } catch (err) {
            console.error('Error al asociar usuarios con el gasto:', err);
            return res.status(500).json({ message: 'Error al asociar usuarios con el gasto.', error: err.message });
        }
        // 4. Recalcular balances después de crear el gasto
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
    const { description, total_amount, image, date, contributors } = req.body;
    try {
        // Buscar el gasto por ID
        const bill = await Bill.findByPk(id);
        if (!bill) {
            return res.status(404).json({ message: 'Gasto no encontrado' });
        }

        // Actualizar los campos del gasto
        if (description) bill.description = description;
        if (total_amount) bill.total_amount = total_amount;
        if (image) bill.image = image;
        if (date) bill.date = date;

        // Guardar los cambios del gasto
        await bill.save();

        // Actualizar los usuarios relacionados (quiénes pagaron este gasto)
        if (contributors && Array.isArray(contributors) && contributors.length > 0) {
            // Validar que la suma de partial_amount sea igual al total_amount
            const sumPartialAmounts = contributors.reduce(
                (sum, contributor) => sum + contributor.partial_amount,
                0
            );

            const EPSILON = 0.01; // Tolerancia numérica
            if (Math.abs(sumPartialAmounts - total_amount) > EPSILON) {
                return res.status(405).json({
                    message: `La suma de los partial_amount (${sumPartialAmounts}) no coincide con el total_amount (${total_amount}).`
                });
            }

            // Eliminar las relaciones anteriores en UserBill
            await UserBill.destroy({ where: { id_bill: bill.id } });

            // Crear nuevas relaciones en UserBill
            for (const contributor of contributors) {
                const { id_user, partial_amount } = contributor;

                // Validar que el partial_amount no sea mayor al total_amount
                if (partial_amount <= total_amount) {
                    await UserBill.create({
                        id_user: id_user,
                        id_bill: bill.id,
                        partial_amount: partial_amount,
                    });
                } else {
                    return res.status(400).json({
                        message: `El monto parcial (${partial_amount}) de un usuario no puede ser mayor al monto total del gasto (${total_amount}).`
                    });
                }
            }
        } else {
            return res.status(400).json({ message: 'La lista de contribuyentes no puede estar vacía.' });
        }
        await recalculateBalances(bill.id_project);
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
        await UserBill.destroy({ where: { id_bill: bill.id } });
        // Eliminar el gasto
        await bill.destroy();
        await recalculateBalances(bill.id_project);
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