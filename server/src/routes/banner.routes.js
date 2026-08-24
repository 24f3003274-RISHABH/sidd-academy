import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import * as bannerController from '../controllers/banner.controller.js';

const router = express.Router();

router.get('/active', bannerController.getActiveBanners);
router.get('/', protect, adminOnly, bannerController.getAllBanners);
router.post('/', protect, adminOnly, bannerController.createBanner);
router.put('/:id', protect, adminOnly, bannerController.updateBanner);
router.delete('/:id', protect, adminOnly, bannerController.deleteBanner);

export default router;
