// ===== تهيئة Firebase =====
const firebaseConfig = {
    apiKey: "AIzaSyAFHsmuDtkflEURrCtJh7-_O7sbTxel1BI",
    authDomain: "keyatech-db.firebaseapp.com",
    projectId: "keyatech-db",
    storageBucket: "keyatech-db.firebasestorage.app",
    messagingSenderId: "447786557425",
    appId: "1:447786557425:web:0330ccb97d9481aade6e50"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// إعدادات Firestore
db.settings({
    timestampsInSnapshots: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// تمكين الثبات (offline)
db.enablePersistence()
    .then(() => console.log('✅ Persistence enabled'))
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('⚠️ Multiple tabs open, persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.log('⚠️ Browser doesn\'t support persistence');
        }
    });

// تصدير الخدمات للاستخدام العام
window.db = db;
window.auth = auth;
window.storage = storage;

// ===== نظام تسجيل الأحداث (Logs) =====
async function logActivity(action, details = {}) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await db.collection('activityLogs').add({
            userId: user.uid,
            userEmail: user.email,
            action: action,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

window.logActivity = logActivity;

// ===== نظام التنبيهات (Alerts) =====
async function checkForAlerts() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // التحقق من التذاكر المتأخرة
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const overdueTickets = await db.collection('tickets')
            .where('status', 'in', ['open', 'in-progress'])
            .where('createdAt', '<=', threeDaysAgo)
            .get();

        if (!overdueTickets.empty) {
            showNotification(`⚠️ يوجد ${overdueTickets.size} تذاكر متأخرة`, 'warning');
            
            // إنشاء تنبيه في قاعدة البيانات
            await db.collection('alerts').add({
                type: 'overdue_tickets',
                count: overdueTickets.size,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
        }

        // التحقق من العملاء غير النشطين
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const inactiveClients = await db.collection('users')
            .where('role', '==', 'client')
            .where('lastSeen', '<=', thirtyDaysAgo)
            .get();

        if (!inactiveClients.empty && user.role === 'admin') {
            showNotification(`📊 يوجد ${inactiveClients.size} عملاء غير نشطين`, 'info');
        }

    } catch (error) {
        console.error('Error checking alerts:', error);
    }
}

window.checkForAlerts = checkForAlerts;

// ===== إظهار الإشعارات =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

window.showNotification = showNotification;

// ===== تشغيل فحص التنبيهات كل ساعة =====
setInterval(checkForAlerts, 60 * 60 * 1000);
