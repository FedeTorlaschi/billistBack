const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');

const UserProject = sequelize.define('UserProject', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    id_project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Projects',
            key: 'id'
        }
    },
    percentage: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
});

// Project.belongsToMany(User, { through: UserProject });
// User.belongsToMany(Project, { through: UserProject });

module.exports = UserProject;