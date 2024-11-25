const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db'); // Conexión a la base de datos
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Parseo de JSON

// Rutas
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3001;

// Sincronización de la base de datos
sequelize.sync().then(() => {
    console.log('Base de datos conectada');
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => console.log('Error al conectar la base de datos:', err));