// AudioWave.app - Station Favorites Module
// Manages favorite radio stations with localStorage persistence

window.AudioWaveFavorites = (function() {
    'use strict';

    const STORAGE_KEY = 'audiowave-favorites';
    let favorites = [];

    function load() {
        try {
            favorites = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            favorites = [];
        }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (e) {}
    }

    function add(station) {
        if (!station || !station.url_resolved) return;
        // Avoid duplicates by URL
        if (favorites.some(f => f.url_resolved === station.url_resolved)) return;
        favorites.push({
            name: station.name,
            url_resolved: station.url_resolved,
            tags: station.tags || '',
            favicon: station.favicon || '',
            country: station.country || '',
            countrycode: station.countrycode || ''
        });
        save();
        render();
        updateHeartIcons();
    }

    function remove(url) {
        favorites = favorites.filter(f => f.url_resolved !== url);
        save();
        render();
        updateHeartIcons();
    }

    function toggle(station) {
        if (isFavorite(station?.url_resolved)) {
            remove(station.url_resolved);
        } else {
            add(station);
        }
    }

    function isFavorite(url) {
        return favorites.some(f => f.url_resolved === url);
    }

    function getAll() {
        return [...favorites];
    }

    function render() {
        const container = document.getElementById('favorites-list');
        if (!container) return;

        if (favorites.length === 0) {
            container.innerHTML = '<div class="no-stations">No favorites yet. Click the heart on a station to add it.</div>';
            return;
        }

        container.innerHTML = favorites.map((station, index) => `
            <div class="station-item favorite-item" data-fav-index="${index}" data-url="${escapeAttr(station.url_resolved)}">
                <span class="station-item-name">${escapeHtml(station.name)}</span>
                <div class="fav-actions">
                    <span class="station-item-freq">${station.tags ? station.tags.split(',')[0] : ''}</span>
                    <button class="fav-remove-btn" data-fav-url="${escapeAttr(station.url_resolved)}" aria-label="Remove from favorites">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Play on click
        container.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.fav-remove-btn')) return;
                const url = item.dataset.url;
                const station = favorites.find(f => f.url_resolved === url);
                if (station && window.radioModule) {
                    // Set as current station and play
                    window.radioModule.radioState.currentStation = station;
                    window.radioModule.radioState.currentStationIndex = -1;
                    const stationName = document.getElementById('station-name');
                    const stationGenre = document.getElementById('station-genre');
                    if (stationName) stationName.textContent = station.name;
                    if (stationGenre) stationGenre.textContent = station.tags ? station.tags.split(',').slice(0, 2).join(', ') : '';

                    // Play via the radio module's internal function (exposed on window)
                    if (window.radioModule.playStreamUrl) {
                        window.radioModule.playStreamUrl(station.url_resolved);
                    }
                }
            });
        });

        // Remove on heart click
        container.querySelectorAll('.fav-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                remove(btn.dataset.favUrl);
            });
        });
    }

    function updateHeartIcons() {
        document.querySelectorAll('.station-heart').forEach(heart => {
            const url = heart.dataset.url;
            heart.classList.toggle('favorited', isFavorite(url));
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function escapeAttr(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function init() {
        load();
        render();

        // Tab switching between stations and favorites
        document.querySelectorAll('.radio-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.radio-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.dataset.tab;
                document.getElementById('stations-tab-content').style.display = target === 'stations' ? 'block' : 'none';
                document.getElementById('favorites-tab-content').style.display = target === 'favorites' ? 'block' : 'none';

                if (target === 'favorites') render();
            });
        });
    }

    return {
        init,
        add,
        remove,
        toggle,
        isFavorite,
        getAll,
        render,
        updateHeartIcons
    };
})();
