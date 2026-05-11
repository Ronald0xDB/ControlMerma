const nodemailer = require('nodemailer');

// 1. Configuración del "Transportador" para GMAIL
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",     
  port: 465,               
  secure: true,             
  auth: {
    user: process.env.EMAIL_USER || "yairmatasakura@gmail.com", 
    pass: process.env.EMAIL_PASS || "royt qcar lduz melt" 
  }
});

/**
 * Función para enviar el correo de recuperación de contraseña.
 * @param {string} emailDestino - El correo del usuario.
 * @param {string} nombre - El nombre del usuario para saludarlo.
 * @param {string} token - El código de 6 dígitos.
 */
const enviarCorreoRecuperacion = async (emailDestino, nombre, token) => {
  try {
    const mensajeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4c5b9; border-radius: 10px; background-color: #fcfcfc;">
        
        <h2 style="color: #4a3f35; text-align: center; border-bottom: 2px solid #c86b53; padding-bottom: 10px;">
          Control<span style="color: #c86b53;">Merma</span>
        </h2>
        
        <p style="color: #4a3f35; font-size: 16px;">Hola, <strong>${nombre}</strong>:</p>
        
        <p style="color: #68b0ab; font-size: 15px; line-height: 1.5;">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema de control de inventario.
        </p>
        
        <div style="background-color: #f5efe6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4a3f35; font-size: 14px; text-transform: uppercase; font-weight: bold;">Tu Código de Recuperación es:</p>
          <h1 style="color: #c86b53; letter-spacing: 5px; margin: 10px 0;">${token}</h1>
        </div>
        
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          Si no solicitaste este cambio, puedes ignorar este correo con seguridad. Este código expirará en 1 hora.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      // CAMBIO IMPORTANTE: Gmail requiere que el "from" coincida con la cuenta que autentica
      from: '"Soporte LiquorFlow" <yairmatasakura@gmail.com>', 
      to: emailDestino, 
      subject: "Restablecer tu contraseña", 
      html: mensajeHtml, 
    });

    console.log(`Correo enviado correctamente a ${emailDestino}. ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error("Error al enviar el correo:", error);
    // IMPORTANTE: Tirar el error hacia arriba para que la ruta lo capture si es necesario
    throw error; 
  }
};

module.exports = {
  enviarCorreoRecuperacion
};