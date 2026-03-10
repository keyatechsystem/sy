const firebaseConfig = {
    apiKey: "AIzaSyAFHsmuDtkflEURrCtJh7-_O7sbTxel1BI",
    authDomain: "keyatech-db.firebaseapp.com",
    projectId: "keyatech-db",
    storageBucket: "keyatech-db.firebasestorage.app",
    messagingSenderId: "447786557425",
    appId: "1:447786557425:web:0330ccb97d9481aade6e50"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
}

const auth = firebase.auth();
const db = firebase.firestore();

db.settings({ timestampsInSnapshots: true, cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });

db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') console.log('⚠️ Multiple tabs open, persistence disabled');
    else if (err.code === 'unimplemented') console.log('⚠️ Browser doesn\'t support persistence');
});

window.db = db;
window.auth = auth;

async function logActivity(action, details = {}) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await db.collection('activityLogs').add({
            userId: user.uid, userEmail: user.email, action, details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent, url: window.location.href
        });
    } catch (error) { console.error('Error logging activity:', error); }
}
window.logActivity = logActivity;

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; left: 20px; background: ${type === 'warning' ? '#ff9800' : type === 'success' ? '#4caf50' : '#667eea'};
        color: white; padding: 15px 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10001; font-family: 'Cairo', sans-serif; display: flex; align-items: center; gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `<i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}
window.showNotification = showNotification;
