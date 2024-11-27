const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Ticket = require('./Ticket');


const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
});



User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });


module.exports = User;