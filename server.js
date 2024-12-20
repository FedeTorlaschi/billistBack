const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db'); // Conexión a la base de datos

// Importar modelos y rutas
const index = require('./models/index');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const billRoutes = require('./routes/bill');
const tokenRoutes = require('./routes/token'); // Nueva ruta para validar token

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Parseo de JSON
app.use(express.urlencoded({ extended: true })); // Necesario para datos enviados por formularios

// Rutas
app.use('/user', userRoutes);
app.use('/project', projectRoutes);
app.use('/bill', billRoutes);
app.use('/api', tokenRoutes); // Nueva ruta para validar token

const PORT = process.env.PORT || 3001;

// Sincronización de la base de datos
sequelize
    .sync()
    .then(() => {
        console.log('Base de datos conectada');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.log('Error al conectar la base de datos:', err));