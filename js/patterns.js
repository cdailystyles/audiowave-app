// AudioWave.app - Visualization Patterns Module
// All 24 canvas-based audio visualization patterns

window.AudioWavePatterns = (function() {
    'use strict';

    // Shared state references (set by app.js)
    let ctx, width, height, dataArray, bufferLength, analyser;
    let config, time, hue;
    let getColor;

    function init(refs) {
        ctx = refs.ctx;
        width = refs.width;
        height = refs.height;
        dataArray = refs.dataArray;
        bufferLength = refs.bufferLength;
        analyser = refs.analyser;
        config = refs.config;
        time = refs.time;
        hue = refs.hue;
        getColor = refs.getColor;
    }

    function update(refs) {
        if (refs.width !== undefined) width = refs.width;
        if (refs.height !== undefined) height = refs.height;
        if (refs.dataArray !== undefined) dataArray = refs.dataArray;
        if (refs.bufferLength !== undefined) bufferLength = refs.bufferLength;
        if (refs.analyser !== undefined) analyser = refs.analyser;
        if (refs.time !== undefined) time = refs.time;
        if (refs.hue !== undefined) hue = refs.hue;
    }

    // --- Pattern Functions ---

    function drawBars() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * config.amplitude * 0.8;
            const color = getColor(i, bufferLength);
            ctx.fillStyle = color;
            ctx.shadowBlur = config.glow;
            ctx.shadowColor = color;
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
        ctx.shadowBlur = 0;
    }

    function drawWave() {
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 3;
        ctx.shadowBlur = config.glow;
        for (let layer = 0; layer < 3; layer++) {
            const color = getColor(layer * 100, 300);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            const sliceWidth = width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * height / 2) + (layer * 40 - 40);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawCircular() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        ctx.shadowBlur = config.glow;
        for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const amp = (dataArray[i] / 255) * radius * config.amplitude;
            const x = centerX + Math.cos(angle) * (radius + amp);
            const y = centerY + Math.sin(angle) * (radius + amp);
            const color = getColor(i, bufferLength);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(x, y, 2 + amp / 20, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function drawSpectrum() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2.5;
        ctx.lineWidth = 2;
        ctx.shadowBlur = config.glow;
        for (let i = 0; i < bufferLength; i += 2) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const barHeight = (dataArray[i] / 255) * maxRadius * config.amplitude;
            const x1 = centerX + Math.cos(angle) * (maxRadius * 0.3);
            const y1 = centerY + Math.sin(angle) * (maxRadius * 0.3);
            const x2 = centerX + Math.cos(angle) * (maxRadius * 0.3 + barHeight);
            const y2 = centerY + Math.sin(angle) * (maxRadius * 0.3 + barHeight);
            const color = getColor(i, bufferLength);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawRadial() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let ring = 0; ring < 8; ring++) {
            const baseRadius = (ring + 1) * 30;
            const color = getColor(ring * 30, 240);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i <= bufferLength; i += 4) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const amp = (dataArray[i] / 255) * 50 * config.amplitude;
                const radius = baseRadius + amp;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawParticles() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = config.glow;
        for (let i = 0; i < bufferLength; i += 3) {
            const x = (i / bufferLength) * width;
            const y = height / 2 + Math.sin(i * 0.1 + time) * 100;
            const size = (dataArray[i] / 255) * 20 * config.amplitude;
            const color = getColor(i, bufferLength);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function drawRings() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.lineWidth = 3;
        ctx.shadowBlur = config.glow;
        for (let i = 0; i < bufferLength; i += 8) {
            const radius = (dataArray[i] / 255) * Math.min(width, height) * 0.4 * config.amplitude;
            const color = getColor(i, bufferLength);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawDNA() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.shadowBlur = config.glow;
        for (let strand = 0; strand < 2; strand++) {
            const offset = strand * Math.PI;
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i += 2) {
                const x = (i / bufferLength) * width;
                const amp = (dataArray[i] / 255) * 100 * config.amplitude;
                const y = height / 2 + Math.sin(i * 0.05 + time + offset) * amp;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            const color = getColor(strand * 150, 300);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawSpiral() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.lineWidth = 2;
        ctx.shadowBlur = config.glow;
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 8 + time;
            const radius = (i / bufferLength) * Math.min(width, height) / 2;
            const amp = (dataArray[i] / 255) * 50 * config.amplitude;
            const x = centerX + Math.cos(angle) * (radius + amp);
            const y = centerY + Math.sin(angle) * (radius + amp);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        const color = getColor(0, 1);
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawGrid() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);
        const cols = 20, rows = 15;
        const cellWidth = width / cols, cellHeight = height / rows;
        ctx.shadowBlur = config.glow;
        for (let i = 0; i < cols * rows; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const dataIndex = Math.floor((i / (cols * rows)) * bufferLength);
            const x = col * cellWidth, y = row * cellHeight;
            const brightness = (dataArray[dataIndex] / 255) * config.amplitude;
            const color = getColor(i, cols * rows);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.globalAlpha = brightness;
            ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    function drawTunnel() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let layer = 15; layer > 0; layer--) {
            const layerSize = (layer / 15) * Math.min(width, height) / 2;
            const dataIndex = Math.floor((layer / 15) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * 50 * config.amplitude;
            const color = getColor(layer * 20, 300);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, layerSize + amp, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawPlasma() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, width, height);
        const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const intensity = (avgFreq / 255) * config.amplitude;
        const cellSize = 12;
        const lightness = 50 + intensity * 30;
        const alpha = 0.3 + intensity * 0.5;
        for (let y = 0; y < height; y += cellSize) {
            const sinY = Math.sin(y * 0.01 + time);
            for (let x = 0; x < width; x += cellSize) {
                const value1 = Math.sin(x * 0.01 + time);
                const value3 = Math.sin((x + y) * 0.008 + time);
                const plasma = (value1 + sinY + value3) / 3;
                const colorValue = ((plasma + 1) * 180 + hue) % 360;
                ctx.fillStyle = `hsla(${colorValue}, 100%, ${lightness}%, ${alpha})`;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }

    function drawFractal() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let iteration = 0; iteration < 5; iteration++) {
            const scale = Math.pow(0.6, iteration);
            const rotation = time * (iteration + 1) * 0.2;
            for (let i = 0; i < bufferLength; i += 4) {
                const angle = (i / bufferLength) * Math.PI * 2 + rotation;
                const radius = (dataArray[i] / 255) * 200 * scale * config.amplitude;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                const color = getColor(i + iteration * 50, bufferLength);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }

    function drawMandala() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let petal = 0; petal < 12; petal++) {
            const petalAngle = (petal / 12) * Math.PI * 2;
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i += 3) {
                const t = i / bufferLength;
                const angle = petalAngle + Math.sin(t * Math.PI * 4 + time) * 0.5;
                const radius = (dataArray[i] / 255) * 150 * config.amplitude * (1 - t * 0.5);
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            const color = getColor(petal * 30, 360);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawGalaxy() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let arm = 0; arm < 4; arm++) {
            const armAngle = (arm / 4) * Math.PI * 2;
            for (let i = 0; i < bufferLength; i += 2) {
                const t = i / bufferLength;
                const spiralAngle = armAngle + t * Math.PI * 4 + time * 0.5;
                const radius = t * Math.min(width, height) * 0.4;
                const amp = (dataArray[i] / 255) * 50 * config.amplitude;
                const x = centerX + Math.cos(spiralAngle) * (radius + amp);
                const y = centerY + Math.sin(spiralAngle) * (radius + amp);
                const color = getColor(i, bufferLength);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                const size = (dataArray[i] / 255) * 4 * config.amplitude;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }

    function drawVortex() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.lineWidth = 2;
        ctx.shadowBlur = config.glow;
        for (let layer = 0; layer < 20; layer++) {
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i += 3) {
                const angle = (i / bufferLength) * Math.PI * 2 + time + layer * 0.3;
                const radiusBase = (layer / 20) * Math.min(width, height) * 0.4;
                const amp = (dataArray[i] / 255) * 30 * config.amplitude;
                const radius = radiusBase + amp;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            const color = getColor(layer * 15, 300);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawKaleidoscope() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let segment = 0; segment < 8; segment++) {
            const segmentAngle = (segment / 8) * Math.PI * 2;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(segmentAngle);
            for (let i = 0; i < bufferLength; i += 4) {
                const x = (i / bufferLength) * 200;
                const y = Math.sin(i * 0.1 + time) * (dataArray[i] / 255) * 100 * config.amplitude;
                const color = getColor(i, bufferLength);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, -y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
        ctx.fillRect(0, 0, width, height);
        const cols = 40;
        const colWidth = width / cols;
        ctx.shadowBlur = config.glow;
        ctx.font = '14px JetBrains Mono';
        for (let col = 0; col < cols; col++) {
            const dataIndex = Math.floor((col / cols) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * config.amplitude;
            const dropHeight = amp * height;
            for (let i = 0; i < dropHeight; i += 20) {
                const char = String.fromCharCode(0x30A0 + Math.random() * 96);
                const x = col * colWidth;
                const y = (i + time * 50) % height;
                const opacity = 1 - (i / dropHeight);
                const color = getColor(col, cols);
                ctx.fillStyle = color.replace('hsl(', 'hsla(').replace('60%)', `60%, ${opacity})`);
                ctx.shadowColor = color;
                ctx.fillText(char, x, y);
            }
        }
        ctx.shadowBlur = 0;
    }

    function drawNebula() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.06)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2;
        ctx.shadowBlur = config.glow * 2;
        for (let i = 0; i < bufferLength; i += 2) {
            const angle = (i / bufferLength) * Math.PI * 4 + time * 0.5;
            const baseDistance = (i / bufferLength) * maxRadius * 0.8;
            const amp = (dataArray[i] / 255) * config.amplitude;
            const distance = baseDistance + amp * 50;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = amp * 15 + 2;
            const color = getColor(i, bufferLength);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function drawHelix() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = config.glow;
        for (let strand = 0; strand < 3; strand++) {
            const offset = (strand / 3) * Math.PI * 2;
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i += 2) {
                const t = i / bufferLength;
                const x = t * width;
                const angle = t * Math.PI * 6 + time + offset;
                const amp = (dataArray[i] / 255) * 80 * config.amplitude;
                const y = height / 2 + Math.sin(angle) * amp + Math.cos(t * Math.PI * 2) * 50;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            const color = getColor(strand * 100, 300);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    function drawPetals() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        for (let petal = 0; petal < 16; petal++) {
            const petalAngle = (petal / 16) * Math.PI * 2 + time * 0.5;
            const dataIndex = Math.floor((petal / 16) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * config.amplitude;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(petalAngle);
            const petalLength = 100 + amp * 100;
            const petalWidth = 30 + amp * 20;
            const color = getColor(petal, 16);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.ellipse(petalLength / 2, 0, petalLength / 2, petalWidth / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }

    function drawCrystals() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        const centerX = width / 2, centerY = height / 2;
        ctx.shadowBlur = config.glow;
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 0.3;
            const dataIndex = Math.floor((i / 12) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * config.amplitude;
            const distance = 100 + amp * 150;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = 20 + amp * 30;
            const color = getColor(i, 12);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            for (let v = 0; v < 6; v++) {
                const va = (v / 6) * Math.PI * 2;
                const vx = x + Math.cos(va) * size;
                const vy = y + Math.sin(va) * size;
                if (v === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
            ctx.stroke();
            for (let v = 0; v < 6; v++) {
                const va = (v / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(va) * size, y + Math.sin(va) * size);
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
    }

    function drawFireworks() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = config.glow;
        for (let burst = 0; burst < 8; burst++) {
            const dataIndex = Math.floor((burst / 8) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * config.amplitude;
            if (amp > 0.3) {
                const x = ((burst + 0.5) / 8) * width;
                const y = height * 0.3 + Math.sin(time + burst) * 50 + (1 - amp) * 100;
                const color = getColor(burst * 30, 240);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                const burstRadius = amp * 80 + 20;
                for (let p = 0; p < 24; p++) {
                    const pa = (p / 24) * Math.PI * 2;
                    const dist = burstRadius * (0.5 + amp * 0.5);
                    const px = x + Math.cos(pa) * dist;
                    const py = y + Math.sin(pa) * dist;
                    ctx.beginPath();
                    ctx.arc(px, py, 2 + amp * 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(px, py);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        ctx.shadowBlur = 0;
    }

    function drawLightning() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = config.glow * 1.5;
        ctx.lineWidth = 3;
        for (let bolt = 0; bolt < 5; bolt++) {
            const dataIndex = Math.floor((bolt / 5) * bufferLength);
            const amp = (dataArray[dataIndex] / 255) * config.amplitude;
            if (amp > 0.3) {
                const startX = (bolt / 5) * width + width / 10;
                let currentX = startX, currentY = 0;
                const color = getColor(bolt * 50, 250);
                ctx.strokeStyle = color;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                for (let seg = 0; seg < 15; seg++) {
                    currentX += (Math.random() - 0.5) * 60 * amp;
                    currentY += (height / 15) + (Math.random() - 0.5) * 20;
                    ctx.lineTo(currentX, currentY);
                    if (Math.random() > 0.7) {
                        const branchX = currentX + (Math.random() - 0.5) * 40 * amp;
                        const branchY = currentY + 30;
                        ctx.moveTo(currentX, currentY);
                        ctx.lineTo(branchX, branchY);
                        ctx.moveTo(currentX, currentY);
                    }
                }
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
    }

    // Pattern registry
    const patterns = {
        bars: drawBars,
        wave: drawWave,
        circular: drawCircular,
        spectrum: drawSpectrum,
        radial: drawRadial,
        particles: drawParticles,
        rings: drawRings,
        dna: drawDNA,
        spiral: drawSpiral,
        grid: drawGrid,
        tunnel: drawTunnel,
        plasma: drawPlasma,
        fractal: drawFractal,
        mandala: drawMandala,
        galaxy: drawGalaxy,
        vortex: drawVortex,
        kaleidoscope: drawKaleidoscope,
        matrix: drawMatrix,
        nebula: drawNebula,
        helix: drawHelix,
        petals: drawPetals,
        crystals: drawCrystals,
        fireworks: drawFireworks,
        lightning: drawLightning
    };

    // Pattern names for display
    const patternNames = {
        bars: 'Bars', wave: 'Wave', circular: 'Circle', spectrum: 'Spect',
        radial: 'Radial', particles: 'Parts', rings: 'Rings', dna: 'DNA',
        spiral: 'Spiral', grid: 'Grid', tunnel: 'Tunnel', plasma: 'Plasma',
        fractal: 'Fractal', mandala: 'Mandala', galaxy: 'Galaxy', vortex: 'Vortex',
        kaleidoscope: 'Kaleid', matrix: 'Matrix', nebula: 'Nebula', helix: 'Helix',
        petals: 'Petals', crystals: 'Crystal', fireworks: 'Firewk', lightning: 'Light'
    };

    const patternList = Object.keys(patterns);

    return {
        init,
        update,
        patterns,
        patternNames,
        patternList,
        draw(name) {
            const fn = patterns[name];
            if (fn) fn();
        }
    };
})();
