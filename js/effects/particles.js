/* ===== CYBERPUNK 2099 - نظام الجزيئات المتكامل ===== */
/* حقوق التصميم محفوظة لـ KeyaTech - الإصدار 1.0 */

// ===== الفئة الرئيسية للجزيئات =====
class ParticleSystem {
    constructor(options = {}) {
        // إعدادات النظام
        this.settings = {
            enabled: true,
            particleCount: options.particleCount || 100,
            maxDistance: options.maxDistance || 150,
            lineOpacity: options.lineOpacity || 0.2,
            particleSize: options.particleSize || 3,
            particleSpeed: options.particleSpeed || 1,
            colors: options.colors || ['#00f3ff', '#ff00ff', '#ffff00', '#00ff9d'],
            backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0)',
            interactive: options.interactive !== false,
            mouseRadius: options.mouseRadius || 200,
            mouseForce: options.mouseForce || 0.5,
            animationSpeed: options.animationSpeed || 1,
            particleLifetime: options.particleLifetime || 0,
            respawn: options.respawn !== false,
            zIndex: options.zIndex || -1
        };

        // عناصر النظام
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = {
            x: null,
            y: null,
            radius: this.settings.mouseRadius,
            active: false
        };

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
        this.createCanvas();
        this.createParticles();
        this.bindEvents();
        this.startAnimation();
        this.startStatsMonitoring();
    }

    // ===== إنشاء الكانفاس =====
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = this.settings.zIndex;

        document.body.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // ===== تغيير حجم الكانفاس =====
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    // ===== إنشاء الجزيئات =====
    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.settings.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    // ===== إنشاء جزيء واحد =====
    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * this.settings.particleSpeed,
            vy: (Math.random() - 0.5) * this.settings.particleSpeed,
            size: Math.random() * this.settings.particleSize + 1,
            color: this.settings.colors[Math.floor(Math.random() * this.settings.colors.length)],
            opacity: Math.random() * 0.5 + 0.3,
            life: Math.random() * this.settings.particleLifetime,
            maxLife: this.settings.particleLifetime,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 2 + 0.5,
            connections: []
        };
    }

    // ===== ربط الأحداث =====
    bindEvents() {
        if (this.settings.interactive) {
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.mouse.active = true;
            });

            document.addEventListener('mouseleave', () => {
                this.mouse.active = false;
            });

            document.addEventListener('click', (e) => {
                this.createExplosion(e.clientX, e.clientY);
            });

            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.mouse.x = e.touches[0].clientX;
                    this.mouse.y = e.touches[0].clientY;
                    this.mouse.active = true;
                }
            });

            document.addEventListener('touchend', () => {
                this.mouse.active = false;
            });
        }
    }

    // ===== بدء الحركة =====
    startAnimation() {
        const animate = () => {
            this.update();
            this.draw();
            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== تحديث الجزيئات =====
    update() {
        this.updateParticles();
        this.updateConnections();
        this.handleMouseInteraction();
        this.handleBoundaries();
        this.handleRespawn();
    }

    // ===== تحديث مواقع الجزيئات =====
    updateParticles() {
        for (let particle of this.particles) {
            // حركة عادية
            particle.x += particle.vx * this.settings.animationSpeed;
            particle.y += particle.vy * this.settings.animationSpeed;

            // حركة دائرية
            particle.angle += 0.01 * particle.speed * this.settings.animationSpeed;
            particle.vx += Math.cos(particle.angle) * 0.01;
            particle.vy += Math.sin(particle.angle) * 0.01;

            // تقليل السرعة
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // تحديث العمر
            if (particle.life > 0) {
                particle.life--;
            }
        }
    }

    // ===== تحديث الاتصالات بين الجزيئات =====
    updateConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].connections = [];

            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.settings.maxDistance) {
                    this.particles[i].connections.push({
                        particle: this.particles[j],
                        distance: distance,
                        opacity: 1 - distance / this.settings.maxDistance
                    });
                }
            }
        }
    }

    // ===== التفاعل مع الماوس =====
    handleMouseInteraction() {
        if (!this.mouse.active || !this.mouse.x || !this.mouse.y) return;

        for (let particle of this.particles) {
            const dx = particle.x - this.mouse.x;
            const dy = particle.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const force = (1 - distance / this.mouse.radius) * this.settings.mouseForce;
                const angle = Math.atan2(dy, dx);

                particle.vx += Math.cos(angle) * force;
                particle.vy += Math.sin(angle) * force;
            }
        }
    }

    // ===== التعامل مع حدود الشاشة =====
    handleBoundaries() {
        for (let particle of this.particles) {
            // الحدود الأفقية
            if (particle.x < 0) {
                particle.x = 0;
                particle.vx *= -0.5;
            } else if (particle.x > this.width) {
                particle.x = this.width;
                particle.vx *= -0.5;
            }

            // الحدود الرأسية
            if (particle.y < 0) {
                particle.y = 0;
                particle.vy *= -0.5;
            } else if (particle.y > this.height) {
                particle.y = this.height;
                particle.vy *= -0.5;
            }
        }
    }

    // ===== إعادة توليد الجزيئات =====
    handleRespawn() {
        if (!this.settings.respawn) return;

        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].life <= 0) {
                this.particles[i] = this.createParticle();
            }
        }
    }

    // ===== رسم الجزيئات =====
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // رسم الخلفية
        if (this.settings.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            this.ctx.fillStyle = this.settings.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // رسم الاتصالات
        this.drawConnections();

        // رسم الجزيئات
        this.drawParticles();
    }

    // ===== رسم الاتصالات =====
    drawConnections() {
        for (let particle of this.particles) {
            for (let connection of particle.connections) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(connection.particle.x, connection.particle.y);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${connection.opacity * this.settings.lineOpacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    // ===== رسم الجزيئات =====
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();

            // رسم توهج
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        }
    }

    // ===== بدء مراقبة الأداء =====
    startStatsMonitoring() {
        const updateStats = () => {
            const now = performance.now();
            const delta = now - this.stats.lastTime;

            if (delta >= 1000) {
                this.stats.fps = this.stats.frames;
                this.stats.frames = 0;
                this.stats.lastTime = now;
            }

            this.stats.frames++;
            requestAnimationFrame(updateStats);
        };

        updateStats();
    }

    // ===== إنشاء انفجار جزيئات =====
    createExplosion(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 5 + 2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 1,
                color: this.settings.colors[Math.floor(Math.random() * this.settings.colors.length)],
                opacity: 1,
                life: 100,
                maxLife: 100,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 0.5,
                connections: []
            });
        }
    }

    // ===== تغيير عدد الجزيئات =====
    setParticleCount(count) {
        this.settings.particleCount = count;

        if (count > this.particles.length) {
            // إضافة جزيئات
            for (let i = this.particles.length; i < count; i++) {
                this.particles.push(this.createParticle());
            }
        } else if (count < this.particles.length) {
            // إزالة جزيئات
            this.particles = this.particles.slice(0, count);
        }
    }

    // ===== تغيير الألوان =====
    setColors(colors) {
        this.settings.colors = colors;

        for (let particle of this.particles) {
            particle.color = colors[Math.floor(Math.random() * colors.length)];
        }
    }

    // ===== تغيير السرعة =====
    setSpeed(speed) {
        this.settings.animationSpeed = speed;
    }

    // ===== تفعيل/تعطيل النظام =====
    toggle(enable) {
        this.settings.enabled = enable;
        this.canvas.style.display = enable ? 'block' : 'none';
    }

    // ===== إعادة تعيين النظام =====
    reset() {
        this.createParticles();
    }

    // ===== تدمير النظام =====
    destroy() {
        this.canvas.remove();
        this.particles = [];
    }
}

