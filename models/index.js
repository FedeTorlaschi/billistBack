// models/index.js
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');
const UserProject = require('./UserProject');
const Bill = require('./Bill');
const UserBill = require('./UserBill');
const Balance = require('./Balance');

// Relación de muchos a muchos entre Project y User (un usuario puede tener varios proyectos y un proyecto puede tener varios miembros)
Project.belongsToMany(User, { through: UserProject });
User.belongsToMany(Project, { through: UserProject });
// Relación de muchos a muchos entre Bills y User (un usuario puede tener varios gastos y un gasto puede ser pagado por varios usuarios)
Bill.belongsToMany(User, { through: UserBill });
User.belongsToMany(Bill, { through: UserBill });
// Relación de muchos a muchos entre Project y Bill (un proyecto puede tener muchos gastos)
Bill.belongsTo(Project, { foreignKey: 'id_project' });
// Relación de muchos a muchos con los usuarios (en ambos sentidos) y con el proyecto del contexto
Balance.belongsTo(User, { foreignKey: 'id_user_payer', as: 'payer' });
Balance.belongsTo(User, { foreignKey: 'id_user_payed', as: 'payed' });
Balance.belongsTo(Project, { foreignKey: 'id_project' });


module.exports = {
    sequelize,
    User,
    Project,
    UserProject,
    Bill,
    UserBill
};