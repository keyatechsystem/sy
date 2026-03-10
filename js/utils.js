function formatDate(timestamp, format = 'short') {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const formats = {
        'short': { year: 'numeric', month: 'numeric', day: 'numeric' },
        'long': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        'datetime': { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        'time': { hour: '2-digit', minute: '2-digit' }
    };
    return date.toLocaleDateString('ar-EG', formats[format] || formats.short);
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('✅ تم النسخ بنجاح', 'success');
        return true;
    } catch (err) {
        console.error('Copy failed:', err);
        showNotification('❌ فشل النسخ', 'error');
        return false;
    }
}

function timeAgo(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = { سنة: 31536000, شهر: 2592000, أسبوع: 604800, يوم: 86400, ساعة: 3600, دقيقة: 60, ثانية: 1 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `منذ ${interval} ${unit}${interval > 1 ? 'اً' : ''}`;
    }
    return 'الآن';
}

function calculateDuration(startTime, endTime = new Date()) {
    if (!startTime) return '0 دقيقة';
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} يوم ${diffHours % 24} ساعة`;
    if (diffHours > 0) return `${diffHours} ساعة ${diffMins % 60} دقيقة`;
    return `${diffMins} دقيقة`;
}

function analyzeDelay(ticket) {
    if (!ticket.createdAt || !ticket.updatedAt) return 'غير معروف';
    const created = ticket.createdAt.toDate();
    const updated = ticket.updatedAt.toDate();
    const now = new Date();
    const totalHours = (now - created) / (1000 * 60 * 60);
    if (totalHours < 24) return 'في الوقت المحدد';
    if (totalHours < 48) return 'تأخير بسيط';
    if (totalHours < 72) return 'تأخير متوسط';
    return 'تأخير كبير';
}

function exportToCSV(data, filename = 'export') {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${Date.now()}.csv`;
    a.click();
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^(01)[0-9]{9}$/;
    return re.test(phone);
}

function generateId(prefix = '') {
    return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatNumber(number) {
    return new Intl.NumberFormat('ar-EG').format(number);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) result[key] = value;
    return result;
}

window.utils = {
    formatDate, getInitials, copyToClipboard, timeAgo, calculateDuration,
    analyzeDelay, exportToCSV, isValidEmail, isValidPhone, generateId,
    formatNumber, getUrlParams
};