// ===== نظام جزيئات متقدم مع تأثيرات إضافية =====
class AdvancedParticleSystem extends ParticleSystem {
    constructor(options = {}) {
        super(options);

        this.effects = {
            gravity: options.gravity || 0.1,
            wind: options.wind || 0,
            vortex: options.vortex || false,
            vortexX: options.vortexX || 0,
            vortexY: options.vortexY || 0,
            vortexStrength: options.vortexStrength || 0.1,
            wave: options.wave || false,
            waveAmplitude: options.waveAmplitude || 10,
            waveFrequency: options.waveFrequency || 0.01,
            glow: options.glow !== false,
            trail: options.trail || false,
            trailLength: options.trailLength || 10,
            blur: options.blur || false,
            blurAmount: options.blurAmount || 2
        };

        this.trails = [];
        this.initEffects();
    }

    // ===== تهيئة التأثيرات =====
    initEffects() {
        if (this.effects.trail) {
            this.createTrails();
        }
    }

    // ===== إنشاء مسارات =====
    createTrails() {
        for (let i = 0; i < this.particles.length; i++) {
            this.trails[i] = [];
        }
    }

    // ===== تحديث التأثيرات =====
    updateEffects() {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // تأثير الجاذبية
            particle.vy += this.effects.gravity;

            // تأثير الرياح
            particle.vx += this.effects.wind;

            // تأثير الدوامة
            if (this.effects.vortex) {
                const dx = particle.x - this.effects.vortexX;
                const dy = particle.y - this.effects.vortexY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const force = this.effects.vortexStrength / (distance + 1);

                particle.vx += -dy * force;
                particle.vy += dx * force;
            }

            // تأثير الموجة
            if (this.effects.wave) {
                particle.y += Math.sin(particle.x * this.effects.waveFrequency) * this.effects.waveAmplitude;
            }

            // تحديث المسارات
            if (this.effects.trail) {
                this.updateTrail(i, particle);
            }
        }
    }

    // ===== تحديث المسار =====
    updateTrail(index, particle) {
        this.trails[index].push({
            x: particle.x,
            y: particle.y,
            opacity: 1
        });

        if (this.trails[index].length > this.effects.trailLength) {
            this.trails[index].shift();
        }

        // تقليل شفافية المسارات القديمة
        for (let i = 0; i < this.trails[index].length; i++) {
            this.trails[index][i].opacity = i / this.trails[index].length;
        }
    }

    // ===== رسم المسارات =====
    drawTrails() {
        for (let i = 0; i < this.trails.length; i++) {
            const trail = this.trails[i];
            const particle = this.particles[i];

            for (let j = 0; j < trail.length; j++) {
                const point = trail[j];

                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, particle.size * point.opacity, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = point.opacity * 0.3;
                this.ctx.fill();
            }
        }
    }

    // ===== رسم مع تأثيرات =====
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.effects.blur) {
            this.ctx.filter = `blur(${this.effects.blurAmount}px)`;
        }

        if (this.effects.trail) {
            this.drawTrails();
        }

        this.drawConnections();
        this.drawParticles();

        if (this.effects.glow) {
            this.ctx.filter = 'blur(5px)';
            this.drawParticles();
        }

        this.ctx.filter = 'none';
    }

    // ===== تحديث النظام =====
    update() {
        this.updateParticles();
        this.updateConnections();
        this.updateEffects();
        this.handleMouseInteraction();
        this.handleBoundaries();
        this.handleRespawn();
    }

    // ===== إنشاء انفجار متقدم =====
    createAdvancedExplosion(x, y, options = {}) {
        const count = options.count || 30;
        const colors = options.colors || this.settings.colors;
        const speed = options.speed || 8;
        const spread = options.spread || 2 * Math.PI;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * spread + (options.startAngle || 0);
            const particleSpeed = Math.random() * speed + 2;
            const size = Math.random() * 6 + 2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * particleSpeed,
                vy: Math.sin(angle) * particleSpeed,
                size: size,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                life: options.lifetime || 100,
                maxLife: options.lifetime || 100,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 0.5,
                connections: []
            });
        }
    }
}

