// AudioWave.app - Touch Gesture Module
// Swipe left/right to cycle patterns on mobile

window.AudioWaveGestures = (function() {
    'use strict';

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50;
    const SWIPE_TIME_LIMIT = 300;
    const VERTICAL_THRESHOLD = 80; // Ignore if too vertical

    function init() {
        const canvas = document.getElementById('visualizer-canvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    function onTouchStart(e) {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }

    function onTouchEnd(e) {
        if (e.changedTouches.length !== 1) return;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        // Must be fast enough and horizontal enough
        if (dt > SWIPE_TIME_LIMIT) return;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (Math.abs(dy) > VERTICAL_THRESHOLD) return;

        const patterns = window.AudioWavePatterns;
        if (!patterns || !window.config) return;

        const list = patterns.patternList;
        const currentIndex = list.indexOf(window.config.pattern);
        if (currentIndex === -1) return;

        let newIndex;
        if (dx > 0) {
            // Swipe right = previous pattern
            newIndex = (currentIndex - 1 + list.length) % list.length;
        } else {
            // Swipe left = next pattern
            newIndex = (currentIndex + 1) % list.length;
        }

        window.config.pattern = list[newIndex];

        // Update UI
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pattern === list[newIndex]);
        });

        // Save config
        if (window.AudioWaveApp?.saveConfig) {
            window.AudioWaveApp.saveConfig();
        }

        // Show brief toast
        showSwipeToast(patterns.patternNames[list[newIndex]] || list[newIndex]);
    }

    function showSwipeToast(name) {
        let toast = document.getElementById('swipe-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'swipe-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = name;
        toast.classList.add('visible');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('visible'), 800);
    }

    return { init };
})();
