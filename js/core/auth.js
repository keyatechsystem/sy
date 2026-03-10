/* ===== CYBERPUNK 2099 - نظام المصادقة المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== استيراد Firebase Manager =====
const { auth, db } = window.FirebaseManager || {};

// ===== الفئة الرئيسية لنظام المصادقة =====
class AuthSystem {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.currentUser = null;
        this.userData = null;
        this.sessionData = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 دقيقة
        this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
        this.rememberMe = false;
        this.listeners = [];
        
        this.init();
    }

    // ===== تهيئة النظام =====
    init() {
        this.loadSession();
        this.setupAuthListener();
        this.setupSessionMonitor();
        this.setupSecurityListeners();
        this.loadRememberedUser();
    }

    // ===== مستمع حالة المصادقة =====
    setupAuthListener() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user.uid);
                await this.createSession(user.uid);
                this.updateLastActive();
                this.notifyListeners('login', { user: this.userData });
                
                AnalyticsManager.logEvent('login_success', {
                    method: 'password',
                    userId: user.uid
                });
            } else {
                this.currentUser = null;
                this.userData = null;
                this.sessionData = null;
                this.notifyListeners('logout', {});
                
                AnalyticsManager.logEvent('logout', {});
            }
        });
    }

    // ===== تحميل بيانات المستخدم =====
    async loadUserData(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                this.userData = { id: doc.id, ...doc.data() };
                
                // تحديث آخر نشاط
                await this.db.collection('users').doc(userId).update({
                    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.notifyListeners('userLoaded', this.userData);
            } else {
                console.error('User data not found');
                await this.auth.signOut();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleError(error);
        }
    }

    // ===== إنشاء جلسة =====
    async createSession(userId) {
        try {
            const sessionId = this.generateSessionId();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.sessionTimeout);

            const session = {
                sessionId: sessionId,
                userId: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: expiresAt,
                lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
                ipAddress: await this.getIPAddress(),
                userAgent: navigator.userAgent,
                device: this.getDeviceInfo(),
                location: await this.getLocation()
            };

            await this.db.collection('sessions').doc(sessionId).set(session);
            
            this.sessionData = session;
            this.saveSession(sessionId, expiresAt);

            AnalyticsManager.logEvent('session_created', {
                sessionId,
                device: session.device.type
            });

            return sessionId;
        } catch (error) {
            console.error('Error creating session:', error);
            return null;
        }
    }

    // ===== تحديث آخر نشاط =====
    async updateLastActive() {
        if (!this.currentUser) return;

        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (this.sessionData) {
                await this.db.collection('sessions').doc(this.sessionData.sessionId).update({
                    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error updating last active:', error);
        }
    }

    // ===== تسجيل الدخول بالبريد الإلكتروني وكلمة المرور =====
    async loginWithEmail(email, password, remember = false) {
        try {
            this.rememberMe = remember;
            
            // التحقق من محاولات الدخول
            if (this.isLockedOut()) {
                throw new Error('account_locked');
            }

            const result = await this.auth.signInWithEmailAndPassword(email, password);
            
            // إعادة تعيين محاولات الدخول
            this.loginAttempts = 0;
            localStorage.removeItem('login_attempts');
            
            if (remember) {
                this.saveRememberedUser(email);
            }

            AnalyticsManager.logEvent('login', {
                method: 'email_password',
                success: true
            });

            return { success: true, user: result.user };
        } catch (error) {
            this.loginAttempts++;
            this.saveLoginAttempts();
            
            AnalyticsManager.logEvent('login', {
                method: 'email_password',
                success: false,
                error: error.code
            });

            return this.handleLoginError(error);
        }
    }

    // ===== تسجيل الدخول بالاسم =====
    async loginWithName(name, password, remember = false) {
        try {
            this.rememberMe = remember;

            if (this.isLockedOut()) {
                throw new Error('account_locked');
            }

            // البحث عن المستخدم بالاسم
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef
                .where('displayName', '==', name)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                throw new Error('auth/user-not-found');
            }

            const userData = snapshot.docs[0].data();
            const result = await this.auth.signInWithEmailAndPassword(userData.email, password);

            this.loginAttempts = 0;
            localStorage.removeItem('login_attempts');

            if (remember) {
                this.saveRememberedUser(name);
            }

            AnalyticsManager.logEvent('login', {
                method: 'name_password',
                success: true
            });

            return { success: true, user: result.user, userData };
        } catch (error) {
            this.loginAttempts++;
            this.saveLoginAttempts();

            AnalyticsManager.logEvent('login', {
                method: 'name_password',
                success: false,
                error: error.code
            });

            return this.handleLoginError(error);
        }
    }

    // ===== تسجيل الخروج =====
    async logout() {
        try {
            if (this.sessionData) {
                await this.db.collection('sessions').doc(this.sessionData.sessionId).update({
                    endedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    duration: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await this.auth.signOut();
            
            this.clearSession();
            this.notifyListeners('logout', {});

            AnalyticsManager.logEvent('logout', {
                success: true
            });

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            
            AnalyticsManager.logEvent('logout', {
                success: false,
                error: error.code
            });

            return { success: false, error: error.message };
        }
    }

    // ===== إنشاء حساب جديد =====
    async register(userData) {
        try {
            const { email, password, name, phone, role = 'client' } = userData;

            // إنشاء المستخدم في Authentication
            const result = await this.auth.createUserWithEmailAndPassword(email, password);

            // تحديث اسم المستخدم
            await result.user.updateProfile({
                displayName: name
            });

            // إرسال بريد التفعيل
            await result.user.sendEmailVerification();

            // إنشاء ملف المستخدم في Firestore
            const userDoc = {
                uid: result.user.uid,
                name: name,
                displayName: name,
                email: email,
                phone: phone || '',
                role: role,
                isActive: true,
                isOnline: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false,
                settings: {
                    language: 'ar',
                    theme: 'dark',
                    notifications: true
                }
            };

            await this.db.collection('users').doc(result.user.uid).set(userDoc);

            AnalyticsManager.logEvent('register', {
                method: 'email',
                role: role,
                success: true
            });

            return { 
                success: true, 
                user: result.user,
                message: 'تم إنشاء الحساب بنجاح. يرجى تفعيل البريد الإلكتروني'
            };
        } catch (error) {
            console.error('Registration error:', error);

            AnalyticsManager.logEvent('register', {
                success: false,
                error: error.code
            });

            return this.handleRegistrationError(error);
        }
    }

    // ===== إعادة تعيين كلمة المرور =====
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);

            AnalyticsManager.logEvent('password_reset', {
                success: true
            });

            return {
                success: true,
                message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
            };
        } catch (error) {
            console.error('Password reset error:', error);

            AnalyticsManager.logEvent('password_reset', {
                success: false,
                error: error.code
            });

            return this.handlePasswordResetError(error);
        }
    }

    // ===== تغيير كلمة المرور =====
    async changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, error: 'not_authenticated' };
        }

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                oldPassword
            );

            await this.currentUser.reauthenticateWithCredential(credential);
            await this.currentUser.updatePassword(newPassword);

            AnalyticsManager.logEvent('password_change', {
                success: true
            });

            return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
        } catch (error) {
            console.error('Password change error:', error);

            AnalyticsManager.logEvent('password_change', {
                success: false,
                error: error.code
            });

            return this.handlePasswordChangeError(error);
        }
    }

    // ===== تحديث البريد الإلكتروني =====
    async updateEmail(newEmail, password) {
        if (!this.currentUser) {
            return { success: false, error: 'not_authenticated' };
        }

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                password
            );

            await this.currentUser.reauthenticateWithCredential(credential);
            await this.currentUser.updateEmail(newEmail);

            // تحديث البريد في Firestore
            await this.db.collection('users').doc(this.currentUser.uid).update({
                email: newEmail,
                emailVerified: false
            });

            // إرسال بريد التفعيل الجديد
            await this.currentUser.sendEmailVerification();

            AnalyticsManager.logEvent('email_update', {
                success: true
            });

            return { success: true, message: 'تم تحديث البريد الإلكتروني بنجاح' };
        } catch (error) {
            console.error('Email update error:', error);

            AnalyticsManager.logEvent('email_update', {
                success: false,
                error: error.code
            });

            return this.handleEmailUpdateError(error);
        }
    }

    // ===== تفعيل البريد الإلكتروني =====
    async sendVerificationEmail() {
        if (!this.currentUser) {
            return { success: false, error: 'not_authenticated' };
        }

        try {
            await this.currentUser.sendEmailVerification();

            AnalyticsManager.logEvent('verification_sent', {
                success: true
            });

            return { success: true, message: 'تم إرسال بريد التفعيل' };
        } catch (error) {
            console.error('Verification email error:', error);

            AnalyticsManager.logEvent('verification_sent', {
                success: false,
                error: error.code
            });

            return { success: false, error: error.message };
        }
    }

    // ===== التحقق من حالة البريد =====
    async checkEmailVerification() {
        if (!this.currentUser) return false;

        await this.currentUser.reload();
        const isVerified = this.currentUser.emailVerified;

        if (isVerified) {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                emailVerified: true
            });
        }

        return isVerified;
    }

    // ===== التحقق من الصلاحيات =====
    async hasPermission(permission) {
        if (!this.userData) return false;

        const permissions = {
            admin: ['all'],
            manager: ['manage_users', 'manage_tickets', 'view_reports'],
            engineer: ['manage_tickets', 'view_assigned'],
            assistant: ['manage_clients', 'view_tickets'],
            client: ['view_own_tickets', 'create_tickets']
        };

        const userRole = this.userData.role || 'client';
        
        if (permissions[userRole]?.includes('all')) return true;
        return permissions[userRole]?.includes(permission) || false;
    }

    // ===== التحقق من الدور =====
    async hasRole(role) {
        return this.userData?.role === role;
    }

    // ===== الحصول على دور المستخدم =====
    getUserRole() {
        return this.userData?.role || 'guest';
    }

    // ===== التحقق من صلاحية الجلسة =====
    async validateSession() {
        if (!this.currentUser || !this.sessionData) return false;

        try {
            const sessionRef = this.db.collection('sessions').doc(this.sessionData.sessionId);
            const session = await sessionRef.get();

            if (!session.exists) return false;

            const sessionData = session.data();
            const expiresAt = sessionData.expiresAt.toDate();
            const now = new Date();

            if (now > expiresAt) {
                await this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    // ===== مراقبة الجلسة =====
    setupSessionMonitor() {
        setInterval(async () => {
            const isValid = await this.validateSession();
            
            if (!isValid && this.currentUser) {
                this.notifyListeners('session_expired', {});
                await this.logout();
            }
        }, 60000); // كل دقيقة
    }

    // ===== مستمعات الأمان =====
    setupSecurityListeners() {
        // مراقبة محاولات الدخول الفاشلة
        window.addEventListener('storage', (e) => {
            if (e.key === 'login_attempts') {
                this.loginAttempts = parseInt(e.newValue) || 0;
            }
        });

        // مراقبة تغيير كلمة المرور من مكان آخر
        this.auth.onAuthStateChanged((user) => {
            if (user && this.currentUser && user.uid === this.currentUser.uid) {
                // التحقق من تغيير كلمة المرور
                // يمكن إضافة منطق إضافي هنا
            }
        });
    }

    // ===== حفظ محاولات الدخول =====
    saveLoginAttempts() {
        localStorage.setItem('login_attempts', JSON.stringify({
            count: this.loginAttempts,
            timestamp: Date.now()
        }));
    }

    // ===== التحقق من الحظر =====
    isLockedOut() {
        const attempts = localStorage.getItem('login_attempts');
        
        if (attempts) {
            const data = JSON.parse(attempts);
            
            if (data.count >= this.maxLoginAttempts) {
                const timeSinceLock = Date.now() - data.timestamp;
                
                if (timeSinceLock < this.lockoutTime) {
                    return true;
                } else {
                    localStorage.removeItem('login_attempts');
                    this.loginAttempts = 0;
                }
            }
        }

        return false;
    }

    // ===== حفظ المستخدم المتذكر =====
    saveRememberedUser(email) {
        localStorage.setItem('remembered_user', JSON.stringify({
            email: email,
            timestamp: Date.now()
        }));
    }

    // ===== تحميل المستخدم المتذكر =====
    loadRememberedUser() {
        const remembered = localStorage.getItem('remembered_user');
        
        if (remembered) {
            const data = JSON.parse(remembered);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            
            if (Date.now() - data.timestamp < oneWeek) {
                this.notifyListeners('remembered_user', { email: data.email });
            } else {
                localStorage.removeItem('remembered_user');
            }
        }
    }

    // ===== حفظ الجلسة =====
    saveSession(sessionId, expiresAt) {
        const sessionData = {
            id: sessionId,
            expiresAt: expiresAt.toISOString()
        };

        if (this.rememberMe) {
            localStorage.setItem('session', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('session', JSON.stringify(sessionData));
        }
    }

    // ===== تحميل الجلسة =====
    loadSession() {
        const session = localStorage.getItem('session') || sessionStorage.getItem('session');
        
        if (session) {
            const data = JSON.parse(session);
            const expiresAt = new Date(data.expiresAt);
            
            if (new Date() < expiresAt) {
                this.sessionData = { sessionId: data.id };
            } else {
                this.clearSession();
            }
        }
    }

    // ===== مسح الجلسة =====
    clearSession() {
        localStorage.removeItem('session');
        sessionStorage.removeItem('session');
        localStorage.removeItem('remembered_user');
    }

    // ===== إنشاء معرف جلسة =====
    generateSessionId() {
        return 'ses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== الحصول على عنوان IP =====
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return 'unknown';
        }
    }

    // ===== الحصول على معلومات الجهاز =====
    getDeviceInfo() {
        const ua = navigator.userAgent;
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
        const isTablet = /Tablet|iPad/i.test(ua);
        const isDesktop = !isMobile && !isTablet;

        return {
            type: isDesktop ? 'desktop' : (isTablet ? 'tablet' : 'mobile'),
            browser: this.getBrowser(),
            os: this.getOS(),
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        };
    }

    // ===== الحصول على المتصفح =====
    getBrowser() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('MSIE') || ua.includes('Trident')) return 'Internet Explorer';
        
        return 'Unknown';
    }

    // ===== الحصول على نظام التشغيل =====
    getOS() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'MacOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        
        return 'Unknown';
    }

    // ===== الحصول على الموقع التقريبي =====
    async getLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            return {
                country: data.country_name,
                city: data.city,
                region: data.region,
                timezone: data.timezone
            };
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    }

    // ===== معالجة أخطاء تسجيل الدخول =====
    handleLoginError(error) {
        let message = 'حدث خطأ في تسجيل الدخول';
        
        switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                message = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                break;
            case 'auth/too-many-requests':
                message = 'تم حظر الحساب مؤقتاً لكثرة المحاولات الفاشلة';
                break;
            case 'auth/user-disabled':
                message = 'تم تعطيل هذا الحساب';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'account_locked':
                const remaining = Math.ceil((this.lockoutTime - (Date.now() - this.loginAttempts)) / 60000);
                message = `تم قفل الحساب مؤقتاً. حاول بعد ${remaining} دقائق`;
                break;
            default:
                message = error.message;
        }

        return { success: false, error: error.code, message };
    }

    // ===== معالجة أخطاء التسجيل =====
    handleRegistrationError(error) {
        let message = 'حدث خطأ في إنشاء الحساب';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                message = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/weak-password':
                message = 'كلمة المرور ضعيفة جداً';
                break;
            default:
                message = error.message;
        }

        return { success: false, error: error.code, message };
    }

    // ===== معالجة أخطاء إعادة تعيين كلمة المرور =====
    handlePasswordResetError(error) {
        let message = 'حدث خطأ في إعادة تعيين كلمة المرور';
        
        switch(error.code) {
            case 'auth/user-not-found':
                message = 'لا يوجد حساب بهذا البريد الإلكتروني';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            default:
                message = error.message;
        }

        return { success: false, error: error.code, message };
    }

    // ===== معالجة أخطاء تغيير كلمة المرور =====
    handlePasswordChangeError(error) {
        let message = 'حدث خطأ في تغيير كلمة المرور';
        
        switch(error.code) {
            case 'auth/wrong-password':
                message = 'كلمة المرور الحالية غير صحيحة';
                break;
            case 'auth/weak-password':
                message = 'كلمة المرور الجديدة ضعيفة جداً';
                break;
            default:
                message = error.message;
        }

        return { success: false, error: error.code, message };
    }

    // ===== معالجة أخطاء تحديث البريد =====
    handleEmailUpdateError(error) {
        let message = 'حدث خطأ في تحديث البريد الإلكتروني';
        
        switch(error.code) {
            case 'auth/wrong-password':
                message = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/email-already-in-use':
                message = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            default:
                message = error.message;
        }

        return { success: false, error: error.code, message };
    }

    // ===== إضافة مستمع =====
    addListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    // ===== إعلام المستمعين =====
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    // ===== الحصول على المستخدم الحالي =====
    getCurrentUser() {
        return this.currentUser;
    }

    // ===== الحصول على بيانات المستخدم =====
    getUserData() {
        return this.userData;
    }

    // ===== التحقق من المصادقة =====
    isAuthenticated() {
        return !!this.currentUser;
    }

    // ===== الحصول على وقت الحظر المتبقي =====
    getLockoutTimeRemaining() {
        const attempts = localStorage.getItem('login_attempts');
        
        if (attempts) {
            const data = JSON.parse(attempts);
            
            if (data.count >= this.maxLoginAttempts) {
                const elapsed = Date.now() - data.timestamp;
                const remaining = Math.max(0, this.lockoutTime - elapsed);
                
                if (remaining > 0) {
                    return Math.ceil(remaining / 60000); // دقائق
                }
            }
        }

        return 0;
    }

    // ===== تدمير النظام =====
    destroy() {
        this.listeners = {};
        this.clearSession();
        console.log('Auth system destroyed');
    }
}

// ===== إنشاء النظام =====
const AuthSystemInstance = new AuthSystem();

// ===== تصدير النظام =====
window.AuthSystem = AuthSystemInstance;

// ===== تصدير للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystemInstance;
}

console.log('🔐 Auth System initialized');
