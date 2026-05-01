import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications - List user notifications
router.get('/', notificationController.getMyNotifications);

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', notificationController.markAllRead);

export default router;
