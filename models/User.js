const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');
const UserProject = require('./UserProject');
const Bill = require('./Bill');
const UserBill = require('./UserBill');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
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
// Project.belongsToMany(User, { through: UserProject });
// User.belongsToMany(Project, { through: UserProject });
// Relación de muchos a muchos entre Bills y User (un usuario puede tener varios gastos)
// Bill.belongsToMany(User, { through: UserBill });
// User.belongsToMany(Bill, { through: UserBill });

module.exports = User;