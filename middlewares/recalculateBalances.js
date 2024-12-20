const { where } = require('sequelize');
const { UserProject, Bill, UserBill, Balance } = require('../models');

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

        // Obtener todas las facturas asociadas al proyecto
        const bills = await Bill.findAll({
            where: { id_project: projectId },
            attributes: ['total_amount'] // Solo necesitamos el total de cada factura
        });

        // Calcular el total gastado sumando los montos de las facturas
        const totalSpent = bills.reduce((sum, bill) => sum + bill.total_amount, 0);

        console.log(`En total se gastó $${totalSpent}`);

        // Calcular el balance de cada usuario respecto al total
        let userBalances = [];
        for (const user of users) {
            const shouldPay = totalSpent * user.percentage;

            // Obtener los pagos realizados por el usuario
            const userBillsForUser = await UserBill.findAll({
                where: { id_user: user.id_user },
                attributes: ['partial_amount']
            });

            const alreadyPaid = userBillsForUser.reduce(
                (sum, bill) => sum + (bill.partial_amount || 0),
                0
            );

            const left = shouldPay - alreadyPaid;

            console.log(`El usuario ${user.id_user} debe pagar $${shouldPay}, ya pagó $${alreadyPaid}, y debe en total $${left}.`);

            userBalances.push({
                id_user: user.id_user,
                owes: left
            });
        }

        // Obtener cuántas personas deben y a cuántas personas se les debe
        let amountPayees = 0; // a cuántos se les debe
        let amountPayers = 0; // cuántos deben
        for (const member of userBalances) {
            if (member.owes>0) {
                amountPayers = amountPayers + 1;
            } else if (member.owes<0) {
                amountPayees = amountPayees + 1;
            }
        };
        // Actualizar los registros en la tabla Balance
        for (const payer of userBalances) {
            for (const payee of userBalances) {
                if (payer.id_user !== payee.id_user) {
                    let amount;
                    if ((payer.owes<0 && payee.owes<0) || (payer.owes>0 && payee.owes>0)) {
                        amount = 0;
                    } else {
                        if (payer.owes>0) {
                            amount = Math.abs(payee.owes)/amountPayers;
                        } else if (payer.owes<0) {
                            amount = payer.owes/amountPayees;
                        } else {
                            amount = 0;
                        }
                    }
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