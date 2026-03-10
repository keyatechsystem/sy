/* ===== CYBERPUNK 2099 - النظام المساعد المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية للدوال المساعدة =====
class Utils {
    constructor() {
        this.version = '1.0.0';
        this.cache = new Map();
        this.defaultOptions = {
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm:ss',
            currency: 'EGP',
            language: 'ar',
            timezone: 'Africa/Cairo'
        };
    }

    // ===== دوال التاريخ والوقت =====

    // تنسيق التاريخ
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        
        const d = this.parseDate(date);
        if (!d) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        const replacements = {
            'YYYY': year,
            'YY': String(year).slice(-2),
            'MM': month,
            'M': d.getMonth() + 1,
            'DD': day,
            'D': d.getDate(),
            'HH': hours,
            'H': d.getHours(),
            'mm': minutes,
            'm': d.getMinutes(),
            'ss': seconds,
            's': d.getSeconds()
        };

        return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, match => replacements[match]);
    }

    // تنسيق التاريخ والوقت بالعربية
    formatDateArabic(date, options = {}) {
        if (!date) return '';
        
        const d = this.parseDate(date);
        if (!d) return '';

        const months = {
            long: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            short: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        };

        const days = {
            long: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            short: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        };

        const monthType = options.month || 'long';
        const dayType = options.day || 'long';
        const includeTime = options.time !== false;

        const dayName = days[dayType][d.getDay()];
        const monthName = months[monthType][d.getMonth()];
        const day = d.getDate();
        const year = d.getFullYear();

        let result = `${dayName}، ${day} ${monthName} ${year}`;

        if (includeTime) {
            const hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const period = hours >= 12 ? 'مساءً' : 'صباحاً';
            const hour12 = hours % 12 || 12;
            result += `، ${hour12}:${minutes} ${period}`;
        }

        return result;
    }

    // حساب الوقت المنقضي
    timeAgo(date) {
        if (!date) return '';
        
        const d = this.parseDate(date);
        if (!d) return '';

        const now = new Date();
        const seconds = Math.floor((now - d) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        if (weeks < 4) return `منذ ${weeks} أسبوع`;
        if (months < 12) return `منذ ${months} شهر`;
        return `منذ ${years} سنة`;
    }

    // حساب المدة بين تاريخين
    durationBetween(start, end, format = 'auto') {
        const startDate = this.parseDate(start);
        const endDate = this.parseDate(end) || new Date();

        if (!startDate) return '';

        const diff = endDate - startDate;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (format === 'auto') {
            if (years > 0) return `${years} سنة`;
            if (months > 0) return `${months} شهر`;
            if (weeks > 0) return `${weeks} أسبوع`;
            if (days > 0) return `${days} يوم`;
            if (hours > 0) return `${hours} ساعة`;
            if (minutes > 0) return `${minutes} دقيقة`;
            return `${seconds} ثانية`;
        }

        const parts = [];
        if (format.includes('y') && years > 0) parts.push(`${years} سنة`);
        if (format.includes('m') && months > 0) parts.push(`${months} شهر`);
        if (format.includes('w') && weeks > 0) parts.push(`${weeks} أسبوع`);
        if (format.includes('d') && days > 0) parts.push(`${days} يوم`);
        if (format.includes('h') && hours > 0) parts.push(`${hours} ساعة`);
        if (format.includes('i') && minutes > 0) parts.push(`${minutes} دقيقة`);
        if (format.includes('s') && seconds > 0) parts.push(`${seconds} ثانية`);

        return parts.join(' و ');
    }

    // تحويل النص إلى تاريخ
    parseDate(date) {
        if (!date) return null;
        
        if (date instanceof Date) return date;
        
        if (date.toDate) return date.toDate();
        
        if (typeof date === 'string' || typeof date === 'number') {
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d;
        }
        
        return null;
    }

    // ===== دوال الأرقام =====

    // تنسيق الأرقام
    formatNumber(number, options = {}) {
        if (number === undefined || number === null) return '';
        
        const {
            decimals = 0,
            decimalSeparator = '.',
            thousandsSeparator = ',',
            prefix = '',
            suffix = ''
        } = options;

        const num = Number(number);
        if (isNaN(num)) return '';

        const parts = num.toFixed(decimals).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

        return prefix + parts.join(decimalSeparator) + suffix;
    }

    // تنسيق العملة
    formatCurrency(amount, currency = 'EGP', options = {}) {
        const {
            decimals = 2,
            symbol = true
        } = options;

        const symbols = {
            'EGP': 'ج.م',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'SAR': 'ر.س',
            'AED': 'د.إ'
        };

        const formatted = this.formatNumber(amount, { decimals });
        
        if (symbol) {
            return `${formatted} ${symbols[currency] || currency}`;
        }
        
        return `${formatted} ${currency}`;
    }

    // تنسيق النسبة المئوية
    formatPercent(value, decimals = 1) {
        return this.formatNumber(value * 100, { decimals }) + '%';
    }

    // ===== دوال النصوص =====

    // تقطيع النص
    truncate(text, length = 100, suffix = '...') {
        if (!text) return '';
        
        if (text.length <= length) return text;
        
        return text.substring(0, length) + suffix;
    }

    // تحويل إلى Slug
    slugify(text) {
        if (!text) return '';
        
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-z0-9-]/g, '')
            .replace(/-+/g, '-');
    }

    // تحويل النص إلى Camel Case
    toCamelCase(text) {
        if (!text) return '';
        
        return text
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, '');
    }

    // تحويل النص إلى Pascal Case
    toPascalCase(text) {
        if (!text) return '';
        
        return text
            .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
            .replace(/\s+/g, '');
    }

    // تحويل النص إلى Snake Case
    toSnakeCase(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, '_')
            .toLowerCase();
    }

    // تحويل النص إلى Kebab Case
    toKebabCase(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    // ===== دوال التحقق =====

    // التحقق من البريد الإلكتروني
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // التحقق من رقم الهاتف المصري
    isValidEgyptianPhone(phone) {
        const re = /^(01)[0-9]{9}$/;
        return re.test(phone);
    }

    // التحقق من رقم الهاتف السعودي
    isValidSaudiPhone(phone) {
        const re = /^(05)[0-9]{8}$/;
        return re.test(phone);
    }

    // التحقق من الرقم القومي المصري
    isValidEgyptianNationalID(id) {
        const re = /^[0-9]{14}$/;
        return re.test(id);
    }

    // التحقق من URL
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // التحقق من كلمة المرور القوية
    isStrongPassword(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        
        return {
            isValid: score >= 4,
            score: score,
            checks: checks
        };
    }

    // ===== دوال عشوائية =====

    // إنشاء رقم عشوائي بين رقمين
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // إنشاء نص عشوائي
    randomString(length = 10, charset = 'alphanumeric') {
        const charsets = {
            alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            numeric: '0123456789',
            hex: '0123456789abcdef',
            special: '!@#$%^&*()_+{}:"<>?|[];\',./\\'
        };

        const chars = charsets[charset] || charsets.alphanumeric;
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    // إنشاء ID فريد
    generateId(prefix = '') {
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // إنشاء UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ===== دوال الألوان =====

    // تحويل Hex إلى RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // تحويل RGB إلى Hex
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // تحويل RGB إلى HSL
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }

        return { h, s, l };
    }

    // ===== دوال التخزين =====

    // حفظ في التخزين المحلي
    setItem(key, value, expiry = null) {
        const item = {
            value: value,
            timestamp: Date.now()
        };

        if (expiry) {
            item.expiry = Date.now() + expiry;
        }

        localStorage.setItem(key, JSON.stringify(item));
    }

    // قراءة من التخزين المحلي
    getItem(key) {
        const item = localStorage.getItem(key);
        
        if (!item) return null;

        try {
            const data = JSON.parse(item);
            
            if (data.expiry && Date.now() > data.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            return data.value;
        } catch {
            return null;
        }
    }

    // حفظ في الجلسة
    setSessionItem(key, value) {
        sessionStorage.setItem(key, JSON.stringify({
            value: value,
            timestamp: Date.now()
        }));
    }

    // قراءة من الجلسة
    getSessionItem(key) {
        const item = sessionStorage.getItem(key);
        
        if (!item) return null;

        try {
            const data = JSON.parse(item);
            return data.value;
        } catch {
            return null;
        }
    }

    // ===== دوال المصفوفات =====

    // ترتيب المصفوفة
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = this.getNestedValue(a, key);
            const bVal = this.getNestedValue(b, key);

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    // فلترة المصفوفة
    filterBy(array, filters) {
        return array.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                const itemValue = this.getNestedValue(item, key);
                
                if (Array.isArray(value)) {
                    if (!value.includes(itemValue)) return false;
                } else if (typeof value === 'object' && value !== null) {
                    if (value.min !== undefined && itemValue < value.min) return false;
                    if (value.max !== undefined && itemValue > value.max) return false;
                } else {
                    if (itemValue !== value) return false;
                }
            }
            return true;
        });
    }

    // تجميع المصفوفة
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const value = this.getNestedValue(item, key);
            
            if (!result[value]) {
                result[value] = [];
            }
            
            result[value].push(item);
            return result;
        }, {});
    }

    // ===== دوال الكائنات =====

    // الحصول على قيمة متداخلة
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // دمج الكائنات
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.deepMerge(target, ...sources);
    }

    // نسخ عميق
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                cloned[key] = this.deepClone(obj[key]);
            }
            return cloned;
        }
    }

    // ===== دوال التحقق من النوع =====

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    isEmpty(obj) {
        return obj && Object.keys(obj).length === 0;
    }

    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    // ===== دوال المسار =====

    // الحصول على معلمات URL
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};

        for (const [key, value] of params) {
            result[key] = value;
        }

        return result;
    }

    // بناء URL مع المعلمات
    buildUrl(base, params = {}) {
        const url = new URL(base, window.location.origin);
        
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        return url.toString();
    }

    // ===== دوال النسخ =====

    // نسخ النص إلى الحافظة
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true, message: 'تم النسخ بنجاح' };
        } catch (err) {
            console.error('Copy failed:', err);
            
            // طريقة بديلة
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return { success: true, message: 'تم النسخ بنجاح' };
            } catch {
                document.body.removeChild(textarea);
                return { success: false, message: 'فشل النسخ' };
            }
        }
    }

    // ===== دوال التنزيل =====

    // تنزيل نص كملف
    downloadText(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // تنزيل JSON كملف
    downloadJSON(data, filename) {
        this.downloadText(
            JSON.stringify(data, null, 2),
            filename.endsWith('.json') ? filename : filename + '.json',
            'application/json'
        );
    }

    // تنزيل CSV كملف
    downloadCSV(data, filename) {
        const headers = Object.keys(data[0] || {});
        const rows = data.map(item => 
            headers.map(header => JSON.stringify(item[header] || '')).join(',')
        );
        
        const csv = [headers.join(','), ...rows].join('\n');
        
        this.downloadText(
            '\uFEFF' + csv,
            filename.endsWith('.csv') ? filename : filename + '.csv',
            'text/csv;charset=utf-8'
        );
    }

    // ===== دوال التأخير =====

    // تأخير
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Debounce
    debounce(func, wait) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle
    throttle(func, limit) {
        let inThrottle;
        
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== دوال القياس =====

    // تحويل وحدات التخزين
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // تحويل وحدات الوقت
    formatDuration(seconds, format = 'auto') {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (format === 'auto') {
            if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
            if (minutes > 0) return `${minutes} دقيقة ${secs} ثانية`;
            return `${secs} ثانية`;
        }

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // ===== دوال الصفحة =====

    // التمرير إلى الأعلى
    scrollToTop(behavior = 'smooth') {
        window.scrollTo({
            top: 0,
            behavior: behavior
        });
    }

    // التمرير إلى العنصر
    scrollToElement(element, offset = 0, behavior = 'smooth') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        
        window.scrollTo({
            top: elementPosition - offset,
            behavior: behavior
        });
    }

    // ===== دوال التصميم =====

    // إضافة كلاس للعنصر
    addClass(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.add(className);
        }
    }

    // إزالة كلاس من العنصر
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.remove(className);
        }
    }

    // تبديل كلاس في العنصر
    toggleClass(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.toggle(className);
        }
    }

    // ===== دوال الأحداث =====

    // إضافة مستمع حدث
    on(element, event, handler, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    // إزالة مستمع حدث
    off(element, event, handler) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    // تشغيل حدث مرة واحدة
    once(element, event, handler, options = {}) {
        this.on(element, event, handler, { ...options, once: true });
    }

    // ===== دوال السمة =====

    // الحصول على سمة
    getAttribute(element, attribute) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        return element ? element.getAttribute(attribute) : null;
    }

    // تعيين سمة
    setAttribute(element, attribute, value) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    // إزالة سمة
    removeAttribute(element, attribute) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.removeAttribute(attribute);
        }
    }

    // ===== دوال الطباعة =====

    // طباعة الصفحة
    print() {
        window.print();
    }

    // طباعة عنصر معين
    printElement(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return;

        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>طباعة</title>
                <style>
                    body { font-family: 'Cairo', sans-serif; padding: 20px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${element.innerHTML}</body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }
}

// ===== إنشاء النظام المساعد =====
const UtilsInstance = new Utils();

// ===== تصدير النظام =====
window.Utils = UtilsInstance;

// ===== تصدير للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UtilsInstance;
}

console.log('🛠️ Utils System initialized');
