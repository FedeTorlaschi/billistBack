const UserProject = require('../models/UserProject');  // Relación entre usuario y proyecto
const Project = require('../models/Project');  // Proyecto relacionado
const recalculateBalances = require('../middlewares/recalculateBalances');

// ACTUALIZAR PORCENTAJES DE DISTRIBUCIÓN
exports.updateDistributionPercentages = async (req, res) => {
    try {
        const { userPercentages } = req.body;
        const { projectId } = req.params;
        // Verificar que el proyecto existe
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // Verificar que los porcentajes sumen 100
        const totalPercentage = userPercentages.reduce((acc, user) => acc + user.percentage, 0);
        if (totalPercentage !== 100) {
            return res.status(400).json({ message: 'La suma de los porcentajes debe ser igual a 100' });
        }

        // Actualizar los porcentajes de distribución de cada usuario en el proyecto
        for (const { userId, percentage } of userPercentages) {
            const userProject = await UserProject.findOne({
                where: {
                    id_project: projectId,
                    id_user: userId
                }
            });
            if (!userProject) {
                return res.status(404).json({ message: `El usuario con ID ${userId} no está asociado al proyecto` });
            }
            // Actualizar el porcentaje de distribución
            userProject.percentage = percentage;
            await userProject.save();
        }
        // Recalcular los balances después de actualizar los porcentajes
        await recalculateBalances(projectId);
        res.status(200).json({ message: 'Porcentajes de distribución actualizados con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar los porcentajes de distribución', error });
    }
};