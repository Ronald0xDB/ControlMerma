const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET — Obtener todos los registros de bitácora
router.get('/', async (req, res) => {
  try {
    const registros = await prisma.bitacoraSistema.findMany({
      orderBy: { fecha_hora: 'desc' },
      take: 200,
      include: {
        usuario: {
          select: { nombre_completo: true, usuario: true }
        }
      }
    });
    res.json(registros);
  } catch (error) {
    console.error('Error bitácora:', error);
    res.status(500).json({ error: 'Error al obtener bitácora.' });
  }
});

module.exports = router;