const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

let transporter;

(async () => {
    // Importar dinámicamente el módulo
    const { default: hbs } = await import('nodemailer-express-handlebars');

    // Configuración de transporte
    transporter = nodemailer.createTransport({
        service: 'gmail', // Cambia el servicio si usas otro proveedor
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Configuración de Handlebars como motor de plantillas
    transporter.use(
        'compile',
        hbs({
            viewEngine: {
                extname: '.hbs',
                partialsDir: path.resolve('./templates/emails'),
                layoutsDir: path.resolve('./templates/emails'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./templates/emails'),
            extName: '.hbs',
        })
    );
})();

const sendTemplateEmail = async (to, subject, template, context) => {
    try {
        // Asegurarse de que el transporter esté configurado antes de enviar correos
        if (!transporter) {
            throw new Error('Transporter no configurado todavía.');
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            template, // Nombre del archivo de plantilla (sin extensión)
            context,  // Variables para la plantilla
        });
        console.log(`Correo enviado a ${to}`);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
};

module.exports = { sendTemplateEmail };
