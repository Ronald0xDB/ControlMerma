const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();
const SECRET_KEY = "LiquorFlow_Secreto_Super_Seguro_2026";

// POST: /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    const userDB = await prisma.usuario.findUnique({
      where: { usuario: usuario }
    });

    if (!userDB) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const passwordValida = await bcrypt.compare(password, userDB.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: userDB.id, rol: userDB.rol, nombre: userDB.nombre_completo },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      mensaje: "Login exitoso",
      token: token,
      usuario: {
        id: userDB.id,
        nombre: userDB.nombre_completo,
        rol: userDB.rol
      }
    });

  } catch (error) {
    console.error("Error en el Login:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;