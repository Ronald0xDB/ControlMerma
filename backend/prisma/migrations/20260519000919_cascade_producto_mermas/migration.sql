-- DropForeignKey
ALTER TABLE "control_mermas" DROP CONSTRAINT "control_mermas_id_producto_fkey";

-- AddForeignKey
ALTER TABLE "control_mermas" ADD CONSTRAINT "control_mermas_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
