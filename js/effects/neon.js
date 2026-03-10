/* ===== CYBERPUNK 2099 - نظام تأثيرات النيون المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية لتأثيرات النيون =====
class NeonSystem {
    constructor(options = {}) {
        // إعدادات النظام
        this.settings = {
            enabled: true,
            intensity: options.intensity || 1,
            speed: options.speed || 1,
            colors: options.colors || {
                primary: '#00f3ff',
                secondary: '#ff00ff',
                accent: '#ffff00',
                success: '#00ff9d',
                warning: '#ffb800',
                danger: '#ff3366'
            },
            effects: {
                glow: options.glow !== false,
                pulse: options.pulse !== false,
                flicker: options.flicker || false,
                shimmer: options.shimmer || false,
                glitch: options.glitch || false,
                rainbow: options.rainbow || false,
                scanline: options.scanline || false,
                border: options.border !== false,
                text: options.text !== false
            },
            animationSpeed: options.animationSpeed || 0.5,
            pulseSpeed: options.pulseSpeed || 2,
            flickerSpeed: options.flickerSpeed || 0.1,
            shimmerSpeed: options.shimmerSpeed || 3,
            glitchSpeed: options.glitchSpeed || 0.05,
            rainbowSpeed: options.rainbowSpeed || 1,
            scanlineSpeed: options.scanlineSpeed || 5
        };

        // عناصر النيون
        this.elements = [];
        this.canvas = null;
        this.ctx = null;
        this.scanlines = [];

        // حالة النظام
        this.state = {
            time: 0,
            hue: 0,
            pulse: 0,
            flicker: 0,
            active: true
        };

        // تهيئة النظام
        this.init();
    }

    // ===== تهيئة النظام =====
    init() {
        this.findElements();
        this.createCanvas();
        this.bindEvents();
        this.startAnimation();
    }

    // ===== البحث عن عناصر النيون =====
    findElements() {
        // العناصر التي تحمل كلاس neon
        const neonElements = document.querySelectorAll('.neon, .neon-title, .neon-btn, .neon-input, [data-neon]');
        
        neonElements.forEach(element => {
            const type = element.classList.contains('neon-title') ? 'title' :
                        element.classList.contains('neon-btn') ? 'button' :
                        element.classList.contains('neon-input') ? 'input' : 'default';

            this.elements.push({
                element: element,
                type: type,
                intensity: parseFloat(element.dataset.neonIntensity) || 1,
                color: element.dataset.neonColor || this.settings.colors.primary,
                effects: {
                    glow: element.dataset.neonGlow !== 'false',
                    pulse: element.dataset.neonPulse === 'true',
                    flicker: element.dataset.neonFlicker === 'true',
                    shimmer: element.dataset.neonShimmer === 'true',
                    glitch: element.dataset.neonGlitch === 'true'
                },
                originalColor: null,
                originalShadow: null,
                originalBorder: null,
                originalText: null
            });

            // حفظ القيم الأصلية
            const style = window.getComputedStyle(element);
            this.elements[this.elements.length - 1].originalColor = style.color;
            this.elements[this.elements.length - 1].originalShadow = style.textShadow || style.boxShadow;
            this.elements[this.elements.length - 1].originalBorder = style.borderColor;
            this.elements[this.elements.length - 1].originalText = element.textContent;
        });

        // العناصر التي تحمل data-neon-effect
        const effectElements = document.querySelectorAll('[data-neon-effect]');
        
        effectElements.forEach(element => {
            const effect = element.dataset.neonEffect;
            const intensity = parseFloat(element.dataset.neonIntensity) || 1;

            this.elements.push({
                element: element,
                type: 'effect',
                effect: effect,
                intensity: intensity,
                color: element.dataset.neonColor || this.settings.colors.primary,
                originalStyle: element.style.cssText
            });
        });
    }

    // ===== إنشاء كانفاس لتأثيرات الخلفية =====
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9998';

        document.body.appendChild(this.canvas);
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // ===== تغيير حجم الكانفاس =====
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ===== ربط الأحداث =====
    bindEvents() {
        // تغيير الإعدادات ديناميكياً
        document.addEventListener('neonChange', (e) => {
            if (e.detail) {
                Object.assign(this.settings, e.detail);
            }
        });

        // تفعيل/تعطيل تأثير معين
        document.addEventListener('neonToggle', (e) => {
            if (e.detail && e.detail.effect) {
                this.settings.effects[e.detail.effect] = e.detail.enabled;
            }
        });
    }

    // ===== بدء الحركة =====
    startAnimation() {
        const animate = () => {
            this.update();
            this.applyEffects();
            this.drawCanvasEffects();
            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== تحديث الحالة =====
    update() {
        this.state.time += 0.01 * this.settings.animationSpeed;
        this.state.hue = (this.state.hue + 0.1 * this.settings.rainbowSpeed) % 360;
        this.state.pulse = Math.sin(this.state.time * this.settings.pulseSpeed) * 0.5 + 0.5;
        this.state.flicker = Math.random() * this.settings.flickerSpeed;
    }

    // ===== تطبيق التأثيرات =====
    applyEffects() {
        this.elements.forEach(element => {
            if (this.settings.effects.glow && element.effects?.glow !== false) {
                this.applyGlowEffect(element);
            }

            if (this.settings.effects.pulse && element.effects?.pulse) {
                this.applyPulseEffect(element);
            }

            if (this.settings.effects.flicker && element.effects?.flicker) {
                this.applyFlickerEffect(element);
            }

            if (this.settings.effects.shimmer && element.effects?.shimmer) {
                this.applyShimmerEffect(element);
            }

            if (this.settings.effects.glitch && element.effects?.glitch) {
                this.applyGlitchEffect(element);
            }

            if (this.settings.effects.rainbow) {
                this.applyRainbowEffect(element);
            }

            if (this.settings.effects.border) {
                this.applyBorderEffect(element);
            }

            if (this.settings.effects.text && element.type === 'title') {
                this.applyTextEffect(element);
            }

            // تطبيق تأثير خاص
            if (element.type === 'effect' && element.effect) {
                this.applySpecialEffect(element);
            }
        });
    }

    // ===== تأثير التوهج =====
    applyGlowEffect(element) {
        const intensity = element.intensity * this.settings.intensity;
        const color = element.color || this.settings.colors.primary;
        
        const glowSize = 10 * intensity * (this.state.pulse * 0.5 + 0.5);
        
        if (element.type === 'title' || element.type === 'text') {
            element.element.style.textShadow = `
                0 0 ${glowSize}px ${color},
                0 0 ${glowSize * 2}px ${color},
                0 0 ${glowSize * 3}px ${color}
            `;
        } else {
            element.element.style.boxShadow = `
                0 0 ${glowSize}px ${color},
                0 0 ${glowSize * 2}px ${color},
                inset 0 0 ${glowSize}px ${color}
            `;
        }
    }

    // ===== تأثير النبض =====
    applyPulseEffect(element) {
        const scale = 1 + (this.state.pulse * 0.1);
        element.element.style.transform = `scale(${scale})`;
    }

    // ===== تأثير الوميض =====
    applyFlickerEffect(element) {
        if (this.state.flicker < 0.1) {
            element.element.style.opacity = 0.8;
        } else if (this.state.flicker < 0.2) {
            element.element.style.opacity = 1;
        } else if (this.state.flicker < 0.3) {
            element.element.style.opacity = 0.9;
        } else if (this.state.flicker < 0.4) {
            element.element.style.opacity = 1;
        } else if (this.state.flicker < 0.5) {
            element.element.style.opacity = 0.7;
        } else {
            element.element.style.opacity = 1;
        }
    }

    // ===== تأثير اللمعان =====
    applyShimmerEffect(element) {
        const position = (this.state.time * 100) % 200 - 100;
        
        element.element.style.background = `
            linear-gradient(
                ${position}deg,
                transparent 0%,
                ${element.color}40 50%,
                transparent 100%
            )
        `;
    }

    // ===== تأثير التشويش =====
    applyGlitchEffect(element) {
        if (Math.random() < 0.01) {
            const glitchX = (Math.random() - 0.5) * 10;
            const glitchY = (Math.random() - 0.5) * 10;
            
            element.element.style.transform = `translate(${glitchX}px, ${glitchY}px)`;
            
            setTimeout(() => {
                element.element.style.transform = '';
            }, 50);
        }
    }

    // ===== تأثير قوس قزح =====
    applyRainbowEffect(element) {
        const hue = this.state.hue;
        const color = `hsl(${hue}, 100%, 50%)`;
        
        if (element.type === 'title' || element.type === 'text') {
            element.element.style.color = color;
        } else {
            element.element.style.borderColor = color;
            element.element.style.backgroundColor = `${color}20`;
        }
    }

    // ===== تأثير الحدود =====
    applyBorderEffect(element) {
        if (element.type === 'input' || element.type === 'button') {
            const pulseIntensity = this.state.pulse * 0.5 + 0.5;
            element.element.style.borderWidth = `${2 * pulseIntensity}px`;
        }
    }

    // ===== تأثير النص =====
    applyTextEffect(element) {
        if (element.type === 'title') {
            const originalText = element.originalText;
            const glitchChars = '!@#$%^&*()_+{}:"<>?|[];\',./';
            
            if (Math.random() < 0.02) {
                const glitchedText = originalText.split('').map(char => 
                    Math.random() < 0.1 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
                ).join('');
                
                element.element.textContent = glitchedText;
                
                setTimeout(() => {
                    element.element.textContent = originalText;
                }, 100);
            }
        }
    }

    // ===== تطبيق تأثير خاص =====
    applySpecialEffect(element) {
        switch(element.effect) {
            case 'scanline':
                this.createScanlineEffect(element);
                break;
            case 'matrix':
                this.createMatrixEffect(element);
                break;
            case 'cyber':
                this.createCyberEffect(element);
                break;
        }
    }

    // ===== تأثير خطوط المسح =====
    createScanlineEffect(element) {
        const scanline = document.createElement('div');
        scanline.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: ${element.color};
            opacity: 0.3;
            animation: scanline ${this.settings.scanlineSpeed}s linear infinite;
            pointer-events: none;
        `;

        element.element.style.position = 'relative';
        element.element.appendChild(scanline);

        this.scanlines.push(scanline);
    }

    // ===== تأثير الماتريكس =====
    createMatrixEffect(element) {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const originalText = element.element.textContent;
        
        const interval = setInterval(() => {
            if (!this.settings.enabled) {
                clearInterval(interval);
                return;
            }

            const matrixText = originalText.split('').map(() => 
                chars[Math.floor(Math.random() * chars.length)]
            ).join('');

            element.element.textContent = matrixText;
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            element.element.textContent = originalText;
        }, 2000);
    }

    // ===== تأثير سايبر =====
    createCyberEffect(element) {
        const originalHTML = element.element.innerHTML;
        
        element.element.innerHTML = originalHTML.split('').map(char => 
            `<span style="animation: glitchText 0.5s infinite; display: inline-block;">${char}</span>`
        ).join('');
    }

    // ===== رسم تأثيرات الكانفاس =====
    drawCanvasEffects() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.settings.effects.scanline) {
            this.drawScanlines();
        }

        if (this.settings.effects.glitch) {
            this.drawGlitch();
        }

        if (this.settings.effects.rainbow) {
            this.drawRainbowOverlay();
        }
    }

    // ===== رسم خطوط المسح =====
    drawScanlines() {
        this.ctx.strokeStyle = `rgba(0, 243, 255, 0.1)`;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    // ===== رسم تشويش =====
    drawGlitch() {
        if (Math.random() < 0.05) {
            const glitchHeight = Math.random() * 100 + 50;
            const glitchY = Math.random() * (this.canvas.height - glitchHeight);

            this.ctx.fillStyle = `rgba(255, 0, 255, ${Math.random() * 0.3})`;
            this.ctx.fillRect(0, glitchY, this.canvas.width, glitchHeight);
        }
    }

    // ===== رسم طبقة قوس قزح =====
    drawRainbowOverlay() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        
        for (let i = 0; i <= 360; i += 60) {
            gradient.addColorStop(i / 360, `hsla(${i}, 100%, 50%, 0.05)`);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // ===== إضافة عنصر نيون جديد =====
    addElement(element, options = {}) {
        this.elements.push({
            element: element,
            type: options.type || 'default',
            intensity: options.intensity || 1,
            color: options.color || this.settings.colors.primary,
            effects: options.effects || {
                glow: true,
                pulse: false,
                flicker: false,
                shimmer: false,
                glitch: false
            },
            originalColor: null,
            originalShadow: null,
            originalBorder: null,
            originalText: element.textContent
        });
    }

    // ===== إزالة عنصر نيون =====
    removeElement(element) {
        const index = this.elements.findIndex(e => e.element === element);
        
        if (index !== -1) {
            this.elements.splice(index, 1);
        }
    }

    // ===== تغيير الشدة =====
    setIntensity(intensity) {
        this.settings.intensity = intensity;
    }

    // ===== تغيير السرعة =====
    setSpeed(speed) {
        this.settings.animationSpeed = speed;
    }

    // ===== تفعيل/تعطيل تأثير معين =====
    toggleEffect(effect, enabled) {
        if (this.settings.effects.hasOwnProperty(effect)) {
            this.settings.effects[effect] = enabled;
        }
    }

    // ===== تفعيل/تعطيل النظام =====
    toggle(enable) {
        this.settings.enabled = enable;
        
        if (!enable) {
            this.resetAllElements();
        }
    }

    // ===== إعادة تعيين كل العناصر =====
    resetAllElements() {
        this.elements.forEach(element => {
            element.element.style.cssText = element.originalStyle || '';
            element.element.style.textShadow = element.originalShadow || '';
            element.element.style.boxShadow = element.originalShadow || '';
            element.element.style.borderColor = element.originalBorder || '';
            element.element.style.color = element.originalColor || '';
            element.element.textContent = element.originalText || '';
        });

        this.scanlines.forEach(scanline => scanline.remove());
        this.scanlines = [];
    }

    // ===== تدمير النظام =====
    destroy() {
        this.resetAllElements();
        this.canvas.remove();
        this.elements = [];
        this.scanlines = [];
    }
}

// ===== نظام نيون متقدم =====
class AdvancedNeonSystem extends NeonSystem {
    constructor(options = {}) {
        super(options);

        this.particles = [];
        this.initParticles();
    }

    // ===== تهيئة الجزيئات =====
    initParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: this.settings.colors.primary,
                life: 100
            });
        }
    }

    // ===== تحديث الجزيئات =====
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.5;

            if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
            if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

            if (particle.life <= 0) {
                particle.life = 100;
                particle.x = Math.random() * window.innerWidth;
                particle.y = Math.random() * window.innerHeight;
            }
        });
    }

    // ===== رسم الجزيئات =====
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 100 * 0.5;
            this.ctx.fill();

            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.ctx.globalAlpha = 1;
    }

    // ===== رسم التأثيرات =====
    drawCanvasEffects() {
        super.drawCanvasEffects();
        this.updateParticles();
        this.drawParticles();
    }

    // ===== تدمير النظام =====
    destroy() {
        super.destroy();
        this.particles = [];
    }
}

// ===== إضافة أنماط CSS للحركات =====
const style = document.createElement('style');
style.textContent = `
    @keyframes scanline {
        0% {
            top: -10px;
        }
        100% {
            top: 110%;
        }
    }

    @keyframes glitchText {
        0%, 100% {
            transform: translate(0);
        }
        20% {
            transform: translate(-2px, 2px);
        }
        40% {
            transform: translate(2px, -2px);
        }
        60% {
            transform: translate(-2px, -2px);
        }
        80% {
            transform: translate(2px, 2px);
        }
    }

    @keyframes neonPulse {
        0%, 100% {
            opacity: 1;
            filter: brightness(1);
        }
        50% {
            opacity: 0.8;
            filter: brightness(1.2);
        }
    }

    @keyframes neonFlicker {
        0%, 100% {
            opacity: 1;
        }
        10% {
            opacity: 0.8;
        }
        20% {
            opacity: 1;
        }
        30% {
            opacity: 0.6;
        }
        40% {
            opacity: 1;
        }
        50% {
            opacity: 0.9;
        }
        60% {
            opacity: 1;
        }
        70% {
            opacity: 0.7;
        }
        80% {
            opacity: 1;
        }
        90% {
            opacity: 0.5;
        }
    }
`;

document.head.appendChild(style);

// ===== تهيئة النظام عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    // اختيار نوع النظام حسب الحاجة
    // new NeonSystem(); // نظام عادي
    new AdvancedNeonSystem(); // نظام متقدم
});

// ===== تصدير الفئات للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NeonSystem,
        AdvancedNeonSystem
    };
}
