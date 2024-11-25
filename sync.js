const sequelize = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');

sequelize.sync({ force: true }) // Cambia a `{ alter: true }` en producción para actualizar sin perder datos
  .then(() => {
    console.log("Tablas sincronizadas correctamente.");
    process.exit(); // Finaliza el proceso una vez que termine la sincronización
  })
  .catch((error) => {
    console.error("Error al sincronizar las tablas:", error);
    process.exit(1); // Finaliza el proceso con un error
  });
