/**
 * Nymbus Processor Integration Routes
 *
 * Exposes the Nymbus BaaS sandbox operations through the Fizzi API,
 * allowing the Angular front-end (or curl) to interact with Nymbus.
 */

import { Router } from 'express';
import { asyncHandler } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import * as nymbus from '../services/nymbusService.js';

const router = Router();

// ── List Nymbus customers ─────────────────────────────────────────────────────
router.get(
  '/customers',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const result = await nymbus.listCustomers();
    res.json(result);
  }),
);

// ── Create Nymbus customer ────────────────────────────────────────────────────
router.post(
  '/customers',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.createCustomer(req.body);
    res.status(201).json(result);
  }),
);

// ── List accounts for a Nymbus customer ───────────────────────────────────────
router.get(
  '/customers/:customerId/accounts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.getCustomerAccounts(req.params['customerId']!);
    res.json(result);
  }),
);

// ── Create account for a Nymbus customer ──────────────────────────────────────
router.post(
  '/customers/:customerId/accounts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.createAccount(
      req.params['customerId']!,
      req.body,
    );
    res.status(201).json(result);
  }),
);

// ── Internal transfer (book-to-book on Nymbus) ───────────────────────────────
router.post(
  '/transfers/internal',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.createInternalTransfer(req.body);
    res.status(201).json(result);
  }),
);

// ── External transfer (ACH via Nymbus) ────────────────────────────────────────
router.post(
  '/transfers/external',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.createExternalTransfer(req.body);
    res.status(201).json(result);
  }),
);

// ── List Nymbus accounts (by customerIds or accountIds) ───────────────────────
router.get(
  '/accounts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await nymbus.listAccounts({
      customerIds: req.query['customerIds'] as string | undefined,
      accountIds: req.query['accountIds'] as string | undefined,
      pageLimit: req.query['pageLimit']
        ? Number(req.query['pageLimit'])
        : undefined,
    });
    res.json(result);
  }),
);

export default router;
