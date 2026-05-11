const express = require('express');
    const { PrismaClient } = require('@prisma/client');

    const router = express.Router();
    const prisma = new PrismaClient();

    // GET: Leer todos los productos (incluyendo su categoría)
    router.get('/', async (req, res) => {
      try {
        const productos = await prisma.producto.findMany({ 
          orderBy: { nombre: 'asc' },
          include: { categoria: true } // Vital para mostrar el nombre de la categoría en la tabla
        });
        res.status(200).json(productos);
      } catch (error) {
        res.status(500).json({ error: "Error al cargar productos." });
      }
    });

    // GET: Leer SOLO los productos activos (Para el formulario del empleado)
    router.get('/activos', async (req, res) => {
      try {
        const productosActivos = await prisma.producto.findMany({ 
          where: { activo: true }, // <-- Este es el filtro mágico
          orderBy: { nombre: 'asc' },
          include: { categoria: true } 
        });
        res.status(200).json(productosActivos);
      } catch (error) {
        res.status(500).json({ error: "Error al cargar productos activos." });
      }
    });

    // POST: Crear nuevo producto
    router.post('/', async (req, res) => {
      try {
        const nuevo = await prisma.producto.create({
          data: { nombre: req.body.nombre, id_categoria: parseInt(req.body.id_categoria) },
          include: { categoria: true }
        });
        res.status(201).json(nuevo);
      } catch (error) {
        res.status(500).json({ error: "Error al crear producto." });
      }
    });

    // PUT: Editar nombre y categoría
    router.put('/:id', async (req, res) => {
      try {
        const actualizado = await prisma.producto.update({
          where: { id: parseInt(req.params.id) },
          data: { nombre: req.body.nombre, id_categoria: parseInt(req.body.id_categoria) },
          include: { categoria: true }
        });
        res.status(200).json(actualizado);
      } catch (error) {
        res.status(500).json({ error: "Error al actualizar el producto." });
      }
    });

    // PATCH: Ocultar o Mostrar (Soft Delete)
    router.patch('/:id/estado', async (req, res) => {
      try {
        // 1. Buscamos el estado actual
        const producto = await prisma.producto.findUnique({ where: { id: parseInt(req.params.id) } });
        // 2. Lo invertimos (Si era true, pasa a false)
        const actualizado = await prisma.producto.update({
          where: { id: parseInt(req.params.id) },
          data: { activo: !producto.activo },
          include: { categoria: true }
        });
        res.status(200).json(actualizado);
      } catch (error) {
        res.status(500).json({ error: "Error al cambiar el estado del producto." });
      }
    });

    module.exports = router;