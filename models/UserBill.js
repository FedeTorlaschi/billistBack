const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Bill = require('./Bill');

const UserBill = sequelize.define('UserBill', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type:
        DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    id_bill: {
        type: DataTypes.INTEGER,
        references: {
            model: Bill,
            key: 'id'
        }
    },
    partial_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
});

// Bill.belongsToMany(User, { through: UserBill });
// User.belongsToMany(Bill, { through: UserBill });

module.exports = UserBill;