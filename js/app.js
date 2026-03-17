// AudioWave.app - Main Application Module
// Orchestrates all modules: patterns, themes, radio, mic, favorites, gestures, onboarding

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configuration
    const config = {
        pattern: 'bars',
        amplitude: 1,
        glow: prefersReducedMotion ? 5 : 15,
        smoothing: prefersReducedMotion ? 0.95 : 0.8,
        speed: prefersReducedMotion ? 0.3 : 1,
        colorMode: 'rainbow',
        hueShift: 0
    };

    // Restore saved settings
    try {
        const saved = JSON.parse(localStorage.getItem('audiowave-config'));
        if (saved) Object.assign(config, saved);
    } catch (e) {}

    // Auto-save settings on change (debounced)
    let saveTimeout;
    function saveConfig() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('audiowave-config', JSON.stringify(config));
            } catch (e) {}
        }, 500);
    }

    // Make config global for modules
    window.config = config;

    // --- Shareable Preset URLs ---
    function applyURLParams() {
        const params = new URLSearchParams(window.location.search);

        // Check for overlay mode first
        if (params.get('overlay') === '1') {
            document.body.classList.add('overlay-mode');
            document.body.classList.add('hide-ui');
            // Make canvas transparent
            const canvasEl = document.getElementById('visualizer-canvas');
            if (canvasEl) canvasEl.style.background = 'transparent';
            document.body.style.background = 'transparent';
            const container = document.getElementById('canvas-container');
            if (container) container.style.background = 'transparent';
            // Hide ad container
            const adContainer = document.getElementById('ad-container');
            if (adContainer) adContainer.style.display = 'none';
        }

        // Apply visualizer params from URL
        if (params.has('pattern')) {
            const p = params.get('pattern');
            if (window.AudioWavePatterns && window.AudioWavePatterns.patternList.includes(p)) {
                config.pattern = p;
            }
        }
        if (params.has('color')) {
            const c = params.get('color');
            if (c === 'rainbow' || c === 'single') config.colorMode = c;
        }
        if (params.has('hue')) {
            const h = parseFloat(params.get('hue'));
            if (!isNaN(h) && h >= 0 && h <= 360) config.hueShift = h;
        }
        if (params.has('amplitude')) {
            const a = parseFloat(params.get('amplitude'));
            if (!isNaN(a) && a >= 0.2 && a <= 2) config.amplitude = a;
        }
        if (params.has('glow')) {
            const g = parseFloat(params.get('glow'));
            if (!isNaN(g) && g >= 0 && g <= 50) config.glow = g;
        }
        if (params.has('speed')) {
            const s = parseFloat(params.get('speed'));
            if (!isNaN(s) && s >= 0.2 && s <= 3) config.speed = s;
        }
        if (params.has('smoothing')) {
            const sm = parseFloat(params.get('smoothing'));
            if (!isNaN(sm) && sm >= 0 && sm <= 0.99) config.smoothing = sm;
        }
        if (params.has('theme')) {
            const t = params.get('theme');
            // Will be applied after theme module init
            window._urlTheme = t;
        }

        // Load saved preset slot from URL
        if (params.has('saved')) {
            const slot = params.get('saved');
            const presets = JSON.parse(localStorage.getItem('audiowave-presets') || '{}');
            if (presets[slot]) {
                Object.assign(config, presets[slot]);
            }
        }
    }

    applyURLParams();

    function buildShareURL() {
        const base = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('pattern', config.pattern);
        params.set('color', config.colorMode);
        params.set('hue', config.hueShift);
        params.set('amplitude', config.amplitude);
        params.set('glow', config.glow);
        params.set('speed', config.speed);
        params.set('smoothing', config.smoothing);
        const themeMod = window.AudioWaveThemes;
        if (themeMod) {
            params.set('theme', themeMod.getCurrentTheme());
        }
        return base + '?' + params.toString();
    }

    function showToast(message) {
        let toast = document.getElementById('share-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'share-toast';
            toast.className = 'share-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('visible'), 2000);
    }

    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const url = buildShareURL();
            navigator.clipboard.writeText(url).then(() => {
                showToast('Copied!');
            }).catch(() => {
                showToast('Copy failed');
            });
        });
    }

    // Overlay mode button
    const overlayBtn = document.getElementById('overlay-btn');
    if (overlayBtn) {
        overlayBtn.addEventListener('click', () => {
            const url = buildShareURL() + '&overlay=1';
            window.open(url, '_blank');
        });
    }

    // Browser support detection
    const browserSupport = {
        getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };

    // Audio variables
    let audioContext, analyser, dataArray, bufferLength;
    let mediaStream = null;
    window.animationId = null;

    // Canvas setup
    const canvas = document.getElementById('visualizer-canvas');
    const isOverlay = new URLSearchParams(window.location.search).get('overlay') === '1';
    const ctx = canvas.getContext('2d', {
        alpha: isOverlay,
        desynchronized: true
    });
    let width, height;
    let time = 0;
    let hue = 0;

    let resizeTimeout;
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        width = window.innerWidth;
        height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 100);
    });

    // Color functions
    function getColor(index, total) {
        if (config.colorMode === 'rainbow') {
            const baseHue = (hue + (index / total) * 360 + config.hueShift) % 360;
            return `hsl(${baseHue}, 100%, 60%)`;
        } else {
            return `hsl(${config.hueShift}, 100%, 60%)`;
        }
    }

    // Initialize patterns module
    const patterns = window.AudioWavePatterns;
    patterns.init({
        ctx, width, height, dataArray, bufferLength, analyser, config, time, hue, getColor
    });

    // Make visualize function global for radio module
    window.visualize = visualize;

    // Visualization loop
    function visualize() {
        window.animationId = requestAnimationFrame(visualize);

        // Sync with window variables (set by radio/mic modules)
        if (window.analyser) analyser = window.analyser;
        if (window.dataArray) dataArray = window.dataArray;
        if (window.bufferLength) bufferLength = window.bufferLength;

        if (!analyser || !dataArray) return;

        analyser.getByteFrequencyData(dataArray);

        time += 0.016 * config.speed;
        hue = (hue + 0.5 * config.speed) % 360;

        // In overlay mode, clear to transparent before drawing
        if (isOverlay) {
            ctx.clearRect(0, 0, width, height);
        }

        // Update patterns module with current state
        patterns.update({
            width, height, dataArray, bufferLength, analyser, time, hue
        });

        patterns.draw(config.pattern);
    }

    // DOM elements
    const captureBtn = document.getElementById('capture-btn');
    const micBtn = document.getElementById('mic-btn');
    const radioBtn = document.getElementById('radio-btn');
    const radioPanel = document.getElementById('radio-panel');
    const radioClose = document.getElementById('radio-close');
    const helpToggle = document.getElementById('help-toggle');
    const helpOverlay = document.getElementById('help-overlay');
    const helpClose = document.getElementById('help-close');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    const hideUiBtn = document.getElementById('hide-ui');
    const controlPanel = document.getElementById('control-panel');
    const patternBtns = document.querySelectorAll('.pattern-btn');
    const colorModeBtns = document.querySelectorAll('.color-mode-btn');
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Radio panel toggle
    radioBtn.addEventListener('click', () => {
        const isActive = radioBtn.classList.contains('active');
        if (isActive) {
            radioPanel.classList.remove('visible');
            radioBtn.classList.remove('active');
        } else {
            radioPanel.classList.add('visible');
            radioBtn.classList.add('active');
        }
    });

    radioClose.addEventListener('click', () => {
        radioPanel.classList.remove('visible');
        radioBtn.classList.remove('active');
    });

    // Tab Audio capture
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            if (mediaStream) {
                stopCapture();
                return;
            }

            if (!browserSupport.getDisplayMedia) {
                document.getElementById('status-text').textContent = 'Tab audio not supported in this browser';
                return;
            }

            try {
                // Stop other sources
                if (window.radioModule) window.radioModule.stopRadio();
                if (window.AudioWaveMic?.isActive()) window.AudioWaveMic.stop();

                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                const audioTrack = mediaStream.getAudioTracks()[0];
                if (!audioTrack) {
                    throw new Error('No audio track - select a tab with audio');
                }

                mediaStream.getVideoTracks().forEach(track => track.stop());

                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));

                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = config.smoothing;

                source.connect(analyser);
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                window.audioContext = audioContext;
                window.analyser = analyser;
                window.bufferLength = bufferLength;
                window.dataArray = dataArray;

                captureBtn.classList.add('active');
                captureBtn.textContent = 'Stop';
                if (micBtn) micBtn.classList.remove('active');
                document.getElementById('status-indicator').classList.add('active');
                document.getElementById('status-text').textContent = 'Capturing tab audio';

                radioPanel.classList.remove('visible');
                radioBtn.classList.remove('active');

                // Update now playing bar
                const nowPlaying = document.getElementById('now-playing');
                if (nowPlaying) {
                    nowPlaying.classList.add('visible');
                    const npName = document.getElementById('np-name');
                    const npGenre = document.getElementById('np-genre');
                    if (npName) npName.textContent = 'Tab Audio';
                    if (npGenre) npGenre.textContent = 'Capturing';
                }

                visualize();

                audioTrack.onended = stopCapture;

            } catch (error) {
                console.error('Capture failed:', error);
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    mediaStream = null;
                }
                captureBtn.classList.remove('active');
                captureBtn.textContent = 'Tab Audio';
                document.getElementById('status-indicator').classList.remove('active');
                document.getElementById('status-text').textContent = error.message || 'Capture failed';
            }
        });
    }

    function stopCapture() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (audioContext && !window.radioModule?.radioState?.isPlaying) {
            if (analyser) {
                try { analyser.disconnect(); } catch (e) {}
            }
        }

        if (captureBtn) {
            captureBtn.classList.remove('active');
            captureBtn.textContent = 'Tab Audio';
        }
        document.getElementById('status-indicator').classList.remove('active');
        document.getElementById('status-text').textContent = 'Capture stopped';

        if (window.animationId && !window.radioModule?.radioState?.isPlaying) {
            cancelAnimationFrame(window.animationId);
            window.animationId = null;
        }
    }

    // Microphone button
    if (micBtn) {
        if (!browserSupport.getUserMedia) {
            micBtn.style.display = 'none';
        } else {
            micBtn.addEventListener('click', async () => {
                if (window.AudioWaveMic) {
                    const started = await window.AudioWaveMic.start();
                    if (started) {
                        // Deactivate other sources
                        if (captureBtn) {
                            captureBtn.classList.remove('active');
                            captureBtn.textContent = 'Tab Audio';
                        }
                        radioBtn.classList.remove('active');
                        radioPanel.classList.remove('visible');
                    }
                }
            });
        }
    }

    // Pattern selection
    patternBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            patternBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            config.pattern = btn.dataset.pattern;
            saveConfig();
        });
    });

    // Color mode
    colorModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            config.colorMode = btn.dataset.mode;
            saveConfig();
        });
    });

    // Sliders
    const sliders = {
        'amplitude': (v) => { config.amplitude = v; document.getElementById('amplitude-value').textContent = Math.round(v * 100) + '%'; saveConfig(); },
        'glow': (v) => { config.glow = v; document.getElementById('glow-value').textContent = v; saveConfig(); },
        'smoothing': (v) => { config.smoothing = v; if (analyser) analyser.smoothingTimeConstant = v; document.getElementById('smoothing-value').textContent = v.toFixed(2); saveConfig(); },
        'speed': (v) => { config.speed = v; document.getElementById('speed-value').textContent = v.toFixed(1) + 'x'; saveConfig(); },
        'hue-shift': (v) => { config.hueShift = v; document.getElementById('hue-value').textContent = v + '\u00B0'; saveConfig(); }
    };

    Object.keys(sliders).forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', (e) => sliders[id](parseFloat(e.target.value)));
        }
    });

    // Presets
    const savedPresets = JSON.parse(localStorage.getItem('audiowave-presets') || '{}');
    let currentPresetSlot = null;

    presetBtns.forEach(btn => {
        if (btn.dataset.save !== undefined) {
            btn.addEventListener('click', () => {
                if (currentPresetSlot) {
                    savedPresets[currentPresetSlot] = { ...config };
                    localStorage.setItem('audiowave-presets', JSON.stringify(savedPresets));
                    presetBtns.forEach(b => {
                        if (b.dataset.preset === currentPresetSlot) b.classList.add('has-preset');
                    });
                    btn.classList.add('saving');
                    setTimeout(() => btn.classList.remove('saving'), 500);
                }
            });
        } else {
            const preset = btn.dataset.preset;
            if (savedPresets[preset]) btn.classList.add('has-preset');

            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPresetSlot = preset;

                if (savedPresets[preset]) {
                    Object.assign(config, savedPresets[preset]);
                    updateUIFromConfig();
                }
            });
        }
    });

    function updateUIFromConfig() {
        patternBtns.forEach(b => b.classList.toggle('active', b.dataset.pattern === config.pattern));
        colorModeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === config.colorMode));

        document.getElementById('amplitude').value = config.amplitude;
        document.getElementById('glow').value = config.glow;
        document.getElementById('smoothing').value = config.smoothing;
        document.getElementById('speed').value = config.speed;
        document.getElementById('hue-shift').value = config.hueShift;

        Object.keys(sliders).forEach(id => {
            const slider = document.getElementById(id);
            if (slider) sliders[id](parseFloat(slider.value));
        });
    }

    // UI visibility
    hideUiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.classList.add('hide-ui');
    });
    controlPanel.addEventListener('click', (e) => {
        if (document.body.classList.contains('hide-ui')) {
            document.body.classList.remove('hide-ui');
        }
    });

    // Help
    helpToggle.addEventListener('click', () => {
        helpOverlay.classList.add('visible');
        helpOverlay.setAttribute('aria-hidden', 'false');
    });
    helpClose.addEventListener('click', () => {
        helpOverlay.classList.remove('visible');
        helpOverlay.setAttribute('aria-hidden', 'true');
    });
    helpOverlay.addEventListener('click', (e) => {
        if (e.target === helpOverlay) {
            helpOverlay.classList.remove('visible');
            helpOverlay.setAttribute('aria-hidden', 'true');
        }
    });

    // Fullscreen
    fullscreenToggle.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    });

    // Auto-cycle mode
    let autoCycleInterval = null;
    const autoCycleBtn = document.getElementById('auto-cycle-btn');
    if (autoCycleBtn) {
        autoCycleBtn.addEventListener('click', () => {
            if (autoCycleInterval) {
                clearInterval(autoCycleInterval);
                autoCycleInterval = null;
                autoCycleBtn.classList.remove('active');
            } else {
                autoCycleBtn.classList.add('active');
                autoCycleInterval = setInterval(() => {
                    const list = patterns.patternList;
                    const currentIndex = list.indexOf(config.pattern);
                    const nextIndex = (currentIndex + 1) % list.length;
                    config.pattern = list[nextIndex];
                    patternBtns.forEach(b => b.classList.toggle('active', b.dataset.pattern === list[nextIndex]));
                    saveConfig();
                }, 8000);
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch(e.key.toLowerCase()) {
            case 'h':
                document.body.classList.toggle('hide-ui');
                break;
            case 'f':
                fullscreenToggle.click();
                break;
            case ' ':
                e.preventDefault();
                document.getElementById('play-radio')?.click();
                break;
            case 'arrowleft':
                window.radioModule?.prevStation();
                break;
            case 'arrowright':
                window.radioModule?.nextStation();
                break;
            case 'm':
                if (micBtn) micBtn.click();
                break;
            case '?':
                helpOverlay.classList.toggle('visible');
                break;
            default:
                if (e.key >= '1' && e.key <= '9') {
                    const index = parseInt(e.key) - 1;
                    if (patternBtns[index]) patternBtns[index].click();
                }
        }
    });

    // Restore UI from saved config
    updateUIFromConfig();

    // Initialize radio panel - open by default
    radioPanel.classList.add('visible');
    radioBtn.classList.add('active');

    // Hide tab audio button on mobile (not supported)
    if (!browserSupport.getDisplayMedia && captureBtn) {
        captureBtn.style.display = 'none';
    }

    // Initialize all modules
    if (window.radioModule) window.radioModule.init();
    if (window.AudioWaveThemes) {
        window.AudioWaveThemes.init();
        // Apply URL theme param if present
        if (window._urlTheme && window.AudioWaveThemes.themes[window._urlTheme]) {
            window.AudioWaveThemes.applyTheme(window._urlTheme);
        }
    }
    if (window.AudioWaveFavorites) window.AudioWaveFavorites.init();
    if (window.AudioWaveGestures) window.AudioWaveGestures.init();
    if (window.AudioWaveOnboarding) window.AudioWaveOnboarding.init();

    // Initialize AdSense ad units
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}

    // Expose for other modules
    window.AudioWaveApp = {
        saveConfig,
        stopCapture,
        config,
        buildShareURL
    };

})();
