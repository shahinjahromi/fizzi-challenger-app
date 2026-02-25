-- AlterTable User: add business address fields
ALTER TABLE "User" ADD COLUMN "businessAddressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN "businessAddressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN "businessCity" TEXT;
ALTER TABLE "User" ADD COLUMN "businessState" TEXT;
ALTER TABLE "User" ADD COLUMN "businessPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN "businessCountry" TEXT;

-- AlterTable Account: add accountNumber and routingNumber (backfill existing rows then set NOT NULL)
ALTER TABLE "Account" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "Account" ADD COLUMN "routingNumber" TEXT;

UPDATE "Account" SET "accountNumber" = "id", "routingNumber" = '021000021' WHERE "accountNumber" IS NULL;

ALTER TABLE "Account" ALTER COLUMN "accountNumber" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "routingNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Account_accountNumber_key" ON "Account"("accountNumber");
