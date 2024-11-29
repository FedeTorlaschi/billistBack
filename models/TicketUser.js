const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const TicketUser = sequelize.define('TicketUser', {
    TicketId: { // Clave foránea para Ticket
        type: DataTypes.INTEGER,
        allowNull: false, // Cambia a true si usas `ON DELETE SET NULL`
    },
    UserId: { // Clave foránea para User
        type: DataTypes.INTEGER,
        allowNull: false, // Cambia a true si usas `ON DELETE SET NULL`
    },
    contributionPercentage: {
        type: DataTypes.FLOAT, // Solo si la división es personalizada
        allowNull: true,
    },
    balance: {
        type: DataTypes.FLOAT, // Saldo del usuario en relación al ticket
        allowNull: false,
        defaultValue: 0,
    },
}, {
    timestamps: false, // Deshabilitar timestamps también aquí
});


module.exports = TicketUser;
