const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');

const UserProject = sequelize.define('UserProject', {
    percentage: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
});

// Project.belongsToMany(User, { through: UserProject });
// User.belongsToMany(Project, { through: UserProject });

module.exports = UserProject;