const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTRARSE
exports.signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        // Validar si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya está registrado' });
        }
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        // Crear el usuario
        const user = await User.create({ email, password: hashedPassword, username });
        res.status(201).json({ message: 'Usuario registrado exitosamente', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
};

// INICIAR SESIÓN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Buscar al usuario por correo
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Generar un token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

// MODIFICAR PERFIL
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.id; // Obtenemos el ID del usuario autenticado del middleware
        const { email, username } = req.body;
        // Actualizar los datos del usuario
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
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id; // Obtenemos el ID del usuario autenticado
        const { currentPassword, newPassword } = req.body;
        // Validar el usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Verificar la contraseña actual
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }
        // Hash de la nueva contraseña
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la contraseña', error });
    }
};

// ELIMINAR CUENTA
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;
        // Validar el usuario
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
            attributes: ['id', 'username', 'email'], // Solo devolver estos campos
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// OBTENER USUARIO POR SU EMAIL
exports.getUserByEmail = async (req, res) => {
    try {
        
        const { email } = req.query; // Email tomado como parámetro de consulta

        if (!email) {
            return res.status(400).json({ message: 'El parámetro email es obligatorio' });
        }

        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'username', 'email'],
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// OBTENER USUARIO POR SU USERNAME
exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.query; // Email tomado como parámetro de consulta
        if (!username) {
            return res.status(400).json({ message: 'El parámetro username es obligatorio' });
        }
        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'username', 'email'],
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al buscar usuario por username:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}