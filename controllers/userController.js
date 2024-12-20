const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTRARSE
exports.signup = async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body); // Verifica qué datos llegan
        const { username, email, password } = req.body;
        // validar si el usuario ya existe
        const existingUserByEmail = await User.findOne({ where: { email } });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'La dirección email ya está en uso' });
        }
        const existingUserByUsername = await User.findOne({ where: { username } });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
        // hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        // crear el usuario
        const user = await User.create({ username, email, password: hashedPassword });
        res.status(201).json({ message: 'Usuario registrado exitosamente', user });
    } catch (error) {
        console.error('Error en signup:', error); // Agrega esta línea
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
};

// INICIAR SESIÓN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // buscar al usuario por correo
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // generar un token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

// MODIFICAR PERFIL
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.id; // obtenemos el ID del usuario autenticado del middleware
        const { username, email } = req.body;
        // actualizar los datos del usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        user.email = email || user.email;
        user.username = username || user.username;
        await user.save();
        res.status(200).json({ message: 'Perfil actualizado con éxito', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el perfil', error });
    }
};

// CAMBIAR CONTRASEÑA
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id; // obtenemos el ID del usuario autenticado
        const { newPassword } = req.body;
        // const { currentPassword, newPassword } = req.body;
        // validar el usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // verificar la contraseña actual
        // const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        // if (!isPasswordValid) {
        //     return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        // }

        // hash de la nueva contraseña
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la contraseña', error });
    }
};

// ELIMINAR CUENTA EN SESIÓN
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;
        // validar el usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        await user.destroy();
        res.status(200).json({ message: 'Cuenta eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cuenta', error });
    }
};

// OBTENER USUARIO POR SU ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params; // ID tomado como parámetro de ruta
        if (!id) {
            return res.status(400).json({ message: 'El parámetro id es obligatorio' });
        }
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'email'] // solo devolver estos campos
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        // console.error('Error al buscar usuario por ID', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// OBTENER USUARIO POR SU EMAIL
exports.getUserByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'El parámetro email es obligatorio' });
        }
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'username', 'email']
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al buscar usuario por email', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// OBTENER USUARIO POR SU USERNAME
exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'El parámetro username es obligatorio' });
        }
        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'username', 'email']
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al buscar usuario por username', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// OBTENER LOS "AMIGOS" DEL USUARIO EN SESIÓN (todos los integrantes de todos los proyectos en los que está el usuario en sesión, una vez sola)
exports.getFriends = async (req, res) => {
    try {
        // Validar que req.user.id exista y sea válido
        const userId = req.user.id;

        if (!userId || typeof userId !== 'number') {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        // Consultar todos los usuarios únicos asociados a los proyectos del usuario
        const members = await User.findAll({
            attributes: ['username', 'email'],
            include: {
                model: Project,
                attributes: [], // No traer atributos de proyectos
                through: { attributes: [] }, // Ignorar atributos de UserProject
                where: { '$Projects.Users.id$': userId } // Filtrar proyectos del usuario en sesión
            },
            distinct: true // Evitar duplicados
        });

        if (!members.length) {
            return res.status(404).json({ message: 'No se encontraron integrantes en los proyectos del usuario.' });
        }

        // Formatear la respuesta
        const formattedMembers = members.map(member => ({
            username: member.username,
            email: member.email
        }));

        res.status(200).json(formattedMembers);
    } catch (error) {
        console.error('Error al obtener los integrantes de los proyectos:', error.message);
        res.status(500).json({ message: 'Error al obtener los integrantes de los proyectos.', error });
    }
};

const existsUserInList = (userId, list) => {
    let exists = false;
    for (const user of list) {
        if (user.id===userId) {
            exists = true;
            break;
        }
    }
    return exists;
};