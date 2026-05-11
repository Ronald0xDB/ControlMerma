-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_mermas" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "inventario_inicial" DECIMAL(10,2) NOT NULL,
    "inventario_final" DECIMAL(10,2) NOT NULL,
    "merma_calculada" DECIMAL(10,2) NOT NULL,
    "causa" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_mermas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recuperacion_password" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recuperacion_password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_sistema" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "tabla_afectada" TEXT NOT NULL,
    "detalles" JSONB,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "recuperacion_password_token_key" ON "recuperacion_password"("token");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_mermas" ADD CONSTRAINT "control_mermas_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_mermas" ADD CONSTRAINT "control_mermas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacion_password" ADD CONSTRAINT "recuperacion_password_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_sistema" ADD CONSTRAINT "bitacora_sistema_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
