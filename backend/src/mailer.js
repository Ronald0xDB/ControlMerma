/**
 * Función para enviar el análisis generado por la IA al administrador.
 * @param {string} emailDestino - El correo de quien recibe el reporte.
 * @param {string} analisisIA - El texto generado por Gemini.
 */
const enviarReporteIA = async (emailDestino, analisisIA) => {
  try {
    const mensajeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4c5b9; border-radius: 10px; background-color: #fcfcfc;">
        
        <h2 style="color: #4a3f35; text-align: center; border-bottom: 2px solid #006a71; padding-bottom: 10px;">
          Control<span style="color: #006a71;">MErma</span> Analytics 🤖
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
      subject: " Reporte Analítico de Mermas (IA)", 
      html: mensajeHtml, 
    });

    console.log(`Reporte de IA enviado a ${emailDestino}. ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error("Error al enviar el reporte de IA:", error);
  }
};


module.exports = {
  enviarCorreoRecuperacion,
  enviarReporteIA 
};