// ===== نظام جزيئات على شكل شبكة =====
class GridParticleSystem extends ParticleSystem {
    constructor(options = {}) {
        super(options);

        this.gridSize = options.gridSize || 30;
        this.gridSpacing = options.gridSpacing || 50;
        this.waveSpeed = options.waveSpeed || 0.05;
        this.waveHeight = options.waveHeight || 20;

        this.time = 0;
        this.createGridParticles();
    }

    // ===== إنشاء جزيئات شبكية =====
    createGridParticles() {
        this.particles = [];

        const cols = Math.floor(this.width / this.gridSpacing) + 2;
        const rows = Math.floor(this.height / this.gridSpacing) + 2;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.particles.push({
                    x: i * this.gridSpacing,
                    y: j * this.gridSpacing,
                    baseX: i * this.gridSpacing,
                    baseY: j * this.gridSpacing,
                    size: this.gridSize / 2,
                    color: this.settings.colors[(i + j) % this.settings.colors.length],
                    opacity: 0.5,
                    connections: []
                });
            }
        }
    }

    // ===== تحديث الشبكة =====
    updateGrid() {
        this.time += this.waveSpeed;

        for (let particle of this.particles) {
            // حركة موجية
            particle.x = particle.baseX + Math.sin(this.time + particle.baseY * 0.02) * this.waveHeight;
            particle.y = particle.baseY + Math.cos(this.time + particle.baseX * 0.02) * this.waveHeight;

            // تفاعل مع الماوس
            if (this.mouse.active && this.mouse.x && this.mouse.y) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    const force = (1 - distance / 100) * 5;
                    particle.x += dx > 0 ? force : -force;
                    particle.y += dy > 0 ? force : -force;
                }
            }
        }
    }

    // ===== تحديث النظام =====
    update() {
        this.updateGrid();
        this.updateConnections();
    }

    // ===== رسم الشبكة =====
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // رسم الخطوط أولاً
        for (let particle of this.particles) {
            for (let connection of particle.connections) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(connection.particle.x, connection.particle.y);
                this.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }

        // رسم النقاط
        for (let particle of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();

            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.globalAlpha = 1;
    }
}

