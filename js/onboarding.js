// AudioWave.app - Onboarding Module
// First-visit guided tooltip flow

window.AudioWaveOnboarding = (function() {
    'use strict';

    const STORAGE_KEY = 'audiowave-onboarded';
    let currentStep = 0;
    let overlay = null;
    let tooltip = null;

    const steps = [
        {
            target: '#radio-btn',
            title: 'Stream Radio',
            text: 'Browse internet radio stations from 50+ countries. Click to open the radio panel.',
            position: 'bottom'
        },
        {
            target: '#mic-btn',
            title: 'Microphone Input',
            text: 'Use your microphone to visualize live audio — great on mobile!',
            position: 'bottom'
        },
        {
            target: '#control-panel',
            title: 'Customize',
            text: '24 visualization patterns, effects, colors, and presets. Experiment and save your favorites.',
            position: 'right'
        },
        {
            target: '#theme-section',
            title: 'Themes',
            text: 'Choose a theme or pick a custom accent color to make it yours.',
            position: 'right'
        },
        {
            target: null,
            title: 'Keyboard Shortcuts',
            text: 'Press H to hide UI, F for fullscreen, Space to play/pause, and ? for help. Swipe left/right on mobile to change patterns.',
            position: 'center'
        }
    ];

    function hasCompleted() {
        try {
            return localStorage.getItem(STORAGE_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function markComplete() {
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch (e) {}
    }

    function init() {
        if (hasCompleted()) return;
        // Delay to let the page render
        setTimeout(start, 1500);
    }

    function start() {
        currentStep = 0;

        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-backdrop"></div>
            <div class="onboarding-tooltip" id="onboarding-tooltip">
                <div class="onboarding-title"></div>
                <div class="onboarding-text"></div>
                <div class="onboarding-footer">
                    <span class="onboarding-step-count"></span>
                    <div class="onboarding-actions">
                        <button class="onboarding-skip">Skip</button>
                        <button class="onboarding-next">Next</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        tooltip = overlay.querySelector('.onboarding-tooltip');

        overlay.querySelector('.onboarding-skip').addEventListener('click', end);
        overlay.querySelector('.onboarding-next').addEventListener('click', next);
        overlay.querySelector('.onboarding-backdrop').addEventListener('click', end);

        showStep();
    }

    function showStep() {
        if (currentStep >= steps.length) {
            end();
            return;
        }

        const step = steps[currentStep];
        tooltip.querySelector('.onboarding-title').textContent = step.title;
        tooltip.querySelector('.onboarding-text').textContent = step.text;
        tooltip.querySelector('.onboarding-step-count').textContent = `${currentStep + 1} / ${steps.length}`;

        const nextBtn = tooltip.querySelector('.onboarding-next');
        nextBtn.textContent = currentStep === steps.length - 1 ? 'Done' : 'Next';

        // Position tooltip
        if (step.target && step.position !== 'center') {
            const target = document.querySelector(step.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                // Highlight target
                target.style.position = target.style.position || 'relative';
                target.classList.add('onboarding-highlight');

                positionTooltip(rect, step.position);
                return;
            }
        }

        // Center position (fallback or explicit)
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    function positionTooltip(rect, position) {
        tooltip.style.transform = '';

        switch (position) {
            case 'bottom':
                tooltip.style.top = (rect.bottom + 12) + 'px';
                tooltip.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - 320)) + 'px';
                break;
            case 'right':
                tooltip.style.top = Math.max(12, rect.top) + 'px';
                tooltip.style.left = Math.min(rect.right + 12, window.innerWidth - 320) + 'px';
                break;
            case 'top':
                tooltip.style.top = (rect.top - 12) + 'px';
                tooltip.style.left = Math.max(12, rect.left) + 'px';
                tooltip.style.transform = 'translateY(-100%)';
                break;
            default:
                tooltip.style.top = (rect.bottom + 12) + 'px';
                tooltip.style.left = rect.left + 'px';
        }
    }

    function next() {
        // Remove highlight from current step target
        const step = steps[currentStep];
        if (step?.target) {
            const target = document.querySelector(step.target);
            if (target) target.classList.remove('onboarding-highlight');
        }

        currentStep++;
        if (currentStep >= steps.length) {
            end();
        } else {
            showStep();
        }
    }

    function end() {
        // Clean up highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });

        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        overlay = null;
        tooltip = null;
        markComplete();
    }

    return {
        init,
        start, // Allow manual restart from help
        reset() {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }
    };
})();
