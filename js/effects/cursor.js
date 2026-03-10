<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeyaTech - Cursor System</title>
    <style>
        /* ===== إخفاء الماوس التقليدي ===== */
        * {
            cursor: none !important;
        }

        /* ===== الماوس المخصص ===== */
        .custom-cursor {
            position: fixed;
            width: 40px;
            height: 40px;
            border: 3px solid #00f3ff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s, background 0.3s, border-color 0.3s;
            mix-blend-mode: difference;
            box-shadow: 0 0 20px #00f3ff, 0 0 40px #00f3ff;
        }

        /* النقطة الداخلية */
        .cursor-dot {
            position: fixed;
            width: 6px;
            height: 6px;
            background: #fff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
            box-shadow: 0 0 15px #fff;
        }

        /* ===== أنماط الماوس المختلفة ===== */

        /* نمط التحويم (Hover) */
        .custom-cursor.hover {
            width: 60px;
            height: 60px;
            background: rgba(0, 243, 255, 0.1);
            border-color: #ff00ff;
            box-shadow: 0 0 30px #ff00ff, 0 0 60px #ff00ff;
        }

        /* نمط النقر (Click) */
        .custom-cursor.click {
            width: 30px;
            height: 30px;
            background: #00f3ff;
            border-color: #fff;
        }

        /* نمط النص (Text) */
        .custom-cursor.text {
            width: 4px;
            height: 30px;
            border-radius: 2px;
            background: #00f3ff;
            border: none;
            box-shadow: 0 0 20px #00f3ff;
        }

        /* نمط الزر (Button) */
        .custom-cursor.button {
            width: 50px;
            height: 50px;
            background: rgba(255, 0, 255, 0.2);
            border-color: #ffff00;
            box-shadow: 0 0 30px #ffff00;
        }

        /* نمط الرابط (Link) */
        .custom-cursor.link {
            width: 45px;
            height: 45px;
            border-color: #00ff9d;
            background: rgba(0, 255, 157, 0.1);
            box-shadow: 0 0 25px #00ff9d;
        }

        /* نمط الممنوع (Not Allowed) */
        .custom-cursor.not-allowed {
            border-color: #ff3366;
            background: rgba(255, 51, 102, 0.1);
            box-shadow: 0 0 30px #ff3366;
        }

        /* نمط التحميل (Loading) */
        .custom-cursor.loading {
            animation: cursorSpin 1s linear infinite;
            border-top-color: transparent;
        }

        @keyframes cursorSpin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ===== تأثيرات إضافية ===== */
        .cursor-trail {
            position: fixed;
            width: 15px;
            height: 15px;
            background: rgba(0, 243, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999998;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
            filter: blur(3px);
        }

        .cursor-glow {
            position: fixed;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(0, 243, 255, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999997;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
            filter: blur(10px);
        }

        /* ===== إخفاء الماوس عند مغادرة النافذة ===== */
        .custom-cursor.hidden,
        .cursor-dot.hidden,
        .cursor-trail.hidden,
        .cursor-glow.hidden {
            opacity: 0;
        }
    </style>
</head>
<body>
    <!-- عناصر الماوس -->
    <div class="custom-cursor" id="cursor"></div>
    <div class="cursor-dot" id="cursorDot"></div>
    <div class="cursor-trail" id="cursorTrail"></div>
    <div class="cursor-glow" id="cursorGlow"></div>

    <!-- منطقة تجريبية -->
    <div style="padding: 50px; font-family: 'Cairo', sans-serif;">
        <h1 style="color: #00f3ff; margin-bottom: 30px;">تجربة الماوس المخصص</h1>
        
        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px;">
            <button style="padding: 15px 30px; background: linear-gradient(135deg, #00f3ff, #ff00ff); border: none; border-radius: 10px; color: white; font-size: 16px; cursor: none;">زر عادي</button>
            <a href="#" style="padding: 15px 30px; background: rgba(255,255,255,0.1); border: 2px solid #00ff9d; border-radius: 10px; color: #00ff9d; text-decoration: none;">رابط تجريبي</a>
            <input type="text" placeholder="حقل نصي" style="padding: 15px; background: rgba(255,255,255,0.1); border: 2px solid #ff00ff; border-radius: 10px; color: white;">
        </div>

        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="width: 100px; height: 100px; background: rgba(255,255,255,0.1); border: 2px solid #ffff00; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: none;">Hover</div>
            <div style="width: 100px; height: 100px; background: rgba(255,255,255,0.1); border: 2px solid #ff3366; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: none;">Not Allowed</div>
        </div>
    </div>

    <script>
        // ===== نظام الماوس المخصص المتكامل =====
        class CursorSystem {
            constructor() {
                this.cursor = document.getElementById('cursor');
                this.dot = document.getElementById('cursorDot');
                this.trail = document.getElementById('cursorTrail');
                this.glow = document.getElementById('cursorGlow');
                
                this.posX = 0;
                this.posY = 0;
                this.mouseX = 0;
                this.mouseY = 0;
                
                this.speed = 0.15; // سرعة المتابعة
                this.trailPositions = [];
                this.maxTrailLength = 10;
                
                this.init();
            }

            init() {
                // تحديث موقع الماوس
                document.addEventListener('mousemove', (e) => {
                    this.mouseX = e.clientX;
                    this.mouseY = e.clientY;
                    
                    // حركة مباشرة للنقطة
                    this.dot.style.left = this.mouseX + 'px';
                    this.dot.style.top = this.mouseY + 'px';
                    
                    // إضافة نقطة للآثار
                    this.addTrailPoint(this.mouseX, this.mouseY);
                });

                // نقر الماوس
                document.addEventListener('mousedown', () => {
                    this.cursor.classList.add('click');
                });

                document.addEventListener('mouseup', () => {
                    this.cursor.classList.remove('click');
                });

                // مغادرة النافذة
                document.addEventListener('mouseleave', () => {
                    this.hideAll();
                });

                document.addEventListener('mouseenter', () => {
                    this.showAll();
                });

                // بدء حركة الماوس الرئيسي
                this.animate();
                
                // تحليل العناصر للأنماط المختلفة
                this.setupElementDetection();
            }

            animate() {
                // حركة سلسة للمؤشر الرئيسي
                this.posX += (this.mouseX - this.posX) * this.speed;
                this.posY += (this.mouseY - this.posY) * this.speed;
                
                this.cursor.style.left = this.posX + 'px';
                this.cursor.style.top = this.posY + 'px';
                
                // حركة التوهج
                this.glow.style.left = this.posX + 'px';
                this.glow.style.top = this.posY + 'px';
                
                // تحديث الآثار
                this.updateTrail();
                
                requestAnimationFrame(() => this.animate());
            }

            addTrailPoint(x, y) {
                this.trailPositions.push({ x, y });
                if (this.trailPositions.length > this.maxTrailLength) {
                    this.trailPositions.shift();
                }
            }

            updateTrail() {
                // تحريك نقطة الأثر
                if (this.trailPositions.length > 0) {
                    const lastPos = this.trailPositions[0];
                    this.trail.style.left = lastPos.x + 'px';
                    this.trail.style.top = lastPos.y + 'px';
                }
            }

            hideAll() {
                this.cursor.classList.add('hidden');
                this.dot.classList.add('hidden');
                this.trail.classList.add('hidden');
                this.glow.classList.add('hidden');
            }

            showAll() {
                this.cursor.classList.remove('hidden');
                this.dot.classList.remove('hidden');
                this.trail.classList.remove('hidden');
                this.glow.classList.remove('hidden');
            }

            setupElementDetection() {
                // الكشف عن العناصر المختلفة وتغيير نمط الماوس
                const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], .clickable');
                
                interactiveElements.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                            this.cursor.classList.add('text');
                        } else if (el.tagName === 'BUTTON') {
                            this.cursor.classList.add('button');
                        } else if (el.tagName === 'A') {
                            this.cursor.classList.add('link');
                        } else {
                            this.cursor.classList.add('hover');
                        }
                    });

                    el.addEventListener('mouseleave', () => {
                        this.cursor.classList.remove('hover', 'text', 'button', 'link', 'not-allowed', 'loading');
                    });
                });

                // عناصر غير مسموح بها
                const notAllowedElements = document.querySelectorAll('[disabled], .disabled, .not-allowed');
                
                notAllowedElements.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        this.cursor.classList.add('not-allowed');
                    });

                    el.addEventListener('mouseleave', () => {
                        this.cursor.classList.remove('not-allowed');
                    });
                });

                // عناصر التحميل
                const loadingElements = document.querySelectorAll('.loading, [data-loading]');
                
                loadingElements.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        this.cursor.classList.add('loading');
                    });

                    el.addEventListener('mouseleave', () => {
                        this.cursor.classList.remove('loading');
                    });
                });
            }
        }

        // ===== تشغيل النظام عند تحميل الصفحة =====
        window.addEventListener('DOMContentLoaded', () => {
            new CursorSystem();
        });
    </script>
</body>
</html>
