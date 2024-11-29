const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TicketUser = require('./TicketUser');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING, // Guardará la URL de la imagen
        allowNull: true,
    },
    divisionType: {
        type: DataTypes.ENUM('equitativa', 'personalizada'),
        allowNull: false,
        defaultValue: 'equitativa',
    },
}, {
    timestamps: false,
});

Ticket.hasMany(TicketUser, { as: 'TicketUsers', foreignKey: 'TicketId' });
TicketUser.belongsTo(Ticket, { foreignKey: 'TicketId', onUpdate: 'CASCADE' });


module.exports = Ticket;