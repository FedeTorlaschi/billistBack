const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Ticket = require('./Ticket');

const TicketUser = sequelize.define('TicketUser', {
    partial_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
});

Ticket.belongsToMany(User, { through: TicketUser });
User.belongsToMany(Ticket, { through: TicketUser });


// const TicketUser = sequelize.define('TicketUser', {
//     TicketId: { // Clave foránea para Ticket
//         type: DataTypes.INTEGER,
//         allowNull: false, // Cambia a true si usas `ON DELETE SET NULL`
//     },
//     UserId: { // Clave foránea para User
//         type: DataTypes.INTEGER,
//         allowNull: false, // Cambia a true si usas `ON DELETE SET NULL`
//     },
//     contributionPercentage: {
//         type: DataTypes.FLOAT, // Solo si la división es personalizada
//         allowNull: true,
//     },
//     balance: {
//         type: DataTypes.FLOAT, // Saldo del usuario en relación al ticket
//         allowNull: false,
//         defaultValue: 0,
//     },
// }, {
//     timestamps: false, // Deshabilitar timestamps también aquí
// });


module.exports = TicketUser;