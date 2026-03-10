async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await logActivity('login', { email: user.email });
        await db.collection('users').doc(user.uid).update({
            isOnline: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, user };
    } catch (error) {
        console.error('Login error:', error);
        await logActivity('login_failed', { email, error: error.message });
        let message = 'خطأ في تسجيل الدخول';
        if (error.code === 'auth/user-not-found') message = 'المستخدم غير موجود';
        else if (error.code === 'auth/wrong-password') message = 'كلمة المرور غير صحيحة';
        else if (error.code === 'auth/too-many-requests') message = 'محاولات كثيرة جداً، حاول لاحقاً';
        return { success: false, message };
    }
}

async function logout() {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await db.collection('users').doc(user.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        await logActivity('logout', { email: user.email });
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, message: error.message };
    }
}

async function checkPermission(requiredRole) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) return false;
        const userData = doc.data();
        const userRole = userData.role;
        if (requiredRole === 'admin' && userRole !== 'admin') return false;
        if (requiredRole === 'engineer' && !['admin', 'engineer'].includes(userRole)) return false;
        if (requiredRole === 'assistant' && !['admin', 'assistant'].includes(userRole)) return false;
        return true;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const interval = setInterval(async () => {
            try {
                await db.collection('users').doc(user.uid).update({
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) { console.error('Error updating lastSeen:', error); }
        }, 60000);
        window.addEventListener('beforeunload', () => {
            clearInterval(interval);
            db.collection('users').doc(user.uid).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }
});
