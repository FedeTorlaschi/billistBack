const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketUser = sequelize.define('TicketUser', {
    contributionPercentage: {
        type: DataTypes.FLOAT, // Solo si la división es personalizada
        allowNull: true,
    },
    balance: {
        type: DataTypes.FLOAT, // Saldo del usuario en relación al ticket
        allowNull: false,
        defaultValue: 0,
    },
});

module.exports = TicketUser;
