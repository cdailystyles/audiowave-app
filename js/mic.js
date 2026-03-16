// AudioWave.app - Microphone Input Module
// Provides getUserMedia microphone audio source

window.AudioWaveMic = (function() {
    'use strict';

    let micStream = null;
    let micSource = null;
    let isActive = false;

    async function start() {
        if (isActive) {
            stop();
            return false;
        }

        try {
            // Stop radio if playing
            if (window.radioModule?.radioState?.isPlaying) {
                window.radioModule.stopRadio();
            }

            // Stop tab capture if active
            if (window.AudioWaveApp?.stopCapture) {
                window.AudioWaveApp.stopCapture();
            }

            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Create or resume audio context
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (window.audioContext.state === 'suspended') {
                await window.audioContext.resume();
            }

            micSource = window.audioContext.createMediaStreamSource(micStream);

            if (!window.analyser) {
                window.analyser = window.audioContext.createAnalyser();
                window.analyser.fftSize = 2048;
            }
            if (window.config) {
                window.analyser.smoothingTimeConstant = window.config.smoothing;
            }

            micSource.connect(window.analyser);
            // Don't connect to destination to avoid feedback loop

            window.bufferLength = window.analyser.frequencyBinCount;
            window.dataArray = new Uint8Array(window.bufferLength);

            isActive = true;

            // Update UI
            updateUI(true);

            // Start visualization
            if (window.visualize && !window.animationId) {
                window.visualize();
            }

            return true;
        } catch (error) {
            console.error('Microphone access failed:', error);
            isActive = false;
            updateUI(false);

            const statusText = document.getElementById('status-text');
            if (error.name === 'NotAllowedError') {
                if (statusText) statusText.textContent = 'Microphone access denied';
            } else if (error.name === 'NotFoundError') {
                if (statusText) statusText.textContent = 'No microphone found';
            } else {
                if (statusText) statusText.textContent = 'Microphone error: ' + error.message;
            }
            return false;
        }
    }

    function stop() {
        if (micSource) {
            try { micSource.disconnect(); } catch (e) {}
            micSource = null;
        }
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }

        isActive = false;
        updateUI(false);

        // Stop animation if no other source is playing
        if (window.animationId && !window.radioModule?.radioState?.isPlaying) {
            cancelAnimationFrame(window.animationId);
            window.animationId = null;
        }
    }

    function updateUI(active) {
        const micBtn = document.getElementById('mic-btn');
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const nowPlaying = document.getElementById('now-playing');

        if (micBtn) {
            micBtn.classList.toggle('active', active);
            micBtn.textContent = active ? 'Stop Mic' : 'Mic';
        }

        if (active) {
            // Deactivate other source buttons
            const radioBtn = document.getElementById('radio-btn');
            const captureBtn = document.getElementById('capture-btn');
            if (radioBtn) radioBtn.classList.remove('active');
            if (captureBtn) {
                captureBtn.classList.remove('active');
                captureBtn.textContent = 'Tab Audio';
            }

            if (statusIndicator) statusIndicator.classList.add('active');
            if (statusText) statusText.textContent = 'Microphone active';

            // Update now playing bar
            if (nowPlaying) {
                nowPlaying.classList.add('visible');
                const npName = document.getElementById('np-name');
                const npGenre = document.getElementById('np-genre');
                if (npName) npName.textContent = 'Microphone Input';
                if (npGenre) npGenre.textContent = 'Live Audio';
            }
        } else {
            if (statusIndicator && !window.radioModule?.radioState?.isPlaying) {
                statusIndicator.classList.remove('active');
            }
            if (statusText && !window.radioModule?.radioState?.isPlaying) {
                statusText.textContent = 'Microphone stopped';
            }
        }
    }

    function isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    return {
        start,
        stop,
        isSupported,
        isActive: () => isActive
    };
})();
