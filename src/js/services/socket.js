/**
 * Real-time Communication Service using Socket.io
 */
import { io } from 'socket.io-client';
import { getToken } from '../utils/cookie.js';
import { API_BASE_URL } from './api.js';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.userId = null;
    }

    /**
     * Initialize connection
     */
    init() {
        const token = getToken();
        if (!token) {
            console.log('🔌 Socket: No token found, skipping connection');
            return;
        }

        // Avoid multiple connections
        if (this.socket?.connected) return;

        console.log('🔌 Connecting to real-time server...');
        
        // Derive Socket URL from API base URL (remove '/api' and protocol/host logic)
        // API_BASE_URL is usually something like "http://<host>:5000/api"
        const socketUrl = API_BASE_URL.replace('/api', '');
        
        this.socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'] // Explicitly enable websocket transport
        });

        this.socket.on('connect', () => {
            console.log('✅ Real-time connection established at:', socketUrl);
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
        // Basic lifecycle handlers
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        // Server may emit an auth/handshake event with user info
        this.socket.on('authenticated', (payload) => {
            try {
                this.userId = payload?.userId || null;
            } catch (e) {
                this.userId = null;
            }
            console.log('🔐 Socket authenticated as user:', this.userId);
        });

        // Common notification event from backend
        this.socket.on('notification', (notification) => {
            try {
                this.handleNotification(notification);
            } catch (err) {
                console.error('Error handling notification:', err);
            }
        });

        // Reattach token on reconnect attempts (useful if token was refreshed)
        this.socket.io && this.socket.io.on && this.socket.io.on('reconnect_attempt', () => {
            const newToken = getToken();
            if (newToken) this.socket.auth = { token: newToken };
        });

        return this.socket;
    }


    /**
     * Register an event listener on the socket and track it for cleanup
     */
    on(event, handler) {
        if (!this.socket) return;
        this.socket.on(event, handler);
        const set = this.listeners.get(event) || new Set();
        set.add(handler);
        this.listeners.set(event, set);
    }

    /**
     * Remove a specific listener or all listeners for an event
     */
    off(event, handler) {
        if (!this.socket) return;
        if (handler) {
            this.socket.off(event, handler);
            const set = this.listeners.get(event);
            if (set) {
                set.delete(handler);
                if (set.size === 0) this.listeners.delete(event);
            }
        } else {
            // remove all tracked listeners for the event
            const set = this.listeners.get(event);
            if (set) {
                set.forEach(h => this.socket.off(event, h));
                this.listeners.delete(event);
            } else {
                this.socket.removeAllListeners(event);
            }
        }
    }

    /**
     * Emit an event to the server
     */
    emit(event, payload) {
        if (!this.socket || !this.socket.connected) {
            console.warn('Socket not connected — emit skipped for', event);
            return;
        }
        this.socket.emit(event, payload);
    }

    /**
     * Convenience alias for `on`
     */
    subscribe(event, handler) {
        this.on(event, handler);
    }
    /**
     * Handle incoming notifications
     */
    handleNotification(notification) {
        // 1. Trigger visual alert (Toast)
        this.showToast(notification);

        // 2. Update UI (Bell badge / Dot)
        this.updateBadge();

        // 3. Add to existing notification modal if possible
        if (window.addNotification) {
            window.addNotification(
                notification.title,
                notification.message,
                'À l\'instant',
                this.getIconForType(notification.type),
                false
            );
        }

        // 4. Notify other parts of the app
        const event = new CustomEvent('docmaster:new_notification', { detail: notification });
        window.dispatchEvent(event);
    }

    getIconForType(type) {
        switch (type) {
            case 'MATCH_FOUND': return 'fa-solid fa-handshake';
            case 'PAYMENT_RECEIVED': return 'fa-solid fa-money-bill-wave';
            case 'RECOVERY_SUCCESS': return 'fa-solid fa-circle-check';
            case 'DOC_ADDED': return 'fa-solid fa-file-circle-plus';
            default: return 'fa-solid fa-bell';
        }
    }

    showToast(notif) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-[9999] bg-white border-l-4 border-accent shadow-2xl rounded-lg p-4 max-w-sm transform transition-all duration-300 translate-x-full opacity-0';
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                    <i class="${this.getIconForType(notif.type)}"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 text-sm">${notif.title}</h4>
                    <p class="text-gray-600 text-xs mt-1 line-clamp-2">${notif.message}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Auto remove
        const removeToast = () => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        };

        const timeout = setTimeout(removeToast, 5000);

        // Close button
        toast.querySelector('button').onclick = () => {
            clearTimeout(timeout);
            removeToast();
        };

        // Click to go to notifications
        toast.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.openNotifModal ? window.openNotifModal() : (window.location.href = '/notifications.html');
        };
    }

    updateBadge() {
        // Handle notification dot in dashboard
        const dot = document.getElementById('notifDot');
        if (dot) dot.style.display = 'block';

        // Handle numeric badges if they exist
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            let count = parseInt(badge.textContent) || 0;
            count++;
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
            
            // Animation
            badge.classList.add('scale-125');
            setTimeout(() => badge.classList.remove('scale-125'), 200);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
