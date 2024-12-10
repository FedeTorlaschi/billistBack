const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');
const User = require('./User');
const UserBill = require('./UserBill');

const Bill = sequelize.define('Bill', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    id_project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Project,  // Nombre del modelo de Projects
            key: 'id'        // Campo al que hace referencia
        }
    },
    image: {
        type: DataTypes.STRING, // guarda la URL de la imagen
        allowNull: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

// Relación de muchos a muchos entre Project y Bill (un proyecto puede tener muchos gastos)
// Bill.belongsTo(Project, { foreignKey: 'id_project' });
// Relación de muchos a muchos entre Bill y User (un gasto puede ser pagado por varios usuarios)
// Bill.belongsToMany(User, { through: UserBill });
// User.belongsToMany(Bill, { through: UserBill });

module.exports = Bill;