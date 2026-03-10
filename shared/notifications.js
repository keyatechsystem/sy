class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.checkInterval = null;
        this.init();
    }

    async init() {
        this.startChecking();
        this.setupListeners();
    }

    startChecking() {
        this.checkInterval = setInterval(() => this.checkForNotifications(), 30000);
    }

    setupListeners() {
        auth.onAuthStateChanged((user) => {
            if (user) this.loadUserNotifications(user.uid);
        });
    }

    async loadUserNotifications(userId) {
        try {
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .where('read', '==', false)
                .orderBy('createdAt', 'desc')
                .get();
            this.notifications = [];
            snapshot.forEach(doc => this.notifications.push({ id: doc.id, ...doc.data() }));
            this.updateBadge();
        } catch (error) { console.error('Error loading notifications:', error); }
    }

    async checkForNotifications() {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const overdueTickets = await db.collection('tickets')
                .where('status', 'in', ['open', 'in-progress'])
                .where('createdAt', '<=', threeDaysAgo)
                .get();
            if (!overdueTickets.empty) {
                this.createNotification({
                    userId: user.uid,
                    title: 'تذاكر متأخرة',
                    message: `يوجد ${overdueTickets.size} تذاكر متأخرة`,
                    type: 'warning',
                    icon: 'fa-exclamation-triangle'
                });
            }
        } catch (error) { console.error('Error checking notifications:', error); }
    }

    async createNotification(data) {
        try {
            await db.collection('notifications').add({
                ...data,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) { console.error('Error creating notification:', error); }
    }

    updateBadge() {
        const badge = document.getElementById('notificationsBadge');
        if (badge) {
            badge.textContent = this.notifications.length;
            badge.style.display = this.notifications.length > 0 ? 'flex' : 'none';
        }
    }
}

const notificationSystem = new NotificationSystem();
window.markAsRead = (id) => notificationSystem.markAsRead?.(id);
window.markAllAsRead = () => notificationSystem.markAllAsRead?.();
