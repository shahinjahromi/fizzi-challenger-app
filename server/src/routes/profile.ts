import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { validateBody } from '../middleware/validateBody'
import { getProfile, updateProfile, changePassword, UpdateProfileBody } from '../services/profileService'

const router = Router()
router.use(authenticate)

const updateProfileSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  businessAddressLine1: z.string().max(200).nullable().optional(),
  businessAddressLine2: z.string().max(200).nullable().optional(),
  businessCity: z.string().max(100).nullable().optional(),
  businessState: z.string().max(100).nullable().optional(),
  businessPostalCode: z.string().max(20).nullable().optional(),
  businessCountry: z.string().max(100).nullable().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getProfile(req.user!.userId)
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

router.patch(
  '/',
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await updateProfile(req.user!.userId, req.body as UpdateProfileBody)
      res.json(profile)
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/change-password',
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body
      await changePassword(req.user!.userId, currentPassword, newPassword)
      res.json({ message: 'Password updated successfully' })
    } catch (err) {
      next(err)
    }
  },
)

export default router
