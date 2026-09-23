-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'DONE');

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "id_commitment" TEXT;

-- CreateTable
CREATE TABLE "commitment" (
    "id" TEXT NOT NULL,
    "id_family" TEXT NOT NULL,
    "id_category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "total_installments" INTEGER NOT NULL,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "due_day" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commitment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commitment_id_family_idx" ON "commitment"("id_family");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_id_commitment_fkey" FOREIGN KEY ("id_commitment") REFERENCES "commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_id_family_fkey" FOREIGN KEY ("id_family") REFERENCES "family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
