const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { enviarCorreoRecuperacion } = require('./email');
const { body, validationResult } = require('express-validator');
const { registrarBitacora } = require('./registrarBitacora');

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// MIDDLEWARE DE VALIDACIÓN REUTILIZABLE
// ==========================================

// Regla estricta: 8 caracteres, 1 Mayus, 1 Minus, 1 Especial
const passwordValidationRules = body('password')
  .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
  .matches(/[A-Z]/).withMessage('Debe incluir al menos una letra mayúscula.')
  .matches(/[a-z]/).withMessage('Debe incluir al menos una letra minúscula.')
  .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Debe incluir al menos un carácter especial.');

// Función para manejar los errores de express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

// ==========================================
// 1. CREATE: Crear usuario
// ==========================================
router.post('/', [
  body('nombre_completo').notEmpty().withMessage('El nombre es obligatorio.'),
  body('usuario').notEmpty().withMessage('El nombre de usuario es obligatorio.'),
  body('correo').isEmail().withMessage('Correo electrónico no válido.'),
  passwordValidationRules,
  validate
], async (req, res) => {
  try {
    const { nombre_completo, usuario, correo, password, rol } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre_completo, usuario, correo, password_hash: hashedPassword, rol }
    });

    const { password_hash, ...userSinPass } = nuevoUsuario;
    await registrarBitacora(nuevoUsuario.id, 'CREAR', 'usuarios', { nombre: nombre_completo, rol });
    res.status(201).json(userSinPass);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "El usuario o correo ya están registrados." });
    }
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ==========================================
// 2. READ ALL: Obtener todos los usuarios
// ==========================================
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre_completo: true,
        usuario: true,
        correo: true,
        rol: true
        // ← quita fecha_creacion si no está en tu schema
      }
    });
    res.json(usuarios);
    // Línea ~60, en router.get('/')
  } catch (error) {
    console.error("❌ ERROR DETALLADO:", error); // <-- agrega esto
    res.status(500).json({ error: "Error al obtener usuarios." });
  }
});

// ==========================================
// 3. READ ONE: Obtener por ID
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, nombre_completo: true, usuario: true, correo: true, rol: true }
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el usuario." });
  }
});

// ==========================================
// 4. UPDATE: Actualizar usuario
// ==========================================
router.put('/:id', [
  body('correo').optional().isEmail().withMessage('Correo no válido.'),
  body('password').optional().custom((value) => {
    if (value && value.trim() !== "") {
      // Aplicamos manualmente la lógica de complejidad si hay password nuevo
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!regex.test(value)) {
        throw new Error('La nueva contraseña no cumple con los requisitos de seguridad.');
      }
    }
    return true;
  }),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, usuario, correo, rol, password } = req.body;
    let dataUpdate = { nombre_completo, usuario, correo, rol };

    if (password && password.trim() !== "") {
      dataUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: dataUpdate
    });
    await registrarBitacora(parseInt(id), 'ACTUALIZAR', 'usuarios', { campos_actualizados: Object.keys(dataUpdate) });


    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario." });
  }
});

// ==========================================
// 5. DELETE: Eliminar usuario
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    await registrarBitacora(parseInt(req.params.id), 'ELIMINAR', 'usuarios', { id_eliminado: parseInt(req.params.id) });
    await prisma.usuario.delete({ where: { id: parseInt(req.params.id) } });
    
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    // ← agrega este if
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: "No se puede eliminar: el usuario tiene registros de mermas asociados."
      });
    }
    res.status(500).json({ error: "Error al eliminar usuario." });
  }
});

// ==========================================
// 6. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const userDB = await prisma.usuario.findUnique({ where: { usuario } });

    if (!userDB || !(await bcrypt.compare(password, userDB.password_hash))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    await registrarBitacora(userDB.id, 'LOGIN', 'usuarios', { usuario: userDB.usuario });
    res.json({
      token: "token-temporal-jwt",
      usuario: { id: userDB.id, nombre_completo: userDB.nombre_completo, rol: userDB.rol }
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================================
// 7. RECUPERACIÓN (Forgot & Reset)
// ==========================================
router.post('/forgot-password', async (req, res) => {
  const { usuario } = req.body;
  try {
    const userDB = await prisma.usuario.findFirst({
      where: { OR: [{ usuario }, { correo: usuario }] }
    });

    if (!userDB) return res.status(200).json({ message: "Proceso iniciado." });

    const token = crypto.randomInt(100000, 999999).toString();
    const expiracion = new Date(Date.now() + 3600000);

    await prisma.recuperacionPassword.create({
      data: { id_usuario: userDB.id, token, fecha_expiracion: expiracion, usado: false }
    });

    await enviarCorreoRecuperacion(userDB.correo, userDB.nombre_completo, token);
    res.json({ message: "Código enviado." });
  } catch (error) {
    res.status(500).json({ error: "Error de servidor." });
  }
});

router.post('/reset-password', [
  // Renombrado de password a nuevaPassword para coincidir con tu body
  body('nuevaPassword')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Falta mayúscula.')
    .matches(/[a-z]/).withMessage('Falta minúscula.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Falta carácter especial.'),
  validate
], async (req, res) => {
  const { token, nuevaPassword } = req.body;
  try {
    const registro = await prisma.recuperacionPassword.findFirst({
      where: { token, usado: false, fecha_expiracion: { gte: new Date() } }
    });

    if (!registro) return res.status(400).json({ error: "Código inválido o expirado." });

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: registro.id_usuario }, data: { password_hash: hashedPassword } }),
      prisma.recuperacionPassword.update({ where: { id: registro.id }, data: { usado: true } })
    ]);

    res.json({ message: "Contraseña actualizada." });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar contraseña." });
  }
});

module.exports = router;