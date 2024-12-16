const { Sequelize, Op } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Configuración de la base de datos
const sequelize = new Sequelize(
    process.env.DB_NAME,    // Nombre de la base de datos
    process.env.DB_USER,    // Usuario
    process.env.DB_PASSWORD, // Contraseña
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
    }
);

module.exports = sequelize, Op;