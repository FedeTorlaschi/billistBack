const { UserProject, Bill, UserBill, Balance } = require('../models');

/**
 * Recalcula los balances de un proyecto actualizando los registros existentes en la tabla Balance.
 * @param {number} projectId - ID del proyecto cuyos balances se recalcularán.
 */
const recalculateBalances = async (projectId) => {
    try {
        // Obtener los usuarios del proyecto y sus porcentajes
        const userProjects = await UserProject.findAll({
            where: { id_project: projectId },
            attributes: ['id_user', 'percentage']
        });

        if (!userProjects.length) {
            throw new Error('No hay usuarios en este proyecto.');
        }

        const users = userProjects.map(up => ({
            id_user: up.id_user,
            percentage: up.percentage / 100 // Convertir porcentaje a decimal
        }));

        // Obtener todos los gastos del proyecto y calcular el total gastado
        const bills = await Bill.findAll({
            where: { id_project: projectId },
            include: {
                model: UserBill,
                attributes: ['id_user', 'partial_amount']
            }
        });

        const totalSpent = bills.reduce((sum, bill) => {
            return sum + bill.UserBills.reduce((subSum, ub) => subSum + ub.partial_amount, 0);
        }, 0);

        // Calcular el balance de cada usuario respecto al total
        const userBalances = users.map(user => {
            const shouldPay = user.percentage * totalSpent; // Lo que le corresponde pagar
            const alreadyPaid = bills.reduce((sum, bill) => {
                const userBill = bill.UserBills.find(ub => ub.id_user === user.id_user);
                return sum + (userBill ? userBill.partial_amount : 0);
            }, 0);

            return {
                id_user: user.id_user,
                net_balance: shouldPay - alreadyPaid // Saldo neto (positivo si debe, negativo si pagó de más)
            };
        });

        // Actualizar los registros en la tabla Balance
        for (const payer of userBalances) {
            for (const payee of userBalances) {
                if (payer.id_user !== payee.id_user) {
                    const amount = (payer.net_balance - payee.net_balance) / (users.length - 1);

                    await Balance.update(
                        { amount },
                        {
                            where: {
                                id_project: projectId,
                                id_user_payer: payer.id_user,
                                id_user_payed: payee.id_user
                            }
                        }
                    );
                }
            }
        }

        console.log(`Balances del proyecto ${projectId} recalculados correctamente.`);
    } catch (error) {
        console.error('Error al recalcular los balances:', error.message);
        throw error;
    }
};

module.exports = recalculateBalances;