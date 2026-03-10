// ===== نظام الماوس المخصص =====
class CustomCursor {
    constructor() {
        this.cursor = document.createElement('div');
        this.dot = document.createElement('div');
        this.posX = 0;
        this.posY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.speed = 0.15;
        
        this.init();
    }

    init() {
        // إنشاء عناصر الماوس
        this.cursor.className = 'custom-cursor';
        this.dot.className = 'cursor-dot';
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.dot);

        // إخفاء الماوس الأصلي
        document.body.style.cursor = 'none';

        // تتبع حركة الماوس
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            this.dot.style.left = this.mouseX + 'px';
            this.dot.style.top = this.mouseY + 'px';
        });

        // أحداث النقر
        document.addEventListener('mousedown', () => this.cursor.classList.add('click'));
        document.addEventListener('mouseup', () => this.cursor.classList.remove('click'));

        // مغادرة النافذة
        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
            this.dot.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
            this.dot.style.opacity = '1';
        });

        // بدء الحركة
        this.animate();
        
        // تحليل العناصر
        this.setupHoverEffects();
    }

    animate() {
        this.posX += (this.mouseX - this.posX) * this.speed;
        this.posY += (this.mouseY - this.posY) * this.speed;
        
        this.cursor.style.left = this.posX + 'px';
        this.cursor.style.top = this.posY + 'px';
        
        requestAnimationFrame(() => this.animate());
    }

    setupHoverEffects() {
        const hoverElements = document.querySelectorAll('a, button, input, .glass-card, .neon-btn');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
    }
}

// تشغيل الماوس
window.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();
});
