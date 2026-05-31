// src/chat.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const prisma = new PrismaClient();

// Inicializamos Gemini (asegúrate de que el .env esté cargado en index.js)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/preguntar', async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({ error: "Debes enviar una pregunta." });
    }

    // 1. Extraemos los datos para la IA
    const ultimasMermas = await prisma.controlMerma.findMany({
      include: { producto: true },
      orderBy: { fecha_registro: 'desc' },
      take: 30
    });

    const datosContexto = JSON.stringify(ultimasMermas);

    // 2. Instrucciones para la IA
    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Eres el Asistente Analítico de IA del sistema ControlMerma para "Licores de Guatemala".
      Tu objetivo es responder las preguntas del administrador basándote ÚNICAMENTE en estos datos recientes de inventario y mermas:
      
      [DATOS DEL SISTEMA]:
      ${datosContexto}
      
      Reglas:
      - Responde de forma profesional, clara y directa.
      - Si te preguntan por números, haz los cálculos basándote en los datos proporcionados.
      - Si el usuario te pide enviar un reporte o correo, agrega al final de tu respuesta EXACTAMENTE esta palabra: [TRIGGER_EMAIL].
      
      Pregunta del administrador: "${pregunta}"
    `;

    // 3. Generamos respuesta
    const resultado = await modelo.generateContent(prompt);
    const respuestaIA = resultado.response.text();

    res.status(200).json({ respuesta: respuestaIA });

  } catch (error) {
    console.error("Error en el Agente IA:", error);
    res.status(500).json({ error: "El agente no pudo procesar la solicitud en este momento." });
  }
});

module.exports = router;