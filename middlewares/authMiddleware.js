const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // El token debe estar en el formato "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
    }

    try {
        // Verifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); 
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado', error });
    }
};

module.exports = authenticateToken;