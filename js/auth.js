// نظام المصادقة وإدارة الجلسات

// تسجيل الدخول بالاسم وكلمة المرور
async function loginWithName(name, password) {
    try {
        // البحث عن المستخدم بالاسم
        const usersSnapshot = await db.collection('users')
            .where('displayName', '==', name)
            .where('isActive', '==', true)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            throw new Error('اسم المستخدم غير صحيح أو الحساب غير نشط');
        }

        const userData = usersSnapshot.docs[0].data();
        const userId = usersSnapshot.docs[0].id;

        // تسجيل الدخول بالبريد الإلكتروني
        const userCredential = await auth.signInWithEmailAndPassword(userData.email, password);
        
        // تحديث حالة المستخدم
        await db.collection('users').doc(userId).update({
            isOnline: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });

        // تسجيل الجلسة
        await db.collection('onlineSessions').add({
            userId: userId,
            userName: userData.displayName || userData.name,
            loginTime: firebase.firestore.FieldValue.serverTimestamp(),
            ipAddress: await getUserIP()
        });

        return { success: true, user: userCredential.user, role: userData.role };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// تسجيل الخروج
async function logoutUser() {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'لا يوجد مستخدم مسجل' };

    try {
        // تحديث آخر جلسة
        const sessionsSnapshot = await db.collection('onlineSessions')
            .where('userId', '==', user.uid)
            .where('logoutTime', '==', null)
            .orderBy('loginTime', 'desc')
            .limit(1)
            .get();

        if (!sessionsSnapshot.empty) {
            const sessionDoc = sessionsSnapshot.docs[0];
            const loginTime = sessionDoc.data().loginTime.toDate();
            const logoutTime = new Date();
            const duration = Math.round((logoutTime - loginTime) / 1000 / 60); // دقائق

            await db.collection('onlineSessions').doc(sessionDoc.id).update({
                logoutTime: firebase.firestore.FieldValue.serverTimestamp(),
                duration: duration
            });
        }

        // تحديث حالة المستخدم
        await db.collection('users').doc(user.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogout: firebase.firestore.FieldValue.serverTimestamp()
        });

        await auth.signOut();
        return { success: true };

    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على عنوان IP (تقريبي)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'غير معروف';
    }
}

// التحقق من صلاحية المستخدم
async function checkUserRole(requiredRole) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) return false;

        const userData = doc.data();
        
        if (requiredRole === 'admin' && userData.role !== 'admin') return false;
        if (requiredRole === 'engineer' && !['admin', 'engineer'].includes(userData.role)) return false;
        if (requiredRole === 'assistant' && !['admin', 'assistant'].includes(userData.role)) return false;
        
        return true;

    } catch (error) {
        console.error('Role check error:', error);
        return false;
    }
}

// إنشاء مستخدم جديد (للمدير فقط)
async function createUser(userData) {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'غير مصرح' };

    try {
        // التحقق من أن المستخدم الحالي مدير
        const adminDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
            return { success: false, error: 'غير مصرح بهذه العملية' };
        }

        // إنشاء المستخدم في Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(
            userData.email, 
            userData.password
        );

        // تحديث اسم المستخدم
        await userCredential.user.updateProfile({
            displayName: userData.name
        });

        // إضافة البيانات إلى Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: userData.name,
            displayName: userData.name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone || '',
            isActive: true,
            isOnline: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
            permissions: getRolePermissions(userData.role)
        });

        return { success: true, userId: userCredential.user.uid };

    } catch (error) {
        console.error('Create user error:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على صلاحيات الدور
function getRolePermissions(role) {
    const permissions = {
        admin: {
            manageUsers: true,
            manageTickets: true,
            viewReports: true,
            manageSettings: true,
            viewOnlineUsers: true
        },
        engineer: {
            manageUsers: false,
            manageTickets: true,
            viewReports: false,
            manageSettings: false,
            viewOnlineUsers: false
        },
        assistant: {
            manageUsers: false,
            manageTickets: true,
            viewReports: false,
            manageSettings: false,
            viewOnlineUsers: false
        }
    };
    return permissions[role] || permissions.assistant;
}

// مراقبة حالة الاتصال
auth.onAuthStateChanged((user) => {
    if (user) {
        // تحديث حالة الاتصال كل دقيقة
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
    }
});
