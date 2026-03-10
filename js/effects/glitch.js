/* ===== CYBERPUNK 2099 - نظام تأثيرات التشويش المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية لتأثيرات التشويش =====
class GlitchSystem {
    constructor(options = {}) {
        // إعدادات النظام
        this.settings = {
            enabled: true,
            intensity: options.intensity || 1,
            frequency: options.frequency || 0.1,
            duration: options.duration || 200,
            colors: options.colors || {
                primary: '#00f3ff',
                secondary: '#ff00ff',
                accent: '#ffff00',
                glitch1: '#ff0000',
                glitch2: '#00ff00',
                glitch3: '#0000ff'
            },
            effects: {
                text: options.textGlitch !== false,
                image: options.imageGlitch !== false,
                video: options.videoGlitch || false,
                canvas: options.canvasGlitch || false,
                background: options.backgroundGlitch || false,
                border: options.borderGlitch || false,
                shadow: options.shadowGlitch || false,
                split: options.splitGlitch || false,
                wave: options.waveGlitch || false,
                pixel: options.pixelGlitch || false,
                scanline: options.scanlineGlitch || false,
                noise: options.noiseGlitch || false,
                chromatic: options.chromaticGlitch !== false
            },
            animationSpeed: options.animationSpeed || 1,
            randomSeed: options.randomSeed || Math.random()
        };

        // عناصر التشويش
        this.elements = [];
        this.canvas = null;
        this.ctx = null;
        this.videos = [];
        this.images = [];

        // حالة النظام
        this.state = {
            time: 0,
            glitchActive: false,
            glitchType: null,
            glitchIntensity: 0,
            randomValues: [],
            lastGlitchTime: 0
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
        this.generateRandomValues();
    }

    // ===== البحث عن عناصر التشويش =====
    findElements() {
        // العناصر التي تحمل كلاس glitch
        const glitchElements = document.querySelectorAll('.glitch, [data-glitch], [data-glitch-text], [data-glitch-image]');
        
        glitchElements.forEach(element => {
            const type = element.dataset.glitchType || 
                        (element.tagName === 'IMG' ? 'image' : 
                         element.tagName === 'VIDEO' ? 'video' : 'text');

            this.elements.push({
                element: element,
                type: type,
                intensity: parseFloat(element.dataset.glitchIntensity) || 1,
                frequency: parseFloat(element.dataset.glitchFrequency) || this.settings.frequency,
                duration: parseInt(element.dataset.glitchDuration) || this.settings.duration,
                effects: {
                    text: element.dataset.glitchText !== 'false',
                    image: element.dataset.glitchImage !== 'false',
                    video: element.dataset.glitchVideo === 'true',
                    canvas: element.dataset.glitchCanvas === 'true',
                    background: element.dataset.glitchBackground === 'true',
                    border: element.dataset.glitchBorder !== 'false',
                    shadow: element.dataset.glitchShadow !== 'false',
                    split: element.dataset.glitchSplit === 'true',
                    wave: element.dataset.glitchWave === 'true',
                    pixel: element.dataset.glitchPixel === 'true',
                    scanline: element.dataset.glitchScanline === 'true',
                    noise: element.dataset.glitchNoise === 'true',
                    chromatic: element.dataset.glitchChromatic !== 'false'
                },
                original: {
                    text: element.textContent,
                    html: element.innerHTML,
                    src: element.src,
                    style: element.style.cssText,
                    transform: element.style.transform,
                    filter: element.style.filter,
                    background: element.style.background,
                    border: element.style.border,
                    boxShadow: element.style.boxShadow,
                    textShadow: element.style.textShadow
                }
            });

            if (type === 'video') {
                this.videos.push(element);
            }

            if (type === 'image') {
                this.images.push(element);
            }
        });

        // إضافة عناصر تلقائياً إذا كان التأثير مفعلاً
        if (this.settings.effects.background) {
            document.body.classList.add('glitch-background');
        }
    }

    // ===== إنشاء كانفاس للتأثيرات =====
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        this.canvas.style.mixBlendMode = 'screen';

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
        // تشغيل التشويش يدوياً
        document.addEventListener('glitchNow', (e) => {
            this.triggerGlitch(e.detail?.intensity || 1, e.detail?.duration || 200);
        });

        // تغيير الإعدادات
        document.addEventListener('glitchConfig', (e) => {
            if (e.detail) {
                Object.assign(this.settings, e.detail);
            }
        });
    }

    // ===== بدء الحركة =====
    startAnimation() {
        const animate = () => {
            this.update();
            this.checkGlitchTrigger();
            this.applyGlitchEffects();
            this.drawCanvasGlitch();
            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== تحديث الحالة =====
    update() {
        this.state.time += 0.01 * this.settings.animationSpeed;

        if (this.state.glitchActive) {
            this.state.glitchIntensity *= 0.95;
            
            if (this.state.glitchIntensity < 0.01) {
                this.state.glitchActive = false;
                this.resetAllElements();
            }
        }
    }

    // ===== توليد قيم عشوائية =====
    generateRandomValues() {
        for (let i = 0; i < 1000; i++) {
            this.state.randomValues.push(Math.random());
        }
    }

    // ===== التحقق من تفعيل التشويش =====
    checkGlitchTrigger() {
        const now = Date.now();
        
        if (!this.state.glitchActive && 
            Math.random() < this.settings.frequency * 0.01 &&
            now - this.state.lastGlitchTime > 1000) {
            
            this.triggerGlitch(
                this.settings.intensity * (0.5 + Math.random() * 0.5),
                this.settings.duration * (0.5 + Math.random())
            );
        }
    }

    // ===== تفعيل التشويش =====
    triggerGlitch(intensity = 1, duration = 200) {
        this.state.glitchActive = true;
        this.state.glitchIntensity = intensity;
        this.state.glitchType = this.getRandomGlitchType();
        this.state.lastGlitchTime = Date.now();

        setTimeout(() => {
            this.state.glitchActive = false;
            this.resetAllElements();
        }, duration);
    }

    // ===== الحصول على نوع تشويش عشوائي =====
    getRandomGlitchType() {
        const types = ['split', 'wave', 'pixel', 'chromatic', 'noise', 'scanline'];
        return types[Math.floor(Math.random() * types.length)];
    }

    // ===== تطبيق تأثيرات التشويش =====
    applyGlitchEffects() {
        if (!this.state.glitchActive) return;

        this.elements.forEach(element => {
            const intensity = element.intensity * this.state.glitchIntensity;

            if (element.effects.chromatic && this.settings.effects.chromatic) {
                this.applyChromaticGlitch(element, intensity);
            }

            if (element.effects.split && this.settings.effects.split) {
                this.applySplitGlitch(element, intensity);
            }

            if (element.effects.wave && this.settings.effects.wave) {
                this.applyWaveGlitch(element, intensity);
            }

            if (element.effects.pixel && this.settings.effects.pixel) {
                this.applyPixelGlitch(element, intensity);
            }

            if (element.effects.noise && this.settings.effects.noise) {
                this.applyNoiseGlitch(element, intensity);
            }

            if (element.effects.scanline && this.settings.effects.scanline) {
                this.applyScanlineGlitch(element, intensity);
            }

            if (element.effects.border && this.settings.effects.border) {
                this.applyBorderGlitch(element, intensity);
            }

            if (element.effects.shadow && this.settings.effects.shadow) {
                this.applyShadowGlitch(element, intensity);
            }
        });
    }

    // ===== تشويش الألوان (Chromatic Aberration) =====
    applyChromaticGlitch(element, intensity) {
        const offset = 5 * intensity;
        const randomOffset = (Math.random() - 0.5) * offset;

        if (element.type === 'text') {
            element.element.style.textShadow = `
                ${randomOffset}px 0 ${this.settings.colors.glitch1},
                ${-randomOffset}px 0 ${this.settings.colors.glitch2},
                0 ${randomOffset}px ${this.settings.colors.glitch3}
            `;
        } else {
            element.element.style.filter = `
                drop-shadow(${randomOffset}px 0 ${this.settings.colors.glitch1})
                drop-shadow(${-randomOffset}px 0 ${this.settings.colors.glitch2})
                drop-shadow(0 ${randomOffset}px ${this.settings.colors.glitch3})
            `;
        }
    }

    // ===== تشويش الانقسام =====
    applySplitGlitch(element, intensity) {
        const splitX = 10 * intensity * (Math.random() - 0.5);
        const splitY = 10 * intensity * (Math.random() - 0.5);

        element.element.style.transform = `translate(${splitX}px, ${splitY}px)`;
    }

    // ===== تشويش الموجة =====
    applyWaveGlitch(element, intensity) {
        const waveX = Math.sin(this.state.time * 10) * 5 * intensity;
        const waveY = Math.cos(this.state.time * 10) * 5 * intensity;

        element.element.style.transform = `skew(${waveX}deg, ${waveY}deg)`;
    }

    // ===== تشويش البكسل =====
    applyPixelGlitch(element, intensity) {
        const pixelSize = Math.floor(2 * intensity) + 1;
        
        element.element.style.imageRendering = 'pixelated';
        element.element.style.transform = `scale(${pixelSize})`;
    }

    // ===== تشويش الضوضاء =====
    applyNoiseGlitch(element, intensity) {
        const noise = Math.random() * 0.5 * intensity;
        
        element.element.style.opacity = 0.8 + noise;
        element.element.style.filter = `contrast(${1 + noise}) brightness(${1 + noise})`;
    }

    // ===== تشويش خطوط المسح =====
    applyScanlineGlitch(element, intensity) {
        const scanline = document.createElement('div');
        scanline.style.cssText = `
            position: absolute;
            top: ${Math.random() * 100}%;
            left: 0;
            width: 100%;
            height: ${2 * intensity}px;
            background: ${this.settings.colors.primary};
            opacity: 0.3;
            pointer-events: none;
            z-index: 10000;
        `;

        element.element.style.position = 'relative';
        element.element.appendChild(scanline);

        setTimeout(() => {
            scanline.remove();
        }, 100);
    }

    // ===== تشويش الحدود =====
    applyBorderGlitch(element, intensity) {
        const borderStyle = `${intensity}px dashed ${this.settings.colors.glitch1}`;
        element.element.style.border = borderStyle;
    }

    // ===== تشويش الظل =====
    applyShadowGlitch(element, intensity) {
        const shadow = `
            ${intensity * 5}px ${intensity * 5}px ${intensity * 10}px ${this.settings.colors.glitch1},
            ${-intensity * 5}px ${-intensity * 5}px ${intensity * 10}px ${this.settings.colors.glitch2}
        `;
        
        element.element.style.boxShadow = shadow;
    }

    // ===== رسم تشويش على الكانفاس =====
    drawCanvasGlitch() {
        if (!this.state.glitchActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch(this.state.glitchType) {
            case 'noise':
                this.drawNoise();
                break;
            case 'scanline':
                this.drawScanlines();
                break;
            case 'chromatic':
                this.drawChromatic();
                break;
            case 'wave':
                this.drawWave();
                break;
            case 'pixel':
                this.drawPixel();
                break;
            case 'split':
                this.drawSplit();
                break;
        }
    }

    // ===== رسم ضوضاء =====
    drawNoise() {
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < 0.1 * this.state.glitchIntensity) {
                data[i] = Math.random() * 255;     // R
                data[i + 1] = Math.random() * 255; // G
                data[i + 2] = Math.random() * 255; // B
                data[i + 3] = 255;                  // A
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // ===== رسم خطوط المسح =====
    drawScanlines() {
        this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.1 * this.state.glitchIntensity})`;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.canvas.height; i += 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    // ===== رسم انحراف لوني =====
    drawChromatic() {
        const offset = 10 * this.state.glitchIntensity;
        
        this.ctx.fillStyle = `rgba(255, 0, 0, 0.1)`;
        this.ctx.fillRect(offset, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = `rgba(0, 255, 0, 0.1)`;
        this.ctx.fillRect(-offset, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = `rgba(0, 0, 255, 0.1)`;
        this.ctx.fillRect(0, offset, this.canvas.width, this.canvas.height);
    }

    // ===== رسم موجة =====
    drawWave() {
        this.ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 * this.state.glitchIntensity})`;
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.canvas.height; i += 20) {
            this.ctx.beginPath();
            
            for (let j = 0; j < this.canvas.width; j += 10) {
                const y = i + Math.sin(j * 0.01 + this.state.time * 10) * 20 * this.state.glitchIntensity;
                
                if (j === 0) {
                    this.ctx.moveTo(j, y);
                } else {
                    this.ctx.lineTo(j, y);
                }
            }
            
            this.ctx.stroke();
        }
    }

    // ===== رسم بكسل =====
    drawPixel() {
        const pixelSize = Math.floor(10 * this.state.glitchIntensity) + 1;

        for (let i = 0; i < this.canvas.width; i += pixelSize) {
            for (let j = 0; j < this.canvas.height; j += pixelSize) {
                if (Math.random() < 0.1) {
                    this.ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
                    this.ctx.fillRect(i, j, pixelSize, pixelSize);
                }
            }
        }
    }

    // ===== رسم انقسام =====
    drawSplit() {
        const splitCount = Math.floor(5 * this.state.glitchIntensity) + 1;

        for (let i = 0; i < splitCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const w = Math.random() * 200 + 50;
            const h = Math.random() * 100 + 50;

            this.ctx.fillStyle = `rgba(0, 243, 255, 0.1)`;
            this.ctx.fillRect(x, y, w, h);

            this.ctx.strokeStyle = `rgba(255, 0, 255, 0.3)`;
            this.ctx.strokeRect(x, y, w, h);
        }
    }

    // ===== إعادة تعيين كل العناصر =====
    resetAllElements() {
        this.elements.forEach(element => {
            element.element.style.cssText = element.original.style;
            element.element.style.transform = element.original.transform;
            element.element.style.filter = element.original.filter;
            element.element.style.background = element.original.background;
            element.element.style.border = element.original.border;
            element.element.style.boxShadow = element.original.boxShadow;
            element.element.style.textShadow = element.original.textShadow;
            element.element.textContent = element.original.text;
            element.element.innerHTML = element.original.html;
            
            if (element.original.src) {
                element.element.src = element.original.src;
            }
        });
    }

    // ===== إضافة عنصر تشويش جديد =====
    addElement(element, options = {}) {
        this.elements.push({
            element: element,
            type: options.type || 'text',
            intensity: options.intensity || 1,
            frequency: options.frequency || this.settings.frequency,
            duration: options.duration || this.settings.duration,
            effects: options.effects || {
                chromatic: true,
                split: true,
                wave: false,
                pixel: false,
                noise: false,
                scanline: false,
                border: true,
                shadow: true
            },
            original: {
                text: element.textContent,
                html: element.innerHTML,
                src: element.src,
                style: element.style.cssText,
                transform: element.style.transform,
                filter: element.style.filter,
                background: element.style.background,
                border: element.style.border,
                boxShadow: element.style.boxShadow,
                textShadow: element.style.textShadow
            }
        });
    }

    // ===== إزالة عنصر تشويش =====
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

    // ===== تغيير التردد =====
    setFrequency(frequency) {
        this.settings.frequency = frequency;
    }

    // ===== تفعيل/تعطيل النظام =====
    toggle(enable) {
        this.settings.enabled = enable;
        
        if (!enable) {
            this.resetAllElements();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ===== تدمير النظام =====
    destroy() {
        this.resetAllElements();
        this.canvas.remove();
        this.elements = [];
    }
}

// ===== نظام تشويش متقدم للنصوص =====
class TextGlitchSystem extends GlitchSystem {
    constructor(options = {}) {
        super(options);

        this.charSets = {
            glitch: '!@#$%^&*()_+{}:"<>?|[];\',./\\',
            numbers: '0123456789',
            letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            symbols: '░▒▓█▓▒░'
        };
    }

    // ===== تطبيق تشويش النص =====
    applyTextGlitch(element, intensity) {
        if (element.type !== 'text') return;

        const originalText = element.original.text;
        const glitchChars = this.charSets.glitch;
        const glitchCount = Math.floor(originalText.length * intensity * 0.3);

        let glitchedText = originalText.split('');

        for (let i = 0; i < glitchCount; i++) {
            const position = Math.floor(Math.random() * glitchedText.length);
            glitchedText[position] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }

        element.element.textContent = glitchedText.join('');
    }

    // ===== تطبيق تأثيرات التشويش =====
    applyGlitchEffects() {
        super.applyGlitchEffects();

        this.elements.forEach(element => {
            if (element.type === 'text' && this.state.glitchActive) {
                this.applyTextGlitch(element, this.state.glitchIntensity);
            }
        });
    }

    // ===== إعادة تعيين العناصر =====
    resetAllElements() {
        super.resetAllElements();
        
        this.elements.forEach(element => {
            if (element.type === 'text') {
                element.element.textContent = element.original.text;
            }
        });
    }
}

// ===== نظام تشويش للصور =====
class ImageGlitchSystem extends GlitchSystem {
    constructor(options = {}) {
        super(options);

        this.imageData = new Map();
        this.initImages();
    }

    // ===== تهيئة الصور =====
    initImages() {
        this.images.forEach(img => {
            if (img.complete) {
                this.processImage(img);
            } else {
                img.onload = () => this.processImage(img);
            }
        });
    }

    // ===== معالجة الصورة =====
    processImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

        this.imageData.set(img, data);
    }

    // ===== تطبيق تشويش الصورة =====
    applyImageGlitch(img, intensity) {
        if (!this.imageData.has(img)) return;

        const originalData = this.imageData.get(img);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        const imageData = new ImageData(
            new Uint8ClampedArray(originalData.data),
            originalData.width,
            originalData.height
        );

        const data = imageData.data;
        const glitchBlocks = Math.floor(10 * intensity);

        for (let b = 0; b < glitchBlocks; b++) {
            const blockX = Math.floor(Math.random() * canvas.width);
            const blockY = Math.floor(Math.random() * canvas.height);
            const blockW = Math.floor(Math.random() * 50) + 10;
            const blockH = Math.floor(Math.random() * 50) + 10;

            const offsetX = (Math.random() - 0.5) * 50 * intensity;
            const offsetY = (Math.random() - 0.5) * 50 * intensity;

            for (let y = blockY; y < blockY + blockH && y < canvas.height; y++) {
                for (let x = blockX; x < blockX + blockW && x < canvas.width; x++) {
                    const srcIdx = (y * canvas.width + x) * 4;
                    const dstX = Math.min(Math.max(0, x + offsetX), canvas.width - 1);
                    const dstY = Math.min(Math.max(0, y + offsetY), canvas.height - 1);
                    const dstIdx = (dstY * canvas.width + dstX) * 4;

                    for (let c = 0; c < 4; c++) {
                        data[dstIdx + c] = originalData.data[srcIdx + c];
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL();
    }

    // ===== تطبيق تأثيرات التشويش =====
    applyGlitchEffects() {
        super.applyGlitchEffects();

        this.elements.forEach(element => {
            if (element.type === 'image' && this.state.glitchActive) {
                this.applyImageGlitch(element.element, this.state.glitchIntensity);
            }
        });
    }

    // ===== إعادة تعيين العناصر =====
    resetAllElements() {
        super.resetAllElements();
        
        this.elements.forEach(element => {
            if (element.type === 'image' && element.original.src) {
                element.element.src = element.original.src;
            }
        });
    }
}

// ===== إضافة أنماط CSS للتشويش =====
const style = document.createElement('style');
style.textContent = `
    .glitch-background {
        animation: glitchBackground 5s infinite;
    }

    @keyframes glitchBackground {
        0%, 100% {
            background-color: transparent;
        }
        5% {
            background-color: rgba(255, 0, 0, 0.05);
        }
        10% {
            background-color: rgba(0, 255, 0, 0.05);
        }
        15% {
            background-color: rgba(0, 0, 255, 0.05);
        }
        20% {
            background-color: transparent;
        }
    }

    @keyframes glitchText {
        0%, 100% {
            transform: translate(0);
        }
        5% {
            transform: translate(-2px, 2px);
        }
        10% {
            transform: translate(2px, -2px);
        }
        15% {
            transform: translate(-2px, -2px);
        }
        20% {
            transform: translate(2px, 2px);
        }
    }

    @keyframes glitchSkew {
        0%, 100% {
            transform: skew(0deg);
        }
        10% {
            transform: skew(5deg);
        }
        20% {
            transform: skew(-5deg);
        }
        30% {
            transform: skew(0deg);
        }
    }
`;

document.head.appendChild(style);

// ===== تهيئة النظام عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    // اختيار نوع النظام حسب الحاجة
    // new GlitchSystem(); // نظام عادي
    // new TextGlitchSystem(); // نظام للنصوص
    new ImageGlitchSystem(); // نظام للصور
});

// ===== تصدير الفئات للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GlitchSystem,
        TextGlitchSystem,
        ImageGlitchSystem
    };
}
