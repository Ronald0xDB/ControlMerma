// src/chat.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const prisma = new PrismaClient();


const { enviarReporteIA } = require('./email');

// Inicializamos Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/preguntar', async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({ error: "Debes enviar una pregunta." });
    }

    // 1. Extraemos los datos de todas las tablas en PARALELO para mayor velocidad
    const [mermas, productos, usuarios, bitacoras] = await Promise.all([
      
      // A. Mermas (Incluyendo el producto, su categoría, y quién lo registró)
      prisma.controlMerma.findMany({
        take: 30,
        orderBy: { fecha_registro: 'desc' },
        include: { 
          producto: { include: { categoria: true } },
          usuario: { 
            // SEGURIDAD: Solo traemos datos públicos, ignoramos password_hash
            select: { id: true, nombre_completo: true, rol: true } 
          }
        }
      }),

      // B. Catálogo completo de Productos y Categorías
      prisma.producto.findMany({
        include: { categoria: true }
      }),

      // C. Usuarios del sistema (Aplicando filtro de seguridad)
      prisma.usuario.findMany({
        select: {
          id: true,
          nombre_completo: true,
          usuario: true,
          correo: true,
          rol: true
        }
      }),

      // D. Últimas acciones en la Bitácora (Para que sepa quién hizo qué últimamente)
      prisma.bitacoraSistema.findMany({
        take: 20,
        orderBy: { fecha_hora: 'desc' },
        include: {
          usuario: { select: { id: true, nombre_completo: true } }
        }
      })
    ]);

    // 2. Unimos todo en un solo bloque de contexto
    const contextoGeneral = {
      historial_mermas: mermas,
      catalogo_productos: productos,
      usuarios_sistema: usuarios,
      auditoria_bitacora: bitacoras
    };

    const datosContexto = JSON.stringify(contextoGeneral);

    // 3. Instrucciones para la IA
    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Eres el Asistente Analítico de IA del sistema ControlMerma.
      Tu objetivo es responder las preguntas del administrador basándote ÚNICAMENTE en estos datos del sistema:
      
      [DATOS DEL SISTEMA]:
      ${datosContexto}
      
      Reglas:
      - Responde de forma profesional, clara y directa.
      - Si te preguntan por números, haz los cálculos basándote en los datos proporcionados.
      - Si el usuario te pide enviar un reporte por correo, extrae la dirección de correo que te haya escrito.
      - Si te pide enviar un correo, agrega al final de tu respuesta EXACTAMENTE este formato: [TRIGGER_EMAIL:correo_del_usuario@dominio.com]. 
      - Si te pide enviar un correo pero NO te escribe a qué dirección, usa por defecto "yairmatasakura@gmail.com".
      
      Pregunta del administrador: "${pregunta}"
    `;

    // 4. Generamos respuesta
    const resultado = await modelo.generateContent(prompt);
    let respuestaIA = resultado.response.text();
    let avisoCorreo = "";

    // ========================================================
    // 5. LA MAGIA: INTERCEPTAMOS LA ETIQUETA DINÁMICA
    // ========================================================
    
    // Buscamos si la IA generó una etiqueta con el formato [TRIGGER_EMAIL:loquesea@correo.com]
    const emailMatch = respuestaIA.match(/\[TRIGGER_EMAIL:(.*?)\]/);

    if (emailMatch) {
      // Extraemos el correo limpiando los espacios
      const correoDestino = emailMatch[1].trim(); 
      
      // Borramos la etiqueta completa para que no salga en la pantalla de React
      respuestaIA = respuestaIA.replace(emailMatch[0], '').trim();

      // Mandamos el correo a la dirección que la IA extrajo de la conversación
      await enviarReporteIA(correoDestino, respuestaIA);
      
      // Personalizamos el aviso para el frontend
      avisoCorreo = `\n\n📧 *El reporte detallado ha sido enviado a: ${correoDestino}*`;
    }

    // 6. Devolvemos la respuesta final a React
    res.status(200).json({ respuesta: respuestaIA + avisoCorreo });

  } catch (error) {
    console.error("Error en el Agente IA:", error);
    res.status(500).json({ error: "El agente no pudo procesar la solicitud en este momento." });
  }
});

module.exports = router;