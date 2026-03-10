/* ===== CYBERPUNK 2099 - نظام الماوس المخصص المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية للماوس =====
class CyberCursor {
    constructor() {
        // عناصر الماوس
        this.cursor = null;
        this.dot = null;
        this.trail = null;
        this.glow = null;
        this.ring = null;
        this.crosshair = null;
        
        // إعدادات الماوس
        this.settings = {
            enabled: true,
            speed: 0.15,
            trailLength: 10,
            glowSize: 100,
            ringSize: 40,
            colors: {
                primary: '#00f3ff',
                secondary: '#ff00ff',
                accent: '#ffff00',
                success: '#00ff9d',
                warning: '#ffb800',
                danger: '#ff3366',
                white: '#ffffff'
            },
            modes: {
                default: {
                    size: 40,
                    borderColor: '#00f3ff',
                    glowColor: 'rgba(0, 243, 255, 0.3)',
                    dotColor: '#ffffff'
                },
                hover: {
                    size: 60,
                    borderColor: '#ff00ff',
                    glowColor: 'rgba(255, 0, 255, 0.3)',
                    dotColor: '#ff00ff'
                },
                click: {
                    size: 30,
                    borderColor: '#ffff00',
                    glowColor: 'rgba(255, 255, 0, 0.4)',
                    dotColor: '#ffff00'
                },
                text: {
                    size: 4,
                    height: 30,
                    borderColor: '#00ff9d',
                    glowColor: 'rgba(0, 255, 157, 0.3)',
                    dotColor: '#00ff9d'
                },
                button: {
                    size: 50,
                    borderColor: '#ff00ff',
                    glowColor: 'rgba(255, 0, 255, 0.4)',
                    dotColor: '#ff00ff'
                },
                link: {
                    size: 45,
                    borderColor: '#00ff9d',
                    glowColor: 'rgba(0, 255, 157, 0.3)',
                    dotColor: '#00ff9d'
                },
                notAllowed: {
                    size: 40,
                    borderColor: '#ff3366',
                    glowColor: 'rgba(255, 51, 102, 0.3)',
                    dotColor: '#ff3366'
                },
                loading: {
                    size: 40,
                    borderColor: '#00f3ff',
                    glowColor: 'rgba(0, 243, 255, 0.3)',
                    dotColor: '#00f3ff',
                    spin: true
                }
            }
        };
        
        // حالة الماوس
        this.state = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            isVisible: true,
            isClicking: false,
            isHovering: false,
            currentMode: 'default',
            trailPositions: []
        };
        
        // تهيئة النظام
        this.init();
    }

    // ===== تهيئة النظام =====
    init() {
        this.createCursorElements();
        this.bindEvents();
        this.startAnimation();
        this.setupElementDetection();
        this.hideDefaultCursor();
    }

    // ===== إنشاء عناصر الماوس =====
    createCursorElements() {
        // إنشاء حاوية الماوس الرئيسية
        this.cursor = document.createElement('div');
        this.cursor.className = 'cyber-cursor';
        this.cursor.style.cssText = `
            position: fixed;
            width: ${this.settings.modes.default.size}px;
            height: ${this.settings.modes.default.size}px;
            border: 2px solid ${this.settings.modes.default.borderColor};
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: width 0.2s, height 0.2s, border-color 0.2s, background 0.2s;
            mix-blend-mode: difference;
            box-shadow: 0 0 20px ${this.settings.modes.default.glowColor};
            backdrop-filter: blur(1px);
        `;

        // إنشاء النقطة الداخلية
        this.dot = document.createElement('div');
        this.dot.className = 'cyber-cursor-dot';
        this.dot.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: ${this.settings.modes.default.dotColor};
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: background 0.2s;
            box-shadow: 0 0 15px ${this.settings.modes.default.dotColor};
        `;

        // إنشاء الأثر الخلفي
        this.trail = document.createElement('div');
        this.trail.className = 'cyber-cursor-trail';
        this.trail.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: ${this.settings.modes.default.glowColor};
            border-radius: 50%;
            pointer-events: none;
            z-index: 999998;
            transform: translate(-50%, -50%);
            filter: blur(5px);
            transition: all 0.1s;
            opacity: 0.5;
        `;

        // إنشاء التوهج
        this.glow = document.createElement('div');
        this.glow.className = 'cyber-cursor-glow';
        this.glow.style.cssText = `
            position: fixed;
            width: ${this.settings.glowSize}px;
            height: ${this.settings.glowSize}px;
            background: radial-gradient(circle, ${this.settings.modes.default.glowColor} 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999997;
            transform: translate(-50%, -50%);
            transition: all 0.3s;
            filter: blur(10px);
        `;

        // إنشاء الحلقة الخارجية
        this.ring = document.createElement('div');
        this.ring.className = 'cyber-cursor-ring';
        this.ring.style.cssText = `
            position: fixed;
            width: ${this.settings.ringSize}px;
            height: ${this.settings.ringSize}px;
            border: 1px solid ${this.settings.modes.default.borderColor};
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: all 0.3s;
            opacity: 0.5;
        `;

        // إنشاء خطوط التصويب (Crosshair)
        this.crosshair = document.createElement('div');
        this.crosshair.className = 'cyber-cursor-crosshair';
        this.crosshair.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            opacity: 0.3;
        `;

        // إضافة خطوط التصويب
        const crosshairH = document.createElement('div');
        crosshairH.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background: ${this.settings.modes.default.borderColor};
            transform: translateY(-50%);
        `;

        const crosshairV = document.createElement('div');
        crosshairV.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            width: 1px;
            height: 100%;
            background: ${this.settings.modes.default.borderColor};
            transform: translateX(-50%);
        `;

        this.crosshair.appendChild(crosshairH);
        this.crosshair.appendChild(crosshairV);

        // إضافة العناصر إلى الصفحة
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.dot);
        document.body.appendChild(this.trail);
        document.body.appendChild(this.glow);
        document.body.appendChild(this.ring);
        document.body.appendChild(this.crosshair);
    }

    // ===== ربط الأحداث =====
    bindEvents() {
        // حركة الماوس
        document.addEventListener('mousemove', (e) => {
            this.state.targetX = e.clientX;
            this.state.targetY = e.clientY;
            this.addTrailPoint(e.clientX, e.clientY);
        });

        // نقر الماوس
        document.addEventListener('mousedown', () => {
            this.state.isClicking = true;
            this.setMode('click');
        });

        document.addEventListener('mouseup', () => {
            this.state.isClicking = false;
            this.setMode(this.state.isHovering ? 'hover' : 'default');
        });

        // دخول/خروج النافذة
        document.addEventListener('mouseleave', () => {
            this.state.isVisible = false;
            this.hideAll();
        });

        document.addEventListener('mouseenter', () => {
            this.state.isVisible = true;
            this.showAll();
        });

        // عجلة الماوس
        document.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) {
                this.cursor.style.transform += ' scale(0.95)';
            } else {
                this.cursor.style.transform += ' scale(1.05)';
            }
            
            setTimeout(() => {
                this.cursor.style.transform = 'translate(-50%, -50%)';
            }, 100);
        });

        // النقر بالزر الأيمن
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.setMode('notAllowed');
            setTimeout(() => {
                this.setMode(this.state.isHovering ? 'hover' : 'default');
            }, 200);
        });
    }

    // ===== بدء حركة الماوس =====
    startAnimation() {
        const animate = () => {
            // حركة سلسة للمؤشر الرئيسي
            this.state.x += (this.state.targetX - this.state.x) * this.settings.speed;
            this.state.y += (this.state.targetY - this.state.y) * this.settings.speed;

            if (this.state.isVisible) {
                // تحديث موقع المؤشر الرئيسي
                this.cursor.style.left = this.state.x + 'px';
                this.cursor.style.top = this.state.y + 'px';

                // تحديث موقع النقطة
                this.dot.style.left = this.state.targetX + 'px';
                this.dot.style.top = this.state.targetY + 'px';

                // تحديث موقع الأثر
                this.updateTrail();

                // تحديث موقع التوهج
                this.glow.style.left = this.state.x + 'px';
                this.glow.style.top = this.state.y + 'px';

                // تحديث موقع الحلقة
                this.ring.style.left = this.state.x + 'px';
                this.ring.style.top = this.state.y + 'px';

                // تحديث موقع خطوط التصويب
                this.crosshair.style.left = this.state.targetX + 'px';
                this.crosshair.style.top = this.state.targetY + 'px';
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== إضافة نقطة أثر =====
    addTrailPoint(x, y) {
        this.state.trailPositions.push({ x, y });
        
        if (this.state.trailPositions.length > this.settings.trailLength) {
            this.state.trailPositions.shift();
        }
    }

    // ===== تحديث الأثر =====
    updateTrail() {
        if (this.state.trailPositions.length > 0) {
            const lastPos = this.state.trailPositions[0];
            this.trail.style.left = lastPos.x + 'px';
            this.trail.style.top = lastPos.y + 'px';
            
            // تغيير شفافية الأثر حسب المسافة
            const distance = Math.abs(lastPos.x - this.state.x) + Math.abs(lastPos.y - this.state.y);
            const opacity = Math.max(0.2, 1 - distance / 100);
            this.trail.style.opacity = opacity;
        }
    }

    // ===== إخفاء جميع عناصر الماوس =====
    hideAll() {
        this.cursor.style.opacity = '0';
        this.dot.style.opacity = '0';
        this.trail.style.opacity = '0';
        this.glow.style.opacity = '0';
        this.ring.style.opacity = '0';
        this.crosshair.style.opacity = '0';
    }

    // ===== إظهار جميع عناصر الماوس =====
    showAll() {
        this.cursor.style.opacity = '1';
        this.dot.style.opacity = '1';
        this.trail.style.opacity = '0.5';
        this.glow.style.opacity = '1';
        this.ring.style.opacity = '0.5';
        this.crosshair.style.opacity = '0.3';
    }

    // ===== إخفاء الماوس التقليدي =====
    hideDefaultCursor() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                cursor: none !important;
            }
            
            a, button, input, [role="button"], .clickable {
                cursor: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ===== تغيير نمط الماوس =====
    setMode(mode) {
        if (!this.settings.modes[mode]) return;

        this.state.currentMode = mode;
        const config = this.settings.modes[mode];

        if (mode === 'text') {
            this.cursor.style.width = config.size + 'px';
            this.cursor.style.height = config.height + 'px';
            this.cursor.style.borderRadius = '2px';
        } else {
            this.cursor.style.width = config.size + 'px';
            this.cursor.style.height = config.size + 'px';
            this.cursor.style.borderRadius = '50%';
        }

        this.cursor.style.borderColor = config.borderColor;
        this.cursor.style.boxShadow = `0 0 20px ${config.glowColor}`;
        this.dot.style.background = config.dotColor;
        this.dot.style.boxShadow = `0 0 15px ${config.dotColor}`;
        this.glow.style.background = `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`;
        this.ring.style.borderColor = config.borderColor;

        if (config.spin) {
            this.cursor.style.animation = 'cursorSpin 1s linear infinite';
        } else {
            this.cursor.style.animation = 'none';
        }
    }

    // ===== تحليل العناصر وتغيير النمط =====
    setupElementDetection() {
        // العناصر القابلة للتفاعل
        const interactiveElements = document.querySelectorAll(
            'a, button, input, textarea, select, [role="button"], .clickable, .neon-btn, .glass-card'
        );

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.state.isHovering = true;
                
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    this.setMode('text');
                } else if (el.tagName === 'BUTTON' || el.classList.contains('neon-btn')) {
                    this.setMode('button');
                } else if (el.tagName === 'A') {
                    this.setMode('link');
                } else {
                    this.setMode('hover');
                }
            });

            el.addEventListener('mouseleave', () => {
                this.state.isHovering = false;
                this.setMode(this.state.isClicking ? 'click' : 'default');
            });
        });

        // العناصر غير النشطة
        const disabledElements = document.querySelectorAll('[disabled], .disabled, .not-allowed');
        
        disabledElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.setMode('notAllowed');
            });

            el.addEventListener('mouseleave', () => {
                this.setMode('default');
            });
        });

        // عناصر التحميل
        const loadingElements = document.querySelectorAll('.loading, [data-loading]');
        
        loadingElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.setMode('loading');
            });

            el.addEventListener('mouseleave', () => {
                this.setMode('default');
            });
        });
    }

    // ===== إضافة تأثيرات خاصة =====
    addSpecialEffect(effect, element) {
        switch(effect) {
            case 'ripple':
                this.createRippleEffect(element);
                break;
            case 'pulse':
                this.createPulseEffect(element);
                break;
            case 'glitch':
                this.createGlitchEffect(element);
                break;
        }
    }

    // ===== إنشاء تأثير تموج =====
    createRippleEffect(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        ripple.style.cssText = `
            position: absolute;
            top: ${this.state.y - rect.top}px;
            left: ${this.state.x - rect.left}px;
            width: 0;
            height: 0;
            background: radial-gradient(circle, ${this.settings.modes.default.glowColor} 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: rippleEffect 1s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }

    // ===== إنشاء تأثير نبض =====
    createPulseEffect(element) {
        element.style.transition = 'all 0.3s';
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = `0 0 30px ${this.settings.modes.default.glowColor}`;

        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = 'none';
        }, 300);
    }

    // ===== إنشاء تأثير تشويش =====
    createGlitchEffect(element) {
        const originalText = element.textContent;
        const glitchText = originalText.split('').map(char => 
            Math.random() > 0.9 ? Math.random().toString(36)[2] : char
        ).join('');

        element.textContent = glitchText;
        element.style.color = this.settings.modes.default.borderColor;
        element.style.textShadow = `2px 2px ${this.settings.modes.secondary}`;

        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '';
            element.style.textShadow = '';
        }, 200);
    }
}

// ===== الفئة المساعدة للماوس المتعدد =====
class MultiCursor extends CyberCursor {
    constructor(count = 3) {
        super();
        this.cursorCount = count;
        this.cursors = [];
        this.createMultiCursors();
    }

    createMultiCursors() {
        for (let i = 1; i < this.cursorCount; i++) {
            const cursor = document.createElement('div');
            cursor.className = 'cyber-cursor-multi';
            cursor.style.cssText = `
                position: fixed;
                width: ${this.settings.modes.default.size - i * 5}px;
                height: ${this.settings.modes.default.size - i * 5}px;
                border: 1px solid ${this.settings.modes.default.borderColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: ${999999 - i};
                transform: translate(-50%, -50%);
                opacity: ${1 - i * 0.2};
                transition: all 0.3s;
            `;
            document.body.appendChild(cursor);
            this.cursors.push(cursor);
        }
    }

    updateMultiCursors() {
        this.cursors.forEach((cursor, index) => {
            const delay = (index + 1) * 50;
            setTimeout(() => {
                cursor.style.left = this.state.x + 'px';
                cursor.style.top = this.state.y + 'px';
            }, delay);
        });
    }
}

// ===== الفئة المساعدة للماوس مع جزيئات =====
class ParticleCursor extends CyberCursor {
    constructor() {
        super();
        this.particles = [];
        this.particleCount = 20;
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'cyber-cursor-particle';
            particle.style.cssText = `
                position: fixed;
                width: ${Math.random() * 5 + 2}px;
                height: ${Math.random() * 5 + 2}px;
                background: ${this.settings.modes.default.dotColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: 999990;
                opacity: 0.5;
                transition: all 0.1s;
            `;
            document.body.appendChild(particle);
            this.particles.push({
                element: particle,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 1,
                distance: Math.random() * 30 + 10
            });
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            particle.angle += 0.02 * particle.speed;
            
            const x = this.state.x + Math.cos(particle.angle) * particle.distance;
            const y = this.state.y + Math.sin(particle.angle) * particle.distance;
            
            particle.element.style.left = x + 'px';
            particle.element.style.top = y + 'px';
        });
    }
}

// ===== إضافة أنماط CSS للحركات =====
const style = document.createElement('style');
style.textContent = `
    @keyframes cursorSpin {
        0% {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }

    @keyframes rippleEffect {
        0% {
            width: 0;
            height: 0;
            opacity: 0.5;
        }
        100% {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }

    @keyframes cursorPulse {
        0%, 100% {
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
        }
    }

    @keyframes cursorGlitch {
        0%, 100% {
            filter: hue-rotate(0deg);
        }
        33% {
            filter: hue-rotate(90deg);
        }
        66% {
            filter: hue-rotate(180deg);
        }
    }

    @keyframes cursorTrail {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);

// ===== تهيئة الماوس عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    // اختيار نوع الماوس حسب الحاجة
    // new CyberCursor(); // ماوس عادي
    // new MultiCursor(5); // ماوس متعدد
    new ParticleCursor(); // ماوس مع جزيئات
});

// ===== تصدير الفئات للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CyberCursor,
        MultiCursor,
        ParticleCursor
    };
}
