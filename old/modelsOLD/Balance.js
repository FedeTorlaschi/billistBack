const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');


const Balance = sequelize.define('Balance', {
    id_project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Project,
            key: 'id'
        }
    },
    id_user_payer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    id_user_payed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0 // Inicia con 0
    }
});

// Relación de muchos a muchos con los usuarios (en ambos sentidos) y con el proyecto del contexto
Balance.belongsTo(User, { foreignKey: 'id_user_payer', as: 'Pagador' });
Balance.belongsTo(User, { foreignKey: 'id_user_payed', as: 'Pagado' });
Balance.belongsTo(Project, { foreignKey: 'id_project' });

module.exports = Balance;