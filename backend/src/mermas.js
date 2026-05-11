const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// 1. GET: Leer mermas (CON FILTRO DINÁMICO)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { id_usuario } = req.query; // Leemos el ID que manda React

    // Preparamos el filtro vacío por defecto
    let filtro = {}; 

    // Si React mandó un ID, aplicamos el filtro en Prisma
    if (id_usuario && id_usuario !== 'undefined' && id_usuario !== 'null') {
      filtro = {
        where: { id_usuario: parseInt(id_usuario) }
      };
    }

    const historial = await prisma.controlMerma.findMany({
      ...filtro, // Inyectamos el filtro mágico
      orderBy: { fecha_registro: 'desc' },
      include: {
        producto: true, 
        usuario: true
      }
    });
    
    res.status(200).json(historial);
  } catch (error) {
    console.error("Error GET mermas:", error);
    res.status(500).json({ error: "Error al cargar el historial." });
  }
});

// ==========================================
// 2. POST: Crear nueva merma
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { id_producto, id_usuario, inicial, final, merma, causa } = req.body;
    
    const nuevaMerma = await prisma.controlMerma.create({
      data: {
        id_producto,
        id_usuario,
        inventario_inicial: inicial,
        inventario_final: final,
        merma_calculada: merma,
        causa
      }
    });
    
    res.status(201).json(nuevaMerma);
  } catch (error) {
    console.error("Error POST merma:", error);
    res.status(500).json({ error: "No se pudo registrar la merma." });
  }
});

// POST: /api/mermas/bulk (NUEVO: Insertar varias mermas de golpe)
router.post('/bulk', async (req, res) => {
  try {
    const arregloMermas = req.body; // Recibimos el arreglo completo
    
    // Transformamos los datos para que Prisma los entienda
    const datosFormateados = arregloMermas.map(item => ({
      id_producto: item.id_producto,
      id_usuario: item.id_usuario,
      inventario_inicial: item.inicial,
      inventario_final: item.final,
      merma_calculada: item.merma,
      causa: item.causa,
      fecha_registro: new Date(item.fecha)
    }));

    // createMany inserta todo de un solo golpe
    const resultado = await prisma.controlMerma.createMany({
      data: datosFormateados
    });

    res.status(201).json({ message: `¡Éxito! Se insertaron ${resultado.count} registros.` });
  } catch (error) {
    console.error("Error bulk:", error);
    res.status(500).json({ error: "Error al insertar datos masivos." });
  }
});


module.exports = router;