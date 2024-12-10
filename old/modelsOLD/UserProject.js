const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');

const UserProjects = sequelize.define('UserProjects', {
    percentage: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
});

Project.belongsToMany(User, { through: UserProjects });
User.belongsToMany(Project, { through: UserProjects });

module.exports = UserProjects;