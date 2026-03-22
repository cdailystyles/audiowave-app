// AudioWave.app - Shared Utility Functions
// Common helpers used across multiple modules

window.AudioWaveUtils = (function() {
    'use strict';

    /**
     * Escape HTML special characters to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Escape text for use in HTML attributes
     */
    function escapeAttr(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    /**
     * Validate that a URL is a valid HTTP/HTTPS stream URL
     */
    function isValidStreamUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    return {
        escapeHtml,
        escapeAttr,
        isValidStreamUrl
    };
})();
