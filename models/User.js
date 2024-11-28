const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Ticket = require('./Ticket');
const TicketUser = require('./TicketUser');


const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
});



User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
User.belongsToMany(Ticket, { through: TicketUser });
Ticket.belongsToMany(User, { through: TicketUser });
TicketUser.belongsTo(User, { foreignKey: 'UserId' });


module.exports = User;