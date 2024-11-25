const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registrar un usuario
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validar si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const user = await User.create({ email, password: hashedPassword, name });

        res.status(201).json({ message: 'Usuario registrado exitosamente', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
};

// Iniciar sesión
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

        res.json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};
exports.updateProfile = async (req, res) => {
        try {
            const userId = req.user.id; // Obtenemos el ID del usuario autenticado del middleware
            const { email, name } = req.body;
    
            // Actualizar los datos del usuario
            const user = await User.findByPk(userId);
    
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
    
            user.email = email || user.email;
            user.name = name || user.name;
    
            await user.save();
    
            res.json({ message: 'Perfil actualizado con éxito', user });
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar el perfil', error });
        }
    };
    
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
    
            res.json({ message: 'Contraseña actualizada con éxito' });
        } catch (error) {
            res.status(500).json({ message: 'Error al cambiar la contraseña', error });
        }
    };
    exports.deleteAccount = async (req, res) => {
        try {
            const userId = req.user.id;
    
            // Validar el usuario
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
    
            await user.destroy();
    
            res.json({ message: 'Cuenta eliminada con éxito' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar la cuenta', error });
        }
    };
        

