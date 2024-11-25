const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Asegúrate de importar tu conexión de base de datos
const User = require('./User'); // Importamos el modelo de Usuario

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

module.exports = Project;
