// ===== نظام المصادقة المتقدم =====

// تسجيل الدخول
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // تسجيل النشاط
        await logActivity('login', { email: user.email });

        // تحديث حالة المستخدم
        await db.collection('users').doc(user.uid).update({
            isOnline: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });

        // تسجيل الجلسة
        await db.collection('sessions').add({
            userId: user.uid,
            loginTime: firebase.firestore.FieldValue.serverTimestamp(),
            ipAddress: await getUserIP(),
            userAgent: navigator.userAgent
        });

        return { success: true, user };

    } catch (error) {
        console.error('Login error:', error);
        
        // تسجيل محاولة فاشلة
        await logActivity('login_failed', { email, error: error.message });

        let message = 'خطأ في تسجيل الدخول';
        if (error.code === 'auth/user-not-found') message = 'المستخدم غير موجود';
        else if (error.code === 'auth/wrong-password') message = 'كلمة المرور غير صحيحة';
        else if (error.code === 'auth/too-many-requests') message = 'محاولات كثيرة جداً، حاول لاحقاً';

        return { success: false, message };
    }
}

// تسجيل الخروج
async function logout() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // تحديث وقت الخروج في الجلسة
        const sessions = await db.collection('sessions')
            .where('userId', '==', user.uid)
            .where('logoutTime', '==', null)
            .orderBy('loginTime', 'desc')
            .limit(1)
            .get();

        if (!sessions.empty) {
            const session = sessions.docs[0];
            const loginTime = session.data().loginTime.toDate();
            const logoutTime = new Date();
            const duration = Math.round((logoutTime - loginTime) / 1000 / 60); // دقائق

            await db.collection('sessions').doc(session.id).update({
                logoutTime: firebase.firestore.FieldValue.serverTimestamp(),
                duration: duration
            });
        }

        // تحديث حالة المستخدم
        await db.collection('users').doc(user.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });

        // تسجيل النشاط
        await logActivity('logout', { email: user.email });

        await auth.signOut();
        return { success: true };

    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, message: error.message };
    }
}

// الحصول على IP
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'غير معروف';
    }
}

// التحقق من الصلاحيات
async function checkPermission(requiredRole) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) return false;

        const userData = doc.data();
        const userRole = userData.role;

        // صلاحيات متقدمة
        if (requiredRole === 'admin' && userRole !== 'admin') return false;
        if (requiredRole === 'engineer' && !['admin', 'engineer'].includes(userRole)) return false;
        if (requiredRole === 'assistant' && !['admin', 'assistant'].includes(userRole)) return false;

        return true;

    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

// مراقبة حالة الاتصال
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // تحديث آخر ظهور كل دقيقة
        const interval = setInterval(async () => {
            try {
                await db.collection('users').doc(user.uid).update({
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error updating lastSeen:', error);
            }
        }, 60000);

        // تنظيف عند الخروج
        window.addEventListener('beforeunload', () => {
            clearInterval(interval);
            db.collection('users').doc(user.uid).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // التحقق من التنبيهات للمستخدمين المسؤولين
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && ['admin', 'assistant'].includes(userDoc.data().role)) {
            checkForAlerts();
        }
    }
});
