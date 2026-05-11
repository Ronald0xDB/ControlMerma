const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const registrarBitacora = async (id_usuario, accion, tabla_afectada, detalles = null) => {
  try {
    await prisma.bitacoraSistema.create({
      data: {
        id_usuario,
        accion,
        tabla_afectada,
        detalles
      }
    });
  } catch (error) {
    // No bloqueamos la operación principal si falla el log
    console.error('Error al registrar bitácora:', error);
  }
};

module.exports = { registrarBitacora };