// email.js
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
 * Función 1: Enviar el correo de recuperación de contraseña.
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
      from: '"Soporte ControlMerma" <yairmatasakura@gmail.com>', 
      to: emailDestino, 
      subject: "Restablecer tu contraseña", 
      html: mensajeHtml, 
    });

    console.log(`Correo enviado correctamente a ${emailDestino}. ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
    throw error; 
  }
};

/**
 * Función 2: Enviar el análisis generado por la IA al administrador.
 */
const enviarReporteIA = async (emailDestino, analisisIA) => {
  try {
    const mensajeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4c5b9; border-radius: 10px; background-color: #fcfcfc;">
        <h2 style="color: #4a3f35; text-align: center; border-bottom: 2px solid #006a71; padding-bottom: 10px;">
          Control<span style="color: #006a71;">Merma</span> Analytics 🤖
        </h2>
        <p style="color: #4a3f35; font-size: 16px;">Se ha solicitado un nuevo análisis de inventario y mermas:</p>
        
        <div style="background-color: #ecf4f3; padding: 20px; border-radius: 8px; margin: 20px 0; color: #006a71; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
          ${analisisIA}
        </div>
        
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          Este reporte fue generado automáticamente por la Inteligencia Artificial del sistema.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"IA ControlMerma" <yairmatasakura@gmail.com>', 
      to: emailDestino, 
      subject: "📊 Reporte Analítico de Mermas (IA)", 
      html: mensajeHtml, 
    });

    console.log(`Reporte de IA enviado a ${emailDestino}. ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error("Error al enviar el reporte de IA:", error);
  }
};

// Exportamos ambas funciones al final
module.exports = {
  enviarCorreoRecuperacion,
  enviarReporteIA 
};