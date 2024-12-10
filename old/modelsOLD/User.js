const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');
const UserProject = require('./UserProject');
const Ticket = require('./Ticket');
const TicketUser = require('./TicketUser');


const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Relación de muchos a muchos entre Project y User (un usuario puede tener varios proyectos)
Project.belongsToMany(User, { through: UserProject });
User.belongsToMany(Project, { through: UserProject });
// Relación de muchos a muchos entre Bills y User (un usuario puede tener varios gastos)
Ticket.belongsToMany(User, { through: TicketUser });
User.belongsToMany(Ticket, { through: TicketUser });

// User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
// User.belongsToMany(Ticket, { through: TicketUser });
// Ticket.belongsToMany(User, { through: TicketUser });
// TicketUser.belongsTo(User, { foreignKey: 'UserId' });


module.exports = User;