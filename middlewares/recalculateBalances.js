const { Op } = require('sequelize');
const Balance = require('../models/Balance');
const UserProject = require('../models/UserProject');
const Bill = require('../models/Bill');
const User = require('../models/User');

// FUNCION PARA RECALCULAR LOS BALANCES DE UN PROYECTO
const recalculateBalances = async (projectId) => {
    try {
        // 1. Obtener todos los usuarios del proyecto
        const users = await User.findAll({
            include: {
                model: Project,
                where: { id: projectId },
                through: { attributes: ['percentage'] }, // Incluir el porcentaje de cada usuario
            }
        });
        // 2. Obtener el total de gastos del proyecto
        const bills = await Bill.findAll({ where: { project_id: projectId } });
        const totalAmount = bills.reduce((acc, bill) => acc + bill.total_amount, 0);
        // 3. Recalcular el balance de cada usuario con el resto
        for (const user of users) {
            const userPercentage = user.UserProject.percentage / 100;  // Convertir porcentaje a decimal
            const userTotalContribution = totalAmount * userPercentage;  // Lo que debe aportar el usuario
            // Recorrer todos los demás usuarios para actualizar el balance
            for (const otherUser of users) {
                if (user.id !== otherUser.id) {
                    const otherUserPercentage = otherUser.UserProject.percentage / 100;  // Porcentaje del otro usuario
                    const otherUserTotalContribution = totalAmount * otherUserPercentage;  // Lo que debe aportar el otro usuario
                    // Buscar si ya existe un balance entre estos dos usuarios
                    let balance = await Balance.findOne({
                        where: {
                            id_project: projectId,
                            [Op.or]: [
                                { id_user_payer: user.id, id_user_payed: otherUser.id },
                                { id_user_payer: otherUser.id, id_user_payed: user.id },
                            ]
                        }
                    });
                    if (!balance) {
                        // Si no existe, crear el balance en 0
                        await Balance.create({
                            id_project: projectId,
                            id_user_payer: user.id,
                            id_user_payed: otherUser.id,
                            amount: 0
                        });
                    }
                    // Calculamos el balance entre los dos usuarios
                    // Si el usuario A debe más que el usuario B, el balance es positivo en el sentido A -> B
                    // Si el usuario B debe más, el balance es negativo en el sentido B -> A
                    const balanceAmount = userTotalContribution - otherUserTotalContribution;
                    
                    if (balanceAmount > 0) {
                        // El usuario 'user' debe más, por lo que el balance será positivo
                        await Balance.update({ amount: balanceAmount }, {
                            where: {
                                id_project: projectId,
                                id_user_payer: user.id,
                                id_user_payed: otherUser.id
                            }
                        });
                    } else if (balanceAmount < 0) {
                        // El usuario 'otherUser' debe más, por lo que el balance será negativo
                        await Balance.update({ amount: balanceAmount }, {
                            where: {
                                id_project: projectId,
                                id_user_payer: otherUser.id,
                                id_user_payed: user.id
                            }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error recalculando los balances:', error);
        throw new Error('Error recalculando los balances');
    }
};

module.exports = recalculateBalances;