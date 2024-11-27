const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 
const User = require('./User'); 
const Ticket = require('./Ticket');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: false
});

// Relación de muchos a muchos entre Project y User (un proyecto puede tener varios miembros)
Project.belongsToMany(User, { through: 'UserProjects' });
User.belongsToMany(Project, { through: 'UserProjects' });

// Relación uno a muchos entre project y ticket
Project.hasMany(Ticket, { foreignKey: 'projectId', as: 'tickets' });
Ticket.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = Project;
