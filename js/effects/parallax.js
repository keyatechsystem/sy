/* ===== CYBERPUNK 2099 - نظام البارالاكس المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية للبارالاكس =====
class ParallaxSystem {
    constructor(options = {}) {
        // إعدادات النظام
        this.settings = {
            enabled: true,
            speed: options.speed || 0.1,
            intensity: options.intensity || 1,
            invert: options.invert || false,
            smooth: options.smooth !== false,
            smoothFactor: options.smoothFactor || 0.1,
            reverse: options.reverse || false,
            limitX: options.limitX || 50,
            limitY: options.limitY || 50,
            rotate: options.rotate || false,
            rotateIntensity: options.rotateIntensity || 0.01,
            scale: options.scale || false,
            scaleIntensity: options.scaleIntensity || 0.1,
            blur: options.blur || false,
            blurIntensity: options.blurIntensity || 0.5,
            opacity: options.opacity || false,
            opacityIntensity: options.opacityIntensity || 0.5,
            interactive: options.interactive !== false,
            mouseMultiplier: options.mouseMultiplier || 1,
            scrollMultiplier: options.scrollMultiplier || 1,
            gyroscope: options.gyroscope || false,
            gyroscopeMultiplier: options.gyroscopeMultiplier || 1,
            layers: options.layers || []
        };

        // حالة النظام
        this.state = {
            mouseX: 0,
            mouseY: 0,
            scrollX: 0,
            scrollY: 0,
            gyroX: 0,
            gyroY: 0,
            targetX: 0,
            targetY: 0,
            currentX: 0,
            currentY: 0,
            lastX: 0,
            lastY: 0,
            velocityX: 0,
            velocityY: 0
        };

        // العناصر
        this.layers = [];
        this.elements = [];

        // إحصائيات
        this.stats = {
            frameCount: 0,
            fps: 0,
            lastTime: performance.now(),
            frames: 0
        };

        // تهيئة النظام
        this.init();
    }

    // ===== تهيئة النظام =====
    init() {
        this.findLayers();
        this.registerElements();
        this.bindEvents();
        this.startAnimation();
        this.startStatsMonitoring();
    }

    // ===== البحث عن الطبقات =====
    findLayers() {
        // البحث عن العناصر التي تحتوي على data-parallax
        const elements = document.querySelectorAll('[data-parallax]');
        
        elements.forEach((element, index) => {
            const speed = parseFloat(element.dataset.parallaxSpeed) || this.settings.speed;
            const direction = element.dataset.parallaxDirection || 'both';
            const invert = element.dataset.parallaxInvert === 'true' ? !this.settings.invert : this.settings.invert;
            
            this.layers.push({
                element: element,
                speed: speed,
                direction: direction,
                invert: invert,
                originalX: 0,
                originalY: 0,
                originalZ: 0,
                currentX: 0,
                currentY: 0,
                currentZ: 0,
                width: element.offsetWidth,
                height: element.offsetHeight,
                offsetLeft: element.offsetLeft,
                offsetTop: element.offsetTop
            });
        });

        // البحث عن العناصر التي تحتوي على class parallax
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach((element, index) => {
            const speed = parseFloat(element.dataset.speed) || this.settings.speed;
            
            this.layers.push({
                element: element,
                speed: speed,
                direction: 'both',
                invert: this.settings.invert,
                originalX: 0,
                originalY: 0,
                originalZ: 0,
                currentX: 0,
                currentY: 0,
                currentZ: 0,
                width: element.offsetWidth,
                height: element.offsetHeight,
                offsetLeft: element.offsetLeft,
                offsetTop: element.offsetTop
            });
        });
    }

    // ===== تسجيل العناصر الإضافية =====
    registerElements() {
        if (this.settings.layers.length > 0) {
            this.settings.layers.forEach(layer => {
                this.layers.push({
                    element: layer.element,
                    speed: layer.speed || this.settings.speed,
                    direction: layer.direction || 'both',
                    invert: layer.invert || this.settings.invert,
                    originalX: 0,
                    originalY: 0,
                    originalZ: 0,
                    currentX: 0,
                    currentY: 0,
                    currentZ: 0,
                    width: layer.element.offsetWidth,
                    height: layer.element.offsetHeight,
                    offsetLeft: layer.element.offsetLeft,
                    offsetTop: layer.element.offsetTop
                });
            });
        }
    }

    // ===== ربط الأحداث =====
    bindEvents() {
        if (this.settings.interactive) {
            // حركة الماوس
            document.addEventListener('mousemove', (e) => {
                this.state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
                this.state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
                
                this.updateTargetPosition();
            });

            // التمرير
            window.addEventListener('scroll', (e) => {
                this.state.scrollX = window.scrollX / (document.body.scrollWidth - window.innerWidth);
                this.state.scrollY = window.scrollY / (document.body.scrollHeight - window.innerHeight);
                
                this.updateTargetPosition();
            });

            // تغيير حجم النافذة
            window.addEventListener('resize', () => {
                this.updateElementDimensions();
            });
        }

        // الجيروسكوب للأجهزة المحمولة
        if (this.settings.gyroscope && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.state.gyroX = (e.gamma / 90) * this.settings.gyroscopeMultiplier;
                this.state.gyroY = (e.beta / 90) * this.settings.gyroscopeMultiplier;
                
                this.updateTargetPosition();
            });
        }
    }

    // ===== تحديث الموضع المستهدف =====
    updateTargetPosition() {
        let targetX = 0;
        let targetY = 0;

        // تأثير الماوس
        if (this.settings.interactive) {
            targetX += this.state.mouseX * this.settings.mouseMultiplier;
            targetY += this.state.mouseY * this.settings.mouseMultiplier;
        }

        // تأثير التمرير
        targetX += this.state.scrollX * this.settings.scrollMultiplier;
        targetY += this.state.scrollY * this.settings.scrollMultiplier;

        // تأثير الجيروسكوب
        if (this.settings.gyroscope) {
            targetX += this.state.gyroX;
            targetY += this.state.gyroY;
        }

        // تطبيق الانعكاس
        if (this.settings.reverse) {
            targetX = -targetX;
            targetY = -targetY;
        }

        // تطبيق الحدود
        targetX = Math.max(-1, Math.min(1, targetX)) * this.settings.limitX;
        targetY = Math.max(-1, Math.min(1, targetY)) * this.settings.limitY;

        this.state.targetX = targetX;
        this.state.targetY = targetY;
    }

    // ===== بدء الحركة =====
    startAnimation() {
        const animate = () => {
            this.update();
            this.applyParallax();
            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== تحديث الحالة =====
    update() {
        // تحديث السرعة
        this.state.velocityX = this.state.targetX - this.state.currentX;
        this.state.velocityY = this.state.targetY - this.state.currentY;

        // تحديث الموضع الحالي
        if (this.settings.smooth) {
            this.state.currentX += this.state.velocityX * this.settings.smoothFactor;
            this.state.currentY += this.state.velocityY * this.settings.smoothFactor;
        } else {
            this.state.currentX = this.state.targetX;
            this.state.currentY = this.state.targetY;
        }

        // تحديث FPS
        this.updateFPS();
    }

    // ===== تطبيق تأثير البارالاكس =====
    applyParallax() {
        this.layers.forEach(layer => {
            let moveX = 0;
            let moveY = 0;
            let rotateX = 0;
            let rotateY = 0;
            let scale = 1;
            let blur = 0;
            let opacity = 1;

            // حساب الحركة حسب الاتجاه
            switch (layer.direction) {
                case 'horizontal':
                    moveX = this.state.currentX * layer.speed * (layer.invert ? -1 : 1);
                    break;
                case 'vertical':
                    moveY = this.state.currentY * layer.speed * (layer.invert ? -1 : 1);
                    break;
                case 'both':
                    moveX = this.state.currentX * layer.speed * (layer.invert ? -1 : 1);
                    moveY = this.state.currentY * layer.speed * (layer.invert ? -1 : 1);
                    break;
                case 'diagonal':
                    moveX = this.state.currentX * layer.speed * (layer.invert ? -1 : 1);
                    moveY = this.state.currentX * layer.speed * (layer.invert ? -1 : 1);
                    break;
            }

            // تطبيق الحدود
            moveX = Math.max(-this.settings.limitX, Math.min(this.settings.limitX, moveX));
            moveY = Math.max(-this.settings.limitY, Math.min(this.settings.limitY, moveY));

            // تأثير التدوير
            if (this.settings.rotate) {
                rotateX = moveY * this.settings.rotateIntensity;
                rotateY = -moveX * this.settings.rotateIntensity;
            }

            // تأثير التكبير
            if (this.settings.scale) {
                const distance = Math.sqrt(moveX * moveX + moveY * moveY);
                scale = 1 + (distance / 100) * this.settings.scaleIntensity;
            }

            // تأثير التمويه
            if (this.settings.blur) {
                const distance = Math.sqrt(moveX * moveX + moveY * moveY);
                blur = (distance / 100) * this.settings.blurIntensity;
            }

            // تأثير الشفافية
            if (this.settings.opacity) {
                const distance = Math.sqrt(moveX * moveX + moveY * moveY);
                opacity = 1 - (distance / 100) * this.settings.opacityIntensity;
            }

            // تطبيق التحويلات
            const transforms = [];

            transforms.push(`translateX(${moveX}px) translateY(${moveY}px)`);

            if (rotateX !== 0 || rotateY !== 0) {
                transforms.push(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
            }

            if (scale !== 1) {
                transforms.push(`scale(${scale})`);
            }

            layer.element.style.transform = transforms.join(' ');

            if (blur > 0) {
                layer.element.style.filter = `blur(${blur}px)`;
            }

            if (opacity < 1) {
                layer.element.style.opacity = opacity;
            }

            // حفظ الموضع الحالي
            layer.currentX = moveX;
            layer.currentY = moveY;
        });
    }

    // ===== تحديث أبعاد العناصر =====
    updateElementDimensions() {
        this.layers.forEach(layer => {
            layer.width = layer.element.offsetWidth;
            layer.height = layer.element.offsetHeight;
            layer.offsetLeft = layer.element.offsetLeft;
            layer.offsetTop = layer.element.offsetTop;
        });
    }

    // ===== تحديث FPS =====
    updateFPS() {
        const now = performance.now();
        const delta = now - this.stats.lastTime;

        if (delta >= 1000) {
            this.stats.fps = this.stats.frames;
            this.stats.frames = 0;
            this.stats.lastTime = now;
        }

        this.stats.frames++;
    }

    // ===== بدء مراقبة الأداء =====
    startStatsMonitoring() {
        const updateStats = () => {
            this.updateFPS();
            requestAnimationFrame(updateStats);
        };

        updateStats();
    }

    // ===== إضافة طبقة جديدة =====
    addLayer(element, options = {}) {
        this.layers.push({
            element: element,
            speed: options.speed || this.settings.speed,
            direction: options.direction || 'both',
            invert: options.invert || this.settings.invert,
            originalX: 0,
            originalY: 0,
            originalZ: 0,
            currentX: 0,
            currentY: 0,
            currentZ: 0,
            width: element.offsetWidth,
            height: element.offsetHeight,
            offsetLeft: element.offsetLeft,
            offsetTop: element.offsetTop
        });
    }

    // ===== إزالة طبقة =====
    removeLayer(element) {
        const index = this.layers.findIndex(layer => layer.element === element);
        
        if (index !== -1) {
            this.layers.splice(index, 1);
        }
    }

    // ===== تغيير السرعة =====
    setSpeed(speed) {
        this.settings.speed = speed;
    }

    // ===== تغيير الشدة =====
    setIntensity(intensity) {
        this.settings.intensity = intensity;
    }

    // ===== تفعيل/تعطيل النظام =====
    toggle(enable) {
        this.settings.enabled = enable;
        
        if (!enable) {
            this.resetAllLayers();
        }
    }

    // ===== إعادة تعيين كل الطبقات =====
    resetAllLayers() {
        this.layers.forEach(layer => {
            layer.element.style.transform = '';
            layer.element.style.filter = '';
            layer.element.style.opacity = '';
        });
    }

    // ===== تدمير النظام =====
    destroy() {
        this.resetAllLayers();
        this.layers = [];
        this.elements = [];
    }
}

// ===== نظام بارالاكس متقدم مع تأثيرات إضافية =====
class AdvancedParallaxSystem extends ParallaxSystem {
    constructor(options = {}) {
        super(options);

        this.effects = {
            depth: options.depth || 1,
            perspective: options.perspective || 1000,
            layers3D: options.layers3D || [],
            mouseTrail: options.mouseTrail || false,
            mouseTrailLength: options.mouseTrailLength || 10,
            tilt: options.tilt || false,
            tiltMax: options.tiltMax || 10,
            glow: options.glow || false,
            glowIntensity: options.glowIntensity || 0.5,
            colorShift: options.colorShift || false,
            colorShiftIntensity: options.colorShiftIntensity || 0.1,
            timeShift: options.timeShift || false,
            timeShiftSpeed: options.timeShiftSpeed || 0.001
        };

        this.time = 0;
        this.mouseTrail = [];
        this.initAdvanced();
    }

    // ===== تهيئة متقدمة =====
    initAdvanced() {
        this.setup3DLayers();
        this.setupMouseTrail();
    }

    // ===== إعداد طبقات ثلاثية الأبعاد =====
    setup3DLayers() {
        if (this.effects.layers3D.length > 0) {
            this.effects.layers3D.forEach((layer, index) => {
                const zIndex = index + 1;
                const depth = layer.depth || this.effects.depth * (zIndex / this.effects.layers3D.length);
                
                layer.element.style.transform = `translateZ(${depth}px)`;
                layer.element.style.transformStyle = 'preserve-3d';
            });
        }
    }

    // ===== إعداد مسار الماوس =====
    setupMouseTrail() {
        if (this.effects.mouseTrail) {
            document.addEventListener('mousemove', (e) => {
                this.mouseTrail.push({
                    x: e.clientX,
                    y: e.clientY,
                    time: Date.now()
                });

                if (this.mouseTrail.length > this.effects.mouseTrailLength) {
                    this.mouseTrail.shift();
                }
            });
        }
    }

    // ===== تطبيق التأثيرات المتقدمة =====
    applyAdvancedEffects() {
        // تأثير العمق
        this.layers.forEach((layer, index) => {
            const depthFactor = (index + 1) / this.layers.length;
            const moveX = this.state.currentX * depthFactor * this.effects.depth;
            const moveY = this.state.currentY * depthFactor * this.effects.depth;

            layer.element.style.transform += ` translateZ(${moveX}px)`;
        });

        // تأثير الميل
        if (this.effects.tilt) {
            const tiltX = this.state.currentY * this.effects.tiltMax / 100;
            const tiltY = -this.state.currentX * this.effects.tiltMax / 100;

            document.body.style.transform = `perspective(${this.effects.perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }

        // تأثير التوهج
        if (this.effects.glow) {
            const distance = Math.sqrt(this.state.currentX * this.state.currentX + this.state.currentY * this.state.currentY);
            const glowIntensity = (distance / 100) * this.effects.glowIntensity;

            document.body.style.boxShadow = `0 0 ${glowIntensity * 50}px rgba(0, 243, 255, ${glowIntensity})`;
        }

        // تأثير تحريك الألوان
        if (this.effects.colorShift) {
            const hue = (this.state.currentX + this.state.currentY) * this.effects.colorShiftIntensity;
            document.body.style.filter = `hue-rotate(${hue}deg)`;
        }

        // تأثير الوقت
        if (this.effects.timeShift) {
            this.time += this.effects.timeShiftSpeed;
            
            const waveX = Math.sin(this.time) * 10;
            const waveY = Math.cos(this.time) * 10;

            document.body.style.transform += ` translate(${waveX}px, ${waveY}px)`;
        }
    }

    // ===== رسم مسار الماوس =====
    drawMouseTrail() {
        if (!this.effects.mouseTrail || this.mouseTrail.length < 2) return;

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.beginPath();
        ctx.moveTo(this.mouseTrail[0].x, this.mouseTrail[0].y);

        for (let i = 1; i < this.mouseTrail.length; i++) {
            const point = this.mouseTrail[i];
            const prevPoint = this.mouseTrail[i - 1];
            
            const age = (Date.now() - point.time) / 1000;
            const opacity = Math.max(0, 1 - age);

            ctx.strokeStyle = `rgba(0, 243, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }

        document.body.appendChild(canvas);
        
        setTimeout(() => {
            canvas.remove();
        }, 100);
    }

    // ===== تحديث النظام =====
    update() {
        super.update();
        this.applyAdvancedEffects();
        this.drawMouseTrail();
    }
}

// ===== نظام بارالاكس للخلفية =====
class BackgroundParallaxSystem extends ParallaxSystem {
    constructor(options = {}) {
        super(options);

        this.backgrounds = [];
        this.initBackgrounds();
    }

    // ===== تهيئة الخلفيات =====
    initBackgrounds() {
        const backgrounds = document.querySelectorAll('[data-parallax-bg]');
        
        backgrounds.forEach((bg, index) => {
            const speed = parseFloat(bg.dataset.parallaxSpeed) || 0.5;
            const image = bg.dataset.parallaxBg;
            
            this.backgrounds.push({
                element: bg,
                speed: speed,
                image: image,
                positionX: 0,
                positionY: 0,
                width: bg.offsetWidth,
                height: bg.offsetHeight
            });

            if (image) {
                bg.style.backgroundImage = `url(${image})`;
                bg.style.backgroundSize = 'cover';
                bg.style.backgroundPosition = 'center';
                bg.style.backgroundRepeat = 'no-repeat';
            }
        });
    }

    // ===== تطبيق البارالاكس على الخلفيات =====
    applyBackgroundParallax() {
        this.backgrounds.forEach(bg => {
            const moveX = this.state.currentX * bg.speed;
            const moveY = this.state.currentY * bg.speed;

            bg.element.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
        });
    }

    // ===== تحديث النظام =====
    update() {
        super.update();
        this.applyBackgroundParallax();
    }
}

// ===== نظام بارالاكس للنصوص =====
class TextParallaxSystem extends ParallaxSystem {
    constructor(options = {}) {
        super(options);

        this.textElements = [];
        this.initTextElements();
    }

    // ===== تهيئة عناصر النص =====
    initTextElements() {
        const texts = document.querySelectorAll('[data-parallax-text]');
        
        texts.forEach(text => {
            const speed = parseFloat(text.dataset.parallaxSpeed) || 0.3;
            const direction = text.dataset.parallaxDirection || 'both';
            const originalText = text.textContent;
            
            this.textElements.push({
                element: text,
                speed: speed,
                direction: direction,
                originalText: originalText,
                currentX: 0,
                currentY: 0
            });
        });
    }

    // ===== تطبيق البارالاكس على النصوص =====
    applyTextParallax() {
        this.textElements.forEach(text => {
            let moveX = 0;
            let moveY = 0;

            switch (text.direction) {
                case 'horizontal':
                    moveX = this.state.currentX * text.speed;
                    break;
                case 'vertical':
                    moveY = this.state.currentY * text.speed;
                    break;
                case 'both':
                    moveX = this.state.currentX * text.speed;
                    moveY = this.state.currentY * text.speed;
                    break;
            }

            // تأثير تشويش النص
            if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
                const glitchText = text.originalText.split('').map(char => 
                    Math.random() > 0.95 ? Math.random().toString(36)[2] : char
                ).join('');

                text.element.textContent = glitchText;
            } else {
                text.element.textContent = text.originalText;
            }

            text.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
            text.element.style.textShadow = `${moveX}px ${moveY}px 10px rgba(0, 243, 255, 0.3)`;
        });
    }

    // ===== تحديث النظام =====
    update() {
        super.update();
        this.applyTextParallax();
    }
}

// ===== تهيئة النظام عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    // اختيار نوع النظام حسب الحاجة
    // new ParallaxSystem(); // نظام عادي
    // new AdvancedParallaxSystem({ tilt: true, glow: true }); // نظام متقدم
    // new BackgroundParallaxSystem(); // نظام للخلفيات
    new TextParallaxSystem(); // نظام للنصوص
});

// ===== تصدير الفئات للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParallaxSystem,
        AdvancedParallaxSystem,
        BackgroundParallaxSystem,
        TextParallaxSystem
    };
}
