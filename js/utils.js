// دوال مساعدة عامة

// تنسيق التاريخ
function formatDate(timestamp, format = 'short') {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (format === 'short') {
        return date.toLocaleDateString('ar-EG');
    } else if (format === 'long') {
        return date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (format === 'datetime') {
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (format === 'time') {
        return date.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    return date.toLocaleDateString('ar-EG');
}

// الحصول على الأحرف الأولى من الاسم
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// نسخ النص إلى الحافظة
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('تم النسخ بنجاح', 'success');
        return true;
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('فشل النسخ', 'error');
        return false;
    }
}

// عرض إشعار مؤقت
function showToast(message, type = 'info', duration = 3000) {
    // إنشاء عنصر الإشعار إذا لم يكن موجوداً
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
        
        // إضافة التنسيقات
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 25px';
        toast.style.borderRadius = '10px';
        toast.style.color = 'white';
        toast.style.fontFamily = 'Cairo, sans-serif';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
    }

    // تخصيص اللون حسب النوع
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    // تعيين النص وإظهار الإشعار
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.bottom = '30px';

    // إخفاء الإشعار بعد المدة المحددة
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '20px';
    }, duration);
}

// تحميل ملف
function downloadFile(content, fileName, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

// تحويل JSON إلى CSV
function jsonToCSV(jsonData) {
    if (!jsonData || jsonData.length === 0) return '';
    
    const headers = Object.keys(jsonData[0]);
    const csvRows = [];
    
    // إضافة headers
    csvRows.push(headers.join(','));
    
    // إضافة البيانات
    for (const row of jsonData) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return JSON.stringify(value);
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// التحقق من صحة رقم الهاتف (مصري)
function isValidPhone(phone) {
    const re = /^(01[0-9]{9})$/;
    return re.test(phone);
}

// إنشاء معرف فريد
function generateId(prefix = '') {
    return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// تقطيع النص الطويل
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// إضافة تأثيرات حركية
function animateElement(element, animation, callback) {
    element.classList.add(animation);
    
    const handleAnimationEnd = () => {
        element.classList.remove(animation);
        element.removeEventListener('animationend', handleAnimationEnd);
        if (callback) callback();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
}

// تنسيق الأرقام
function formatNumber(number) {
    return new Intl.NumberFormat('ar-EG').format(number);
}

// تنسيق العملة
function formatCurrency(amount, currency = 'EGP') {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// الحصول على معلمات URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// تأخير تنفيذ دالة (debounce)
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// تحديث التاريخ والوقت بشكل مستمر
function startClock(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    function update() {
        const now = new Date();
        element.textContent = now.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    update();
    setInterval(update, 1000);
}

// تصدير الدوال
window.utils = {
    formatDate,
    getInitials,
    copyToClipboard,
    showToast,
    downloadFile,
    jsonToCSV,
    isValidEmail,
    isValidPhone,
    generateId,
    truncateText,
    animateElement,
    formatNumber,
    formatCurrency,
    getUrlParams,
    debounce,
    startClock
};
