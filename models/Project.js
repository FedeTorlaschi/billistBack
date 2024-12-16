const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const UserProject = require('./UserProject');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    distribution: {
        type: DataTypes.ENUM('equals', 'custom'),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

// Relación de muchos a muchos entre Project y User (un proyecto puede tener varios miembros)
// Project.belongsToMany(User, { through: UserProject });
// User.belongsToMany(Project, { through: UserProject });

module.exports = Project;