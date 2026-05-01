import { Router } from 'express';
import { 
  registerMyDevice, 
  getMyDevices,
  reportDeviceLost,
  reportDeviceFound,
  deleteDevice,
  verifyDevice
} from '../controllers/device.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { upload } from '../utils/upload.utils.ts';

const router = Router();

/**
 * Verify a device by IMEI or Serial Number
 */
router.get('/verify/:identifier', authMiddleware, verifyDevice);

/**
 * Register a new device with multiple photos
 */
router.post('/', authMiddleware, upload.fields([
  { name: 'photo_facture', maxCount: 1 },
  { name: 'photo_face', maxCount: 1 },
  { name: 'photo_serial', maxCount: 1 }
]), registerMyDevice);

/**
 * List all user's devices
 */
router.get('/', authMiddleware, getMyDevices);

/**
 * Report a device as lost
 */
router.patch('/:id/lost', authMiddleware, reportDeviceLost);

/**
 * Report a device as found/secure
 */
router.patch('/:id/found', authMiddleware, reportDeviceFound);

/**
 * Delete a device
 */
router.delete('/:id', authMiddleware, deleteDevice);

export default router;
