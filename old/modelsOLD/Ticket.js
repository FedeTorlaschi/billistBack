const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');
const User = require('./User');
const TicketUser = require('./TicketUser');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Project,  // Nombre del modelo de Projects
            key: 'id'        // Campo al que hace referencia
        }
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING, // Guardará la URL de la imagen
        allowNull: true,
    },
    // divisionType: {
    //     type: DataTypes.ENUM('equitativa', 'personalizada'),
    //     allowNull: false,
    //     defaultValue: 'equitativa',
    // },
}, {
    timestamps: false,
});

// Relación de muchos a muchos entre Project y User (un usuario puede tener varios proyectos)
Ticket.belongsTo(Project, { foreignKey: 'id_project' });
// Relación de muchos a muchos entre Bills y User (un gasto puede ser pagado por varios usuarios)
Ticket.belongsToMany(User, { through: TicketUser });
User.belongsToMany(Ticket, { through: TicketUser });

// Ticket.hasMany(TicketUser, { as: 'TicketUsers', foreignKey: 'TicketId' });
// TicketUser.belongsTo(Ticket, { foreignKey: 'TicketId', onUpdate: 'CASCADE' });


module.exports = Ticket;