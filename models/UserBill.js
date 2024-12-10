const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Bill = require('./Bill');

const UserBill = sequelize.define('UserBill', {
    partial_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
});

// Bill.belongsToMany(User, { through: UserBill });
// User.belongsToMany(Bill, { through: UserBill });

module.exports = UserBill;