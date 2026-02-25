-- AlterTable ExternalAccount: add Stripe payout destination ID
ALTER TABLE "ExternalAccount" ADD COLUMN "stripeDestinationId" TEXT;
