// AudioWave.app - Theme System
// Manages theme presets and custom accent color

window.AudioWaveThemes = (function() {
    'use strict';

    const STORAGE_KEY = 'audiowave-theme';

    const themes = {
        neon: {
            name: 'Neon Cyan',
            accent: '#00ffcc',
            accentDim: '#00ccaa',
            bgDark: '#0a0a0f',
            bgPanel: 'rgba(15, 15, 25, 0.85)',
            text: '#e0e0e8',
            textDim: '#a0a0a8'
        },
        sunset: {
            name: 'Sunset',
            accent: '#ff6b35',
            accentDim: '#e05520',
            bgDark: '#0f0a0a',
            bgPanel: 'rgba(25, 15, 15, 0.85)',
            text: '#f0e0d8',
            textDim: '#b0a098'
        },
        synthwave: {
            name: 'Synthwave',
            accent: '#ff00ff',
            accentDim: '#cc00cc',
            bgDark: '#0a0015',
            bgPanel: 'rgba(20, 10, 35, 0.85)',
            text: '#e8e0f0',
            textDim: '#a898b8'
        },
        mono: {
            name: 'Mono',
            accent: '#ffffff',
            accentDim: '#cccccc',
            bgDark: '#080808',
            bgPanel: 'rgba(20, 20, 20, 0.85)',
            text: '#e8e8e8',
            textDim: '#888888'
        },
        aurora: {
            name: 'Aurora',
            accent: '#00ff88',
            accentDim: '#00cc66',
            bgDark: '#050a0f',
            bgPanel: 'rgba(10, 20, 30, 0.85)',
            text: '#d8f0e8',
            textDim: '#88b0a0'
        }
    };

    let currentTheme = 'neon';
    let customAccent = null;

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function darkenHex(hex, factor) {
        const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function applyTheme(themeName, accent) {
        const theme = themes[themeName] || themes.neon;
        const accentColor = accent || theme.accent;
        const accentDimColor = accent ? darkenHex(accent, 0.8) : theme.accentDim;

        const root = document.documentElement;
        root.style.setProperty('--accent', accentColor);
        root.style.setProperty('--accent-dim', accentDimColor);
        root.style.setProperty('--bg-dark', theme.bgDark);
        root.style.setProperty('--bg-panel', theme.bgPanel);
        root.style.setProperty('--text', theme.text);
        root.style.setProperty('--text-dim', theme.textDim);
        root.style.setProperty('--border', hexToRgba(accentColor, 0.2));
        root.style.setProperty('--shadow', hexToRgba(accentColor, 0.1));
        root.style.setProperty('--glow', hexToRgba(accentColor, 0.3));

        // Update canvas background
        const canvas = document.getElementById('visualizer-canvas');
        if (canvas) {
            const bgEnd = theme.bgDark.replace('#', '');
            const r = Math.min(parseInt(bgEnd.slice(0, 2), 16) + 11, 255);
            const g = Math.min(parseInt(bgEnd.slice(2, 4), 16) + 11, 255);
            const b = Math.min(parseInt(bgEnd.slice(4, 6), 16) + 10, 255);
            canvas.style.background = `linear-gradient(135deg, ${theme.bgDark} 0%, #${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')} 100%)`;
        }

        currentTheme = themeName;
        customAccent = accent || null;

        // Update active state on theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName && !accent);
        });

        save();
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                theme: currentTheme,
                customAccent: customAccent
            }));
        } catch (e) {}
    }

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved) {
                currentTheme = saved.theme || 'neon';
                customAccent = saved.customAccent || null;
            }
        } catch (e) {}
    }

    function init() {
        load();
        applyTheme(currentTheme, customAccent);

        // Theme button listeners
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                customAccent = null;
                const accentInput = document.getElementById('accent-color');
                if (accentInput) accentInput.value = themes[btn.dataset.theme]?.accent || '#00ffcc';
                applyTheme(btn.dataset.theme);
            });
        });

        // Custom accent color picker
        const accentInput = document.getElementById('accent-color');
        if (accentInput) {
            accentInput.value = customAccent || themes[currentTheme]?.accent || '#00ffcc';
            accentInput.addEventListener('input', (e) => {
                applyTheme(currentTheme, e.target.value);
            });
        }
    }

    return {
        init,
        themes,
        applyTheme,
        getCurrentTheme: () => currentTheme,
        getCustomAccent: () => customAccent
    };
})();