// ===== نظام جزيئات ثلاثي الأبعاد (محاكاة) =====
class ParticleSystem3D extends ParticleSystem {
    constructor(options = {}) {
        super(options);

        this.depth = options.depth || 500;
        this.fov = options.fov || 300;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;

        this.init3D();
    }

    // ===== تهيئة الأبعاد الثلاثية =====
    init3D() {
        for (let particle of this.particles) {
            particle.z = (Math.random() - 0.5) * this.depth;
            particle.vz = (Math.random() - 0.5) * this.settings.particleSpeed;
        }

        this.bind3DEvents();
    }

    // ===== ربط أحداث ثلاثية الأبعاد =====
    bind3DEvents() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.rotationY -= 0.05;
                    break;
                case 'ArrowRight':
                    this.rotationY += 0.05;
                    break;
                case 'ArrowUp':
                    this.rotationX -= 0.05;
                    break;
                case 'ArrowDown':
                    this.rotationX += 0.05;
                    break;
                case 'q':
                    this.rotationZ -= 0.05;
                    break;
                case 'e':
                    this.rotationZ += 0.05;
                    break;
            }
        });
    }

    // ===== تحويل ثلاثي الأبعاد =====
    project3D(particle) {
        // تطبيق التدوير
        let x = particle.x - this.width / 2;
        let y = particle.y - this.height / 2;
        let z = particle.z;

        // تدوير حول X
        let y1 = y * Math.cos(this.rotationX) - z * Math.sin(this.rotationX);
        let z1 = y * Math.sin(this.rotationX) + z * Math.cos(this.rotationX);

        // تدوير حول Y
        let x2 = x * Math.cos(this.rotationY) + z1 * Math.sin(this.rotationY);
        let z2 = -x * Math.sin(this.rotationY) + z1 * Math.cos(this.rotationY);

        // تدوير حول Z
        let x3 = x2 * Math.cos(this.rotationZ) - y1 * Math.sin(this.rotationZ);
        let y3 = x2 * Math.sin(this.rotationZ) + y1 * Math.cos(this.rotationZ);

        // إسقاط منظور
        const scale = this.fov / (this.fov + z2);
        const screenX = x3 * scale + this.width / 2;
        const screenY = y3 * scale + this.height / 2;

        return {
            x: screenX,
            y: screenY,
            scale: scale,
            z: z2
        };
    }

    // ===== تحديث النظام =====
    update() {
        super.update();

        for (let particle of this.particles) {
            particle.z += particle.vz * this.settings.animationSpeed;

            // حدود العمق
            if (particle.z < -this.depth / 2) {
                particle.z = this.depth / 2;
            } else if (particle.z > this.depth / 2) {
                particle.z = -this.depth / 2;
            }
        }
    }

    // ===== رسم ثلاثي الأبعاد =====
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // ترتيب الجزيئات حسب العمق
        const sortedParticles = [...this.particles].sort((a, b) => {
            const projA = this.project3D(a);
            const projB = this.project3D(b);
            return projB.z - projA.z;
        });

        for (let particle of sortedParticles) {
            const proj = this.project3D(particle);

            if (proj.scale > 0) {
                const size = particle.size * proj.scale;
                const opacity = particle.opacity * proj.scale;

                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = opacity;
                this.ctx.fill();

                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 10 * proj.scale;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }

        this.ctx.globalAlpha = 1;
    }
}

// ===== تهيئة النظام عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    // اختيار نوع النظام حسب الحاجة
    // new ParticleSystem(); // نظام عادي
    // new AdvancedParticleSystem({ gravity: 0.1, wind: 0.01 }); // نظام متقدم
    // new GridParticleSystem(); // نظام شبكي
    new ParticleSystem3D(); // نظام ثلاثي الأبعاد
});

// ===== تصدير الفئات للاستخدام الخارجي =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParticleSystem,
        AdvancedParticleSystem,
        GridParticleSystem,
        ParticleSystem3D
    };
}
