const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Get WebSocket connection info
router.get('/info', auth, async (req, res) => {
  try {
    const websocketService = req.app.locals.websocketService;
    const connectionStats = websocketService.getConnectionStats();
    
    res.json({
      message: 'WebSocket service information',
      stats: connectionStats,
      userId: req.user.id,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test notification to user
router.post('/test-notification', auth, async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;
    const websocketService = req.app.locals.websocketService;
    
    websocketService.notifyUser(req.user.id, 'test_notification', {
      message: message || 'Test notification from Fylaro API',
      type,
      timestamp: Date.now()
    });
    
    res.json({
      message: 'Test notification sent successfully',
      userId: req.user.id,
      notificationType: type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast message to all connected users (admin only)
router.post('/broadcast', auth, async (req, res) => {
  try {
    // Check if user is admin (implement based on your auth system)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { message, type = 'announcement' } = req.body;
    const websocketService = req.app.locals.websocketService;
    
    websocketService.broadcast('system_announcement', {
      message,
      type,
      from: 'Fylaro System',
      timestamp: Date.now()
    });
    
    res.json({
      message: 'Broadcast sent successfully',
      recipientCount: websocketService.getConnectionStats().totalConnections
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get preferences from database (implement based on your DB)
    const preferences = {
      userId,
      enablePush: true,
      enableEmail: true,
      enableSMS: false,
      categories: {
        trading: true,
        payments: true,
        security: true,
        marketing: false,
        system: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };
    
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user's notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;
    
    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences format' });
    }
    
    // Update preferences in database (implement based on your DB)
    const updatedPreferences = {
      userId,
      ...preferences,
      updatedAt: new Date()
    };
    
    const websocketService = req.app.locals.websocketService;
    websocketService.notifyUser(userId, 'preferences_updated', {
      message: 'Notification preferences updated successfully',
      timestamp: Date.now()
    });
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's notification history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, type, read } = req.query;
    
    // Get notification history from database (implement based on your DB)
    const notifications = [
      // Sample data structure
      {
        id: 'notif_123',
        userId,
        type: 'payment_received',
        title: 'Payment Received',
        message: 'Payment of $1,000 received for Invoice #INV-001',
        data: {
          amount: 1000,
          invoiceId: 'INV-001'
        },
        read: false,
        createdAt: new Date(),
        readAt: null
      }
    ];
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / limit)
      },
      filters: { type, read }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/history/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Update notification in database (implement based on your DB)
    const notification = {
      id: notificationId,
      userId,
      read: true,
      readAt: new Date()
    };
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.patch('/history/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update all unread notifications in database (implement based on your DB)
    const updatedCount = 5; // Implement actual count from database
    
    res.json({
      message: 'All notifications marked as read',
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/history/:notificationId', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Delete notification from database (implement based on your DB)
    // Ensure user owns the notification
    
    res.json({
      message: 'Notification deleted successfully',
      notificationId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time connection status
router.get('/connection-status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const websocketService = req.app.locals.websocketService;
    
    const isConnected = websocketService.connectedUsers.has(userId);
    const subscriptions = websocketService.getUserSubscriptions(userId);
    
    res.json({
      userId,
      connected: isConnected,
      subscriptions,
      lastSeen: isConnected ? Date.now() : null,
      connectionStats: websocketService.getConnectionStats()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
