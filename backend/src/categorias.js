const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET: Leer todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { id: 'asc' } });
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar categorías." });
  }
});

// POST: Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const nueva = await prisma.categoria.create({ data: { nombre: req.body.nombre } });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear categoría." });
  }
});

// PUT: Actualizar una categoría
router.put('/:id', async (req, res) => {
  try {
    const actualizada = await prisma.categoria.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre: req.body.nombre }
    });
    res.status(200).json(actualizada);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la categoría." });
  }
});

// DELETE: Eliminar una categoría
router.delete('/:id', async (req, res) => {
  try {
    await prisma.categoria.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send(); // 204 significa "Sin contenido" (Éxito al borrar)
  } catch (error) {
    // Si da error, probablemente es porque tiene productos asociados
    res.status(400).json({ error: "No se puede eliminar. Asegúrate de que no tenga productos asociados." });
  }
});

module.exports = router;