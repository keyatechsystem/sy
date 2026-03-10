// ===== نظام البارالاكس =====
class ParallaxSystem {
    constructor() {
        this.layers = [];
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }

    init() {
        // إيجاد طبقات البارالاكس
        document.querySelectorAll('[data-parallax]').forEach(el => {
            this.layers.push({
                element: el,
                speed: parseFloat(el.dataset.parallax) || 0.1,
                x: 0,
                y: 0
            });
        });

        // تتبع الماوس
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX - window.innerWidth / 2) * 0.01;
            this.mouseY = (e.clientY - window.innerHeight / 2) * 0.01;
        });

        this.animate();
    }

    animate() {
        for (let layer of this.layers) {
            // حركة سلسة
            layer.x += (this.mouseX * layer.speed - layer.x) * 0.1;
            layer.y += (this.mouseY * layer.speed - layer.y) * 0.1;
            
            layer.element.style.transform = `translate(${layer.x}px, ${layer.y}px)`;
        }

        requestAnimationFrame(() => this.animate());
    }
}

// تشغيل البارالاكس
window.addEventListener('DOMContentLoaded', () => {
    new ParallaxSystem();
});
