// ===== نظام الإشعارات المتكامل =====

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.checkInterval = null;
        this.init();
    }

    // التهيئة
    async init() {
        this.startChecking();
        this.setupListeners();
    }

    // بدء فحص الإشعارات
    startChecking() {
        this.checkInterval = setInterval(() => {
            this.checkForNotifications();
        }, 30000); // كل 30 ثانية
    }

    // إعداد المستمعين
    setupListeners() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadUserNotifications(user.uid);
            }
        });
    }

    // تحميل إشعارات المستخدم
    async loadUserNotifications(userId) {
        try {
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .where('read', '==', false)
                .orderBy('createdAt', 'desc')
                .get();

            this.notifications = [];
            snapshot.forEach(doc => {
                this.notifications.push({ id: doc.id, ...doc.data() });
            });

            this.updateBadge();
            this.showPopup();

        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // فحص الإشعارات الجديدة
    async checkForNotifications() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // تذاكر جديدة
            const newTickets = await db.collection('tickets')
                .where('createdAt', '>=', new Date(Date.now() - 5 * 60 * 1000))
                .get();

            if (!newTickets.empty) {
                this.createNotification({
                    userId: this.getAdminUsers(),
                    title: 'تذاكر جديدة',
                    message: `تم إضافة ${newTickets.size} تذاكر جديدة`,
                    type: 'info',
                    icon: 'fa-ticket-alt'
                });
            }

            // تذاكر متأخرة
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const overdueTickets = await db.collection('tickets')
                .where('status', 'in', ['open', 'in-progress'])
                .where('createdAt', '<=', threeDaysAgo)
                .get();

            if (!overdueTickets.empty) {
                this.createNotification({
                    userId: this.getAdminUsers(),
                    title: 'تذاكر متأخرة',
                    message: `يوجد ${overdueTickets.size} تذاكر متأخرة`,
                    type: 'warning',
                    icon: 'fa-exclamation-triangle'
                });
            }

        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    // إنشاء إشعار جديد
    async createNotification(data) {
        try {
            await db.collection('notifications').add({
                ...data,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // إرسال بريد إلكتروني
            if (data.email) {
                await this.sendEmail(data);
            }

            // إرسال واتساب
            if (data.whatsapp) {
                await this.sendWhatsApp(data);
            }

        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    // إرسال بريد إلكتروني
    async sendEmail(data) {
        // سيتم ربطه بخدمة البريد لاحقاً
        console.log('Sending email:', data);
    }

    // إرسال واتساب
    async sendWhatsApp(data) {
        // سيتم ربطه بواجهة واتساب لاحقاً
        console.log('Sending WhatsApp:', data);
    }

    // تحديث عداد الإشعارات
    updateBadge() {
        const badge = document.getElementById('notificationsBadge');
        if (badge) {
            const count = this.notifications.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // إظهار الإشعارات المنبثقة
    showPopup() {
        const container = document.getElementById('notificationsPopup');
        if (!container) return;

        let html = '';
        this.notifications.forEach(notif => {
            html += `
                <div class="notification-item ${notif.type}" onclick="markAsRead('${notif.id}')">
                    <div class="notification-icon">
                        <i class="fas ${notif.icon || 'fa-bell'}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${utils.timeAgo(notif.createdAt)}</div>
                    </div>
                </div>
            `;
        });

        if (this.notifications.length === 0) {
            html = '<div class="no-notifications">لا توجد إشعارات جديدة</div>';
        }

        container.innerHTML = html;
    }

    // الحصول على المستخدمين المسؤولين
    async getAdminUsers() {
        try {
            const snapshot = await db.collection('users')
                .where('role', 'in', ['admin', 'assistant'])
                .get();

            return snapshot.docs.map(doc => doc.id);

        } catch (error) {
            console.error('Error getting admin users:', error);
            return [];
        }
    }

    // تعليم الإشعار كمقروء
    async markAsRead(notificationId) {
        try {
            await db.collection('notifications').doc(notificationId).update({
                read: true
            });

            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.updateBadge();
            this.showPopup();

        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // تعليم الكل كمقروء
    async markAllAsRead() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const batch = db.batch();
            
            this.notifications.forEach(notif => {
                const ref = db.collection('notifications').doc(notif.id);
                batch.update(ref, { read: true });
            });

            await batch.commit();
            
            this.notifications = [];
            this.updateBadge();
            this.showPopup();

        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
}

// تهيئة النظام
const notificationSystem = new NotificationSystem();

// دوال عامة
window.markAsRead = (id) => notificationSystem.markAsRead(id);
window.markAllAsRead = () => notificationSystem.markAllAsRead();
window.showNotifications = () => {
    const popup = document.getElementById('notificationsPopup');
    if (popup) {
        popup.classList.toggle('show');
    }
};
