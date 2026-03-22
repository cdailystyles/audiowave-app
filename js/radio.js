// Radio Module for AudioWave.app
// Handles radio streaming, station discovery, and location selection

const RADIO_API = 'https://de1.api.radio-browser.info/json';

// Comprehensive list of countries with radio stations
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'PT', name: 'Portugal' },
    { code: 'IE', name: 'Ireland' },
    { code: 'GR', name: 'Greece' },
    { code: 'RU', name: 'Russia' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'RO', name: 'Romania' },
    { code: 'HU', name: 'Hungary' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'PH', name: 'Philippines' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'SG', name: 'Singapore' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CL', name: 'Chile' },
    { code: 'PE', name: 'Peru' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'EG', name: 'Egypt' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KE', name: 'Kenya' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'IL', name: 'Israel' },
    { code: 'TR', name: 'Turkey' }
];

// Genre list
const GENRES = [
    { value: '', name: 'All Genres' },
    { value: 'pop', name: 'Pop' },
    { value: 'rock', name: 'Rock' },
    { value: 'hip hop', name: 'Hip Hop' },
    { value: 'electronic', name: 'Electronic' },
    { value: 'dance', name: 'Dance' },
    { value: 'house', name: 'House' },
    { value: 'techno', name: 'Techno' },
    { value: 'jazz', name: 'Jazz' },
    { value: 'classical', name: 'Classical' },
    { value: 'country', name: 'Country' },
    { value: 'rnb', name: 'R&B / Soul' },
    { value: 'reggae', name: 'Reggae' },
    { value: 'latin', name: 'Latin' },
    { value: 'metal', name: 'Metal' },
    { value: 'punk', name: 'Punk' },
    { value: 'indie', name: 'Indie' },
    { value: 'alternative', name: 'Alternative' },
    { value: 'ambient', name: 'Ambient' },
    { value: 'chillout', name: 'Chillout' },
    { value: 'lounge', name: 'Lounge' },
    { value: '80s', name: '80s' },
    { value: '90s', name: '90s' },
    { value: '70s', name: '70s' },
    { value: 'oldies', name: 'Oldies' },
    { value: 'blues', name: 'Blues' },
    { value: 'folk', name: 'Folk' },
    { value: 'world', name: 'World' },
    { value: 'news', name: 'News' },
    { value: 'talk', name: 'Talk' },
    { value: 'sports', name: 'Sports' }
];

// Radio state (restore saved country/genre)
const savedRadio = (() => { try { return JSON.parse(localStorage.getItem('audiowave-radio')) || {}; } catch { return {}; } })();
const radioState = {
    isPlaying: false,
    currentStation: null,
    stations: [],
    country: savedRadio.country || 'US',
    genre: savedRadio.genre || '',
    sortOrder: savedRadio.sortOrder || 'clickcount',
    audioElement: null,
    sourceNode: null,
    currentStationIndex: -1
};

// Save radio preferences
function saveRadioPrefs() {
    try {
        localStorage.setItem('audiowave-radio', JSON.stringify({ country: radioState.country, genre: radioState.genre, sortOrder: radioState.sortOrder }));
    } catch (e) {}
}

// Initialize country dropdown
function initCountryDropdown() {
    const countrySelect = document.getElementById('country-select');
    if (!countrySelect) return;

    countrySelect.innerHTML = COUNTRIES.map(c =>
        `<option value="${c.code}">${c.name}</option>`
    ).join('');

    countrySelect.value = radioState.country;
}

// Initialize genre dropdown
function initGenreDropdown() {
    const genreSelect = document.getElementById('genre-select');
    if (!genreSelect) return;

    genreSelect.innerHTML = GENRES.map(g =>
        `<option value="${g.value}">${g.name}</option>`
    ).join('');
}

// Fetch stations based on current filters
async function fetchStations() {
    const stationList = document.getElementById('station-list');
    const refreshBtn = document.getElementById('refresh-stations');
    const stationListTitle = document.getElementById('station-list-title');

    if (refreshBtn) refreshBtn.classList.add('loading');
    if (stationList) {
        stationList.innerHTML = '<div class="loading-message">Loading stations...</div>';
    }

    try {
        let url = `${RADIO_API}/stations/search?limit=80&order=${radioState.sortOrder}&reverse=true&hidebroken=true&has_extended_info=true&is_https=true`;

        if (radioState.country) {
            url += `&countrycode=${radioState.country}`;
        }
        if (radioState.genre) {
            url += `&tag=${encodeURIComponent(radioState.genre)}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const stations = await response.json();

        if (!Array.isArray(stations)) {
            throw new Error('Invalid response from server');
        }

        radioState.stations = stations
            .filter(s => s.url_resolved && !failedUrls.has(s.url_resolved))
            .sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
            .slice(0, 30);
        radioState.currentStationIndex = -1;

        // Update title
        if (stationListTitle) {
            const country = COUNTRIES.find(c => c.code === radioState.country);
            let title = country ? country.name : 'Stations';
            if (radioState.genre) {
                const genre = GENRES.find(g => g.value === radioState.genre);
                title += ` - ${genre ? genre.name : radioState.genre}`;
            }
            stationListTitle.textContent = title || 'Stations';
        }

        renderStationList();
    } catch (error) {
        console.error('Failed to fetch stations:', error);
        let errorMessage = 'Failed to load stations';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        } else if (!navigator.onLine) {
            errorMessage = 'No internet connection';
        } else if (error.message.includes('Server error')) {
            errorMessage = 'Server temporarily unavailable';
        }
        if (stationList) {
            stationList.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        }
    } finally {
        if (refreshBtn) refreshBtn.classList.remove('loading');
    }
}

// Render station list with favorite hearts
function renderStationList() {
    const stationList = document.getElementById('station-list');
    if (!stationList) return;

    if (radioState.stations.length === 0) {
        stationList.innerHTML = '<div class="no-stations">No stations found. Try different filters.</div>';
        return;
    }

    const favModule = window.AudioWaveFavorites;

    stationList.innerHTML = radioState.stations.map((station, index) => {
        const isFav = favModule ? favModule.isFavorite(station.url_resolved) : false;
        return `
        <div class="station-item ${radioState.currentStationIndex === index ? 'active' : ''}" data-index="${index}">
            <span class="station-item-name">${escapeHtml(station.name)}</span>
            <div class="station-item-actions">
                <span class="station-item-freq">${station.tags ? station.tags.split(',')[0] : ''}</span>
                <button class="station-heart ${isFav ? 'favorited' : ''}" data-url="${escapeAttr(station.url_resolved)}" data-index="${index}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
            </div>
        </div>`;
    }).join('');

    // Add click handlers
    stationList.querySelectorAll('.station-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.station-heart')) return;
            const index = parseInt(item.dataset.index);
            playStation(index);
        });
    });

    // Heart click handlers
    stationList.querySelectorAll('.station-heart').forEach(heart => {
        heart.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(heart.dataset.index);
            const station = radioState.stations[index];
            if (station && favModule) {
                favModule.toggle(station);
                // Re-render to update heart icon
                renderStationList();
            }
        });
    });
}

// Use shared utilities from utils.js
const escapeHtml = window.AudioWaveUtils.escapeHtml;
const escapeAttr = window.AudioWaveUtils.escapeAttr;
const isValidStreamUrl = window.AudioWaveUtils.isValidStreamUrl;

// Play a station by index
async function playStation(index) {
    const station = radioState.stations[index];
    if (!station) return;

    radioState.currentStationIndex = index;
    radioState.currentStation = station;

    // Update UI
    const stationName = document.getElementById('station-name');
    const stationGenre = document.getElementById('station-genre');

    if (stationName) stationName.textContent = station.name;
    if (stationGenre) stationGenre.textContent = station.tags ? station.tags.split(',').slice(0, 2).join(', ') : '';

    renderStationList();
    await playStreamUrl(station.url_resolved);
}

// Track failed stations to avoid retrying them in this session
const failedUrls = new Set();

// Auto-skip to next working station on failure
function autoSkipToNext(reason) {
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = reason + ' — skipping...';

    // Mark current URL as failed
    if (radioState.currentStation?.url_resolved) {
        failedUrls.add(radioState.currentStation.url_resolved);
    }

    // Find next non-failed station
    if (radioState.stations.length > 1) {
        let attempts = 0;
        let idx = radioState.currentStationIndex;
        while (attempts < radioState.stations.length) {
            idx = (idx + 1) % radioState.stations.length;
            if (!failedUrls.has(radioState.stations[idx].url_resolved)) {
                setTimeout(() => playStation(idx), 300);
                return;
            }
            attempts++;
        }
    }
    // All stations failed
    if (statusText) statusText.textContent = 'No working stations found — try different filters';
    hideNowPlaying();
}

// Play a stream URL
async function playStreamUrl(url) {
    // Stop mic if active
    if (window.AudioWaveMic?.isActive()) {
        window.AudioWaveMic.stop();
    }

    // Clear any previous loading timeout
    if (radioState._loadingTimeout) {
        clearTimeout(radioState._loadingTimeout);
        radioState._loadingTimeout = null;
    }

    // Disconnect previous source if exists
    if (radioState.sourceNode) {
        try {
            radioState.sourceNode.disconnect();
        } catch (e) {}
        radioState.sourceNode = null;
    }

    // Stop previous audio and remove listeners
    if (radioState.audioElement) {
        radioState.audioElement.pause();
        radioState.audioElement.removeAttribute('src');
        radioState.audioElement.load();
        radioState.audioElement = null;
    }

    const isCustom = !radioState.currentStation || radioState.currentStation.name === 'Custom Stream';

    try {
        // Create audio element
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        radioState.audioElement = audio;

        const volumeSlider = document.getElementById('radio-volume');
        audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.7;

        // Set up audio context and analyser
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context if suspended
        if (window.audioContext.state === 'suspended') {
            await window.audioContext.resume();
        }

        // Update UI to show loading state
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        const stationLabel = radioState.currentStation?.name || 'Custom Stream';

        if (statusText) statusText.textContent = 'Connecting: ' + stationLabel;
        if (statusIndicator) statusIndicator.classList.add('active');

        // Set up error/stall handlers BEFORE setting src
        audio.addEventListener('error', () => {
            if (audio !== radioState.audioElement) return; // stale element
            console.warn('Stream error for:', stationLabel);
            radioState.isPlaying = false;
            updatePlayButton(false);
            if (isCustom) {
                if (statusText) statusText.textContent = 'Stream failed — check URL';
                if (statusIndicator) statusIndicator.classList.remove('active');
                hideNowPlaying();
            } else {
                autoSkipToNext('Stream error');
            }
        });

        audio.addEventListener('stalled', () => {
            if (audio !== radioState.audioElement) return;
            if (statusText) statusText.textContent = 'Buffering: ' + stationLabel;
        });

        // Set src and start loading
        audio.src = url;

        // Connect to analyser
        radioState.sourceNode = window.audioContext.createMediaElementSource(audio);

        if (!window.analyser) {
            window.analyser = window.audioContext.createAnalyser();
            window.analyser.fftSize = 2048;
        }
        if (window.config) {
            window.analyser.smoothingTimeConstant = window.config.smoothing;
        }

        radioState.sourceNode.connect(window.analyser);
        window.analyser.connect(window.audioContext.destination);

        window.bufferLength = window.analyser.frequencyBinCount;
        window.dataArray = new Uint8Array(window.bufferLength);

        // Loading timeout — if no audio plays within 8s, skip
        radioState._loadingTimeout = setTimeout(() => {
            if (audio !== radioState.audioElement) return;
            if (!radioState.isPlaying) {
                console.warn('Loading timeout for:', stationLabel);
                audio.pause();
                audio.removeAttribute('src');
                if (isCustom) {
                    if (statusText) statusText.textContent = 'Timed out — stream not responding';
                    if (statusIndicator) statusIndicator.classList.remove('active');
                    hideNowPlaying();
                } else {
                    autoSkipToNext('Timed out');
                }
            }
        }, 8000);

        // Start playing
        audio.play().then(() => {
            if (audio !== radioState.audioElement) return;
            clearTimeout(radioState._loadingTimeout);
            radioState.isPlaying = true;
            updatePlayButton(true);
            if (statusText) statusText.textContent = 'Playing: ' + stationLabel;

            // Update now playing bar
            updateNowPlaying(stationLabel, radioState.currentStation?.tags || '');
        }).catch(error => {
            if (audio !== radioState.audioElement) return;
            console.error('Playback failed:', error);
            radioState.isPlaying = false;
            updatePlayButton(false);
            if (isCustom) {
                if (statusIndicator) statusIndicator.classList.remove('active');
                if (statusText) statusText.textContent = 'Playback failed — check URL';
                hideNowPlaying();
            } else {
                autoSkipToNext('Playback failed');
            }
        });

        // Start visualization if available
        if (window.visualize && !window.animationId) {
            window.visualize();
        }

    } catch (error) {
        console.error('Failed to play stream:', error);
        radioState.isPlaying = false;
        updatePlayButton(false);
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) statusIndicator.classList.remove('active');
        if (isCustom) {
            if (statusText) statusText.textContent = 'Failed to play stream';
            hideNowPlaying();
        } else {
            autoSkipToNext('Connection failed');
        }
    }
}

// Update now playing bar
function updateNowPlaying(name, tags) {
    const nowPlaying = document.getElementById('now-playing');
    if (!nowPlaying) return;

    nowPlaying.classList.add('visible');
    const npName = document.getElementById('np-name');
    const npGenre = document.getElementById('np-genre');
    if (npName) npName.textContent = name;
    if (npGenre) npGenre.textContent = tags ? tags.split(',').slice(0, 2).join(', ') : 'Radio';

    // Update now playing play button
    const npPlayBtn = document.getElementById('np-play');
    if (npPlayBtn) npPlayBtn.classList.add('playing');
}

function hideNowPlaying() {
    const nowPlaying = document.getElementById('now-playing');
    if (nowPlaying) nowPlaying.classList.remove('visible');
}

// Stop radio playback
function stopRadio() {
    if (radioState._loadingTimeout) {
        clearTimeout(radioState._loadingTimeout);
        radioState._loadingTimeout = null;
    }

    if (radioState.sourceNode) {
        try {
            radioState.sourceNode.disconnect();
        } catch (e) {}
        radioState.sourceNode = null;
    }

    if (radioState.audioElement) {
        radioState.audioElement.pause();
        radioState.audioElement.removeAttribute('src');
        radioState.audioElement.load();
        radioState.audioElement = null;
    }

    radioState.isPlaying = false;
    updatePlayButton(false);

    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (statusIndicator) statusIndicator.classList.remove('active');
    if (statusText) statusText.textContent = 'Stopped';

    // Update now playing bar
    const npPlayBtn = document.getElementById('np-play');
    if (npPlayBtn) npPlayBtn.classList.remove('playing');
}

// Update play button state
function updatePlayButton(playing) {
    const playBtn = document.getElementById('play-radio');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    if (playBtn) {
        if (playing) {
            playBtn.classList.add('playing');
        } else {
            playBtn.classList.remove('playing');
        }
    }

    if (playIcon) playIcon.style.display = playing ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = playing ? 'block' : 'none';

    // Also update now playing play button
    const npPlayBtn = document.getElementById('np-play');
    if (npPlayBtn) {
        npPlayBtn.classList.toggle('playing', playing);
    }
}

// Navigate to previous station
function prevStation() {
    if (radioState.stations.length === 0) return;
    let newIndex = radioState.currentStationIndex - 1;
    if (newIndex < 0) newIndex = radioState.stations.length - 1;
    playStation(newIndex);
}

// Navigate to next station
function nextStation() {
    if (radioState.stations.length === 0) return;
    let newIndex = radioState.currentStationIndex + 1;
    if (newIndex >= radioState.stations.length) newIndex = 0;
    playStation(newIndex);
}

// Station search
function initStationSearch() {
    const searchInput = document.getElementById('station-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (!query) {
            renderStationList();
            return;
        }

        searchTimeout = setTimeout(() => {
            searchStations(query);
        }, 400);
    });
}

async function searchStations(query) {
    const stationList = document.getElementById('station-list');
    if (!stationList) return;

    stationList.innerHTML = '<div class="loading-message">Searching...</div>';

    try {
        const url = `${RADIO_API}/stations/search?name=${encodeURIComponent(query)}&limit=50&order=clickcount&reverse=true&hidebroken=true&is_https=true`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Search failed');

        const stations = await response.json();
        if (!Array.isArray(stations)) throw new Error('Invalid response');

        radioState.stations = stations
            .filter(s => s.url_resolved && !failedUrls.has(s.url_resolved))
            .sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
            .slice(0, 30);
        radioState.currentStationIndex = -1;
        renderStationList();
    } catch (error) {
        console.error('Station search failed:', error);
        if (stationList) {
            stationList.innerHTML = '<div class="error-message">Search failed. Try again.</div>';
        }
    }
}

// Detect user location (skip if saved preference exists)
async function detectLocation() {
    if (savedRadio.country) {
        const countrySelect = document.getElementById('country-select');
        if (countrySelect) countrySelect.value = radioState.country;
        const genreSelect = document.getElementById('genre-select');
        if (genreSelect) genreSelect.value = radioState.genre;
        await fetchStations();
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Location service unavailable');
        }

        const data = await response.json();
        const detectedCountry = data.country_code;

        if (detectedCountry && COUNTRIES.some(c => c.code === detectedCountry)) {
            radioState.country = detectedCountry;
        } else {
            radioState.country = 'US';
        }

        const countrySelect = document.getElementById('country-select');
        if (countrySelect) countrySelect.value = radioState.country;

        saveRadioPrefs();
        await fetchStations();
    } catch (error) {
        console.error('Location detection failed:', error);
        radioState.country = 'US';
        const countrySelect = document.getElementById('country-select');
        if (countrySelect) countrySelect.value = 'US';
        await fetchStations();
    }
}

// Initialize radio event listeners
function initRadioEventListeners() {
    // Country select
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
        countrySelect.addEventListener('change', async (e) => {
            radioState.country = e.target.value;
            saveRadioPrefs();
            // Clear search when changing filters
            const searchInput = document.getElementById('station-search');
            if (searchInput) searchInput.value = '';
            await fetchStations();
        });
    }

    // Genre select
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        genreSelect.addEventListener('change', async (e) => {
            radioState.genre = e.target.value;
            saveRadioPrefs();
            const searchInput = document.getElementById('station-search');
            if (searchInput) searchInput.value = '';
            await fetchStations();
        });
    }

    // Play/Pause button
    const playRadioBtn = document.getElementById('play-radio');
    if (playRadioBtn) {
        playRadioBtn.addEventListener('click', () => {
            if (radioState.isPlaying) {
                stopRadio();
            } else if (radioState.currentStation) {
                playStreamUrl(radioState.currentStation.url_resolved);
            } else if (radioState.stations.length > 0) {
                playStation(0);
            }
        });
    }

    // Navigation buttons
    const prevBtn = document.getElementById('prev-station');
    const nextBtn = document.getElementById('next-station');
    if (prevBtn) prevBtn.addEventListener('click', prevStation);
    if (nextBtn) nextBtn.addEventListener('click', nextStation);

    // Volume control
    const volumeSlider = document.getElementById('radio-volume');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (radioState.audioElement) {
                radioState.audioElement.volume = parseFloat(e.target.value);
            }
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-stations');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchStations);
    }

    // Custom URL
    const playCustomBtn = document.getElementById('play-custom');
    const customUrlInput = document.getElementById('custom-url');

    if (playCustomBtn && customUrlInput) {
        playCustomBtn.addEventListener('click', () => {
            const url = customUrlInput.value.trim();
            if (!url) {
                const statusText = document.getElementById('status-text');
                if (statusText) statusText.textContent = 'Please enter a stream URL';
                return;
            }
            if (!isValidStreamUrl(url)) {
                const statusText = document.getElementById('status-text');
                if (statusText) statusText.textContent = 'Invalid URL - must start with http:// or https://';
                customUrlInput.focus();
                return;
            }
            radioState.currentStation = { name: 'Custom Stream', url_resolved: url };
            radioState.currentStationIndex = -1;
            const stationName = document.getElementById('station-name');
            const stationGenre = document.getElementById('station-genre');
            if (stationName) stationName.textContent = 'Custom Stream';
            if (stationGenre) stationGenre.textContent = '';
            playStreamUrl(url);
        });

        customUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                playCustomBtn.click();
            }
        });
    }

    // Now Playing bar controls
    const npPlayBtn = document.getElementById('np-play');
    const npPrevBtn = document.getElementById('np-prev');
    const npNextBtn = document.getElementById('np-next');

    if (npPlayBtn) {
        npPlayBtn.addEventListener('click', () => {
            if (radioState.isPlaying) {
                stopRadio();
            } else if (radioState.currentStation) {
                playStreamUrl(radioState.currentStation.url_resolved);
            }
        });
    }
    if (npPrevBtn) npPrevBtn.addEventListener('click', prevStation);
    if (npNextBtn) npNextBtn.addEventListener('click', nextStation);

    // Sort select
    const sortSelect = document.getElementById('station-sort');
    if (sortSelect) {
        sortSelect.value = radioState.sortOrder;
        sortSelect.addEventListener('change', async (e) => {
            radioState.sortOrder = e.target.value;
            saveRadioPrefs();
            await fetchStations();
        });
    }

    // Offline/online detection
    window.addEventListener('offline', () => {
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'No internet connection';
        const radioPanel = document.getElementById('radio-panel');
        if (radioPanel) radioPanel.classList.add('offline');
    });
    window.addEventListener('online', () => {
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Back online';
        const radioPanel = document.getElementById('radio-panel');
        if (radioPanel) radioPanel.classList.remove('offline');
    });

    // Station search
    initStationSearch();
}

// Initialize radio module
function initRadio() {
    initCountryDropdown();
    initGenreDropdown();
    initRadioEventListeners();
    detectLocation();
}

// Export functions
window.radioModule = {
    init: initRadio,
    playStation,
    playStreamUrl,
    stopRadio,
    prevStation,
    nextStation,
    fetchStations,
    radioState
};
