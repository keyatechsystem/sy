/* ===== CYBERPUNK 2099 - نظام Firebase المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== تهيئة Firebase =====
const firebaseConfig = {
    apiKey: "AIzaSyAFHsmuDtkflEURrCtJh7-_O7sbTxel1BI",
    authDomain: "keyatech-db.firebaseapp.com",
    projectId: "keyatech-db",
    storageBucket: "keyatech-db.firebasestorage.app",
    messagingSenderId: "447786557425",
    appId: "1:447786557425:web:0330ccb97d9481aade6e50",
    measurementId: "G-0TWKLHF6BJ"
};

// ===== تهيئة Firebase =====
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
}

// ===== تهيئة الخدمات =====
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions ? firebase.functions() : null;
const analytics = firebase.analytics ? firebase.analytics() : null;

// ===== إعدادات Firestore =====
db.settings({
    timestampsInSnapshots: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// ===== تمكين الثبات (offline) =====
db.enablePersistence({
    synchronizeTabs: true
})
.then(() => {
    console.log('✅ Firebase persistence enabled');
})
.catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser does not support persistence');
    }
});

// ===== الفئة الرئيسية لإدارة Firebase =====
class FirebaseManager {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.storage = storage;
        this.functions = functions;
        this.analytics = analytics;
        
        this.currentUser = null;
        this.userData = null;
        this.listeners = [];
        this.offlineQueue = [];
        this.retryCount = 3;
        this.retryDelay = 1000;
        
        this.init();
    }

    // ===== تهيئة المدير =====
    init() {
        this.setupAuthListener();
        this.setupConnectionListener();
        this.setupOfflineListener();
        this.loadCachedData();
    }

    // ===== مستمع حالة المصادقة =====
    setupAuthListener() {
        this.auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                await this.loadUserData(user.uid);
                this.updateOnlineStatus(true);
                this.notifyListeners('auth', { type: 'login', user: this.userData });
                this.processOfflineQueue();
            } else {
                this.userData = null;
                this.notifyListeners('auth', { type: 'logout' });
            }
        });
    }

    // ===== مستمع حالة الاتصال =====
    setupConnectionListener() {
        this.db.collection('_connection').doc('info').onSnapshot((doc) => {
            const isConnected = doc.data()?.connected || false;
            this.notifyListeners('connection', { connected: isConnected });
        });
    }

    // ===== مستمع وضع عدم الاتصال =====
    setupOfflineListener() {
        window.addEventListener('online', () => {
            this.notifyListeners('online', { online: true });
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.notifyListeners('online', { online: false });
        });
    }

    // ===== تحميل بيانات المستخدم =====
    async loadUserData(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                this.userData = { id: doc.id, ...doc.data() };
                this.notifyListeners('user', { type: 'loaded', data: this.userData });
            } else {
                console.warn('⚠️ User data not found in Firestore');
                this.userData = null;
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.handleError(error);
        }
    }

    // ===== تحديث حالة الاتصال =====
    async updateOnlineStatus(isOnline) {
        if (!this.currentUser) return;

        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                isOnline: isOnline,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Error updating online status:', error);
            
            if (!navigator.onLine) {
                this.offlineQueue.push({
                    operation: 'updateOnlineStatus',
                    data: { isOnline },
                    timestamp: Date.now()
                });
            }
        }
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
                    console.error(`❌ Error in ${event} listener:`, error);
                }
            });
        }
    }

    // ===== معالجة الأخطاء =====
    handleError(error) {
        const errorCode = error.code || 'unknown';
        const errorMessage = error.message || 'Unknown error occurred';

        switch(errorCode) {
            case 'permission-denied':
                console.error('🔒 Permission denied');
                break;
            case 'not-found':
                console.error('🔍 Document not found');
                break;
            case 'already-exists':
                console.error('📄 Document already exists');
                break;
            case 'resource-exhausted':
                console.error('⚡ Quota exceeded');
                break;
            case 'failed-precondition':
                console.error('⚠️ Operation failed precondition');
                break;
            case 'aborted':
                console.error('🛑 Operation aborted');
                break;
            case 'out-of-range':
                console.error('📏 Out of range');
                break;
            case 'unimplemented':
                console.error('🔧 Operation not implemented');
                break;
            case 'internal':
                console.error('💥 Internal server error');
                break;
            case 'unavailable':
                console.error('📡 Service unavailable');
                break;
            case 'data-loss':
                console.error('💾 Data loss');
                break;
            case 'unauthenticated':
                console.error('🔐 Unauthenticated');
                break;
            default:
                console.error('❌ Firebase error:', errorCode, errorMessage);
        }

        this.notifyListeners('error', { code: errorCode, message: errorMessage });
    }

    // ===== معالجة قائمة الانتظار =====
    async processOfflineQueue() {
        if (!navigator.onLine || this.offlineQueue.length === 0) return;

        console.log(`📦 Processing ${this.offlineQueue.length} queued operations`);

        while (this.offlineQueue.length > 0) {
            const operation = this.offlineQueue.shift();
            
            try {
                await this.executeQueuedOperation(operation);
                console.log('✅ Queued operation completed:', operation.operation);
            } catch (error) {
                console.error('❌ Error processing queued operation:', error);
                this.offlineQueue.unshift(operation);
                break;
            }
        }
    }

    // ===== تنفيذ عملية في قائمة الانتظار =====
    async executeQueuedOperation(operation) {
        switch(operation.operation) {
            case 'updateOnlineStatus':
                await this.updateOnlineStatus(operation.data.isOnline);
                break;
            default:
                console.warn('⚠️ Unknown operation:', operation.operation);
        }
    }

    // ===== تحميل البيانات المخزنة =====
    loadCachedData() {
        try {
            const cached = localStorage.getItem('firebase_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.notifyListeners('cache', { data });
                console.log('📦 Loaded cached data');
            }
        } catch (error) {
            console.error('❌ Error loading cached data:', error);
        }
    }

    // ===== حفظ البيانات في المخزن المؤقت =====
    saveToCache(key, data) {
        try {
            const cache = JSON.parse(localStorage.getItem('firebase_cache') || '{}');
            cache[key] = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem('firebase_cache', JSON.stringify(cache));
        } catch (error) {
            console.error('❌ Error saving to cache:', error);
        }
    }

    // ===== الحصول من المخزن المؤقت =====
    getFromCache(key, maxAge = 3600000) {
        try {
            const cache = JSON.parse(localStorage.getItem('firebase_cache') || '{}');
            const item = cache[key];
            
            if (item && (Date.now() - item.timestamp) < maxAge) {
                return item.data;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error getting from cache:', error);
            return null;
        }
    }

    // ===== مسح المخزن المؤقت =====
    clearCache() {
        try {
            localStorage.removeItem('firebase_cache');
            console.log('🗑️ Cache cleared');
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
        }
    }

    // ===== تنفيذ عملية مع إعادة محاولة =====
    async withRetry(operation, data, retries = this.retryCount) {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation(data);
            } catch (error) {
                if (i === retries - 1) throw error;
                
                console.log(`🔄 Retry ${i + 1}/${retries} after ${this.retryDelay}ms`);
                await this.delay(this.retryDelay);
            }
        }
    }

    // ===== تأخير =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== تسجيل الخروج =====
    async logout() {
        if (!this.currentUser) return true;

        try {
            await this.updateOnlineStatus(false);
            await this.auth.signOut();
            this.currentUser = null;
            this.userData = null;
            this.notifyListeners('auth', { type: 'logout' });
            console.log('👋 Logged out successfully');
            return true;
        } catch (error) {
            console.error('❌ Error logging out:', error);
            this.handleError(error);
            return false;
        }
    }

    // ===== الحصول على البيانات الحالية =====
    getCurrentUser() {
        return this.currentUser;
    }

    getUserData() {
        return this.userData;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isOnline() {
        return navigator.onLine;
    }

    // ===== تدمير المدير =====
    destroy() {
        this.listeners = {};
        this.offlineQueue = [];
        console.log('💥 Firebase manager destroyed');
    }
}

// ===== الفئة المساعدة للتعامل مع التوكنات =====
class TokenManager {
    constructor(firebaseManager) {
        this.fm = firebaseManager;
        this.token = null;
        this.expiry = null;
        this.refreshInterval = 55 * 60 * 1000; // 55 دقيقة
    }

    // ===== الحصول على التوكن =====
    async getToken(forceRefresh = false) {
        if (!this.fm.currentUser) return null;

        try {
            if (forceRefresh || !this.token || this.isExpired()) {
                this.token = await this.fm.currentUser.getIdToken(forceRefresh);
                this.expiry = Date.now() + 55 * 60 * 1000;
                
                this.scheduleRefresh();
            }

            return this.token;
        } catch (error) {
            console.error('❌ Error getting token:', error);
            this.fm.handleError(error);
            return null;
        }
    }

    // ===== التحقق من انتهاء الصلاحية =====
    isExpired() {
        return !this.expiry || Date.now() >= this.expiry;
    }

    // ===== جدولة التحديث =====
    scheduleRefresh() {
        setTimeout(() => {
            this.getToken(true);
        }, this.refreshInterval);
    }

    // ===== إبطال التوكن =====
    revoke() {
        this.token = null;
        this.expiry = null;
    }
}

// ===== الفئة المساعدة للإحصائيات =====
class AnalyticsManager {
    constructor(firebaseManager) {
        this.fm = firebaseManager;
        this.analytics = firebaseManager.analytics;
        this.events = [];
    }

    // ===== تسجيل حدث =====
    logEvent(eventName, eventParams = {}) {
        if (!this.analytics) return;

        try {
            this.analytics.logEvent(eventName, {
                ...eventParams,
                timestamp: Date.now(),
                user_id: this.fm.currentUser?.uid
            });

            this.events.push({
                name: eventName,
                params: eventParams,
                timestamp: Date.now()
            });

            console.log(`📊 Event logged: ${eventName}`);
        } catch (error) {
            console.error('❌ Error logging event:', error);
        }
    }

    // ===== تسجيل شاشة =====
    setScreen(screenName, screenClass) {
        if (!this.analytics) return;

        try {
            this.analytics.setCurrentScreen(screenName, screenClass);
            console.log(`📱 Screen set: ${screenName}`);
        } catch (error) {
            console.error('❌ Error setting screen:', error);
        }
    }

    // ===== تسجيل مستخدم =====
    setUser(userId, userProperties = {}) {
        if (!this.analytics) return;

        try {
            this.analytics.setUserId(userId);
            this.analytics.setUserProperties(userProperties);
            console.log(`👤 User set: ${userId}`);
        } catch (error) {
            console.error('❌ Error setting user:', error);
        }
    }

    // ===== الحصول على الأحداث =====
    getEvents(limit = 100) {
        return this.events.slice(-limit);
    }

    // ===== تصدير الأحداث =====
    exportEvents() {
        const data = this.events.map(e => ({
            ...e,
            timestamp: new Date(e.timestamp).toISOString()
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== الفئة المساعدة للوظائف =====
class FunctionsManager {
    constructor(firebaseManager) {
        this.fm = firebaseManager;
        this.functions = firebaseManager.functions;
        this.cache = new Map();
    }

    // ===== استدعاء وظيفة =====
    async call(name, data = {}, options = {}) {
        if (!this.functions) {
            throw new Error('Firebase Functions not available');
        }

        const cacheKey = `${name}_${JSON.stringify(data)}`;
        
        if (options.useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < (options.cacheTime || 60000)) {
                console.log(`📦 Using cached result for ${name}`);
                return cached.result;
            }
        }

        try {
            const functionRef = this.functions.httpsCallable(name);
            const result = await functionRef(data);

            if (options.cache) {
                this.cache.set(cacheKey, {
                    result: result.data,
                    timestamp: Date.now()
                });
            }

            console.log(`✅ Function ${name} called successfully`);
            return result.data;
        } catch (error) {
            console.error(`❌ Error calling function ${name}:`, error);
            this.fm.handleError(error);
            throw error;
        }
    }

    // ===== مسح المخزن المؤقت =====
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Functions cache cleared');
    }
}

// ===== إنشاء المدير العام =====
const FirebaseManagerInstance = new FirebaseManager();
const TokenManagerInstance = new TokenManager(FirebaseManagerInstance);
const AnalyticsManagerInstance = new AnalyticsManager(FirebaseManagerInstance);
const FunctionsManagerInstance = new FunctionsManager(FirebaseManagerInstance);

// ===== تصدير المديرين =====
window.FirebaseManager = FirebaseManagerInstance;
window.TokenManager = TokenManagerInstance;
window.AnalyticsManager = AnalyticsManagerInstance;
window.FunctionsManager = FunctionsManagerInstance;

// ===== تصدير للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FirebaseManager: FirebaseManagerInstance,
        TokenManager: TokenManagerInstance,
        AnalyticsManager: AnalyticsManagerInstance,
        FunctionsManager: FunctionsManagerInstance,
        auth,
        db,
        storage,
        functions,
        analytics
    };
}

console.log('🚀 Firebase Core System initialized');
