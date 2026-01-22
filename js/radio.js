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

// Radio state
const radioState = {
    isPlaying: false,
    currentStation: null,
    stations: [],
    location: { country: 'US', state: '' },
    genre: '',
    audioElement: null,
    sourceNode: null,
    currentStationIndex: -1,
    statesCache: {}
};

// Initialize country dropdown
function initCountryDropdown() {
    const countrySelect = document.getElementById('country-select');
    if (!countrySelect) return;

    countrySelect.innerHTML = COUNTRIES.map(c =>
        `<option value="${c.code}">${c.name}</option>`
    ).join('');

    countrySelect.value = radioState.location.country;
}

// Initialize genre dropdown
function initGenreDropdown() {
    const genreSelect = document.getElementById('genre-select');
    if (!genreSelect) return;

    genreSelect.innerHTML = GENRES.map(g =>
        `<option value="${g.value}">${g.name}</option>`
    ).join('');
}

// Fetch states/regions for a country
async function fetchStates(countryCode) {
    // Check cache first
    if (radioState.statesCache[countryCode]) {
        return radioState.statesCache[countryCode];
    }

    try {
        const response = await fetch(`${RADIO_API}/states/${countryCode}/?hidebroken=true`);
        const states = await response.json();

        // Filter to states that actually have stations
        const validStates = states
            .filter(s => s.stationcount > 0)
            .sort((a, b) => b.stationcount - a.stationcount)
            .slice(0, 50); // Limit to top 50

        radioState.statesCache[countryCode] = validStates;
        return validStates;
    } catch (error) {
        console.error('Failed to fetch states:', error);
        return [];
    }
}

// Update state dropdown based on selected country
async function updateStateDropdown(countryCode) {
    const stateSelect = document.getElementById('state-select');
    if (!stateSelect) return;

    stateSelect.innerHTML = '<option value="">Loading...</option>';
    stateSelect.disabled = true;

    const states = await fetchStates(countryCode);

    if (states.length === 0) {
        stateSelect.innerHTML = '<option value="">All Regions</option>';
    } else {
        stateSelect.innerHTML = '<option value="">All Regions</option>' +
            states.map(s => `<option value="${s.name}">${s.name} (${s.stationcount})</option>`).join('');
    }

    stateSelect.disabled = false;
    radioState.location.state = '';
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
        let url = `${RADIO_API}/stations/search?limit=50&order=clickcount&reverse=true&hidebroken=true`;

        if (radioState.location.country) {
            url += `&countrycode=${radioState.location.country}`;
        }
        if (radioState.location.state) {
            url += `&state=${encodeURIComponent(radioState.location.state)}`;
        }
        if (radioState.genre) {
            url += `&tag=${encodeURIComponent(radioState.genre)}`;
        }

        const response = await fetch(url);
        const stations = await response.json();

        radioState.stations = stations.filter(s => s.url_resolved).slice(0, 30);
        radioState.currentStationIndex = -1;

        // Update title
        if (stationListTitle) {
            let title = '';
            if (radioState.location.state) {
                title = radioState.location.state;
            } else {
                const country = COUNTRIES.find(c => c.code === radioState.location.country);
                title = country ? country.name : 'Stations';
            }
            if (radioState.genre) {
                const genre = GENRES.find(g => g.value === radioState.genre);
                title += ` - ${genre ? genre.name : radioState.genre}`;
            }
            stationListTitle.textContent = title || 'Stations';
        }

        renderStationList();
    } catch (error) {
        console.error('Failed to fetch stations:', error);
        if (stationList) {
            stationList.innerHTML = '<div class="error-message">Failed to load stations</div>';
        }
    } finally {
        if (refreshBtn) refreshBtn.classList.remove('loading');
    }
}

// Render station list
function renderStationList() {
    const stationList = document.getElementById('station-list');
    if (!stationList) return;

    if (radioState.stations.length === 0) {
        stationList.innerHTML = '<div class="no-stations">No stations found. Try different filters.</div>';
        return;
    }

    stationList.innerHTML = radioState.stations.map((station, index) => `
        <div class="station-item ${radioState.currentStationIndex === index ? 'active' : ''}" data-index="${index}">
            <span class="station-item-name">${escapeHtml(station.name)}</span>
            <span class="station-item-freq">${station.tags ? station.tags.split(',')[0] : ''}</span>
        </div>
    `).join('');

    // Add click handlers
    stationList.querySelectorAll('.station-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            playStation(index);
        });
    });
}

// HTML escape helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Play a stream URL
async function playStreamUrl(url) {
    // Disconnect previous source if exists
    if (radioState.sourceNode) {
        try {
            radioState.sourceNode.disconnect();
        } catch (e) {}
        radioState.sourceNode = null;
    }

    // Stop previous audio
    if (radioState.audioElement) {
        radioState.audioElement.pause();
        radioState.audioElement.src = '';
        radioState.audioElement = null;
    }

    try {
        // Create audio element
        radioState.audioElement = new Audio();
        radioState.audioElement.crossOrigin = 'anonymous';

        const volumeSlider = document.getElementById('radio-volume');
        radioState.audioElement.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.7;

        // Set up audio context and analyser
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context if suspended
        if (window.audioContext.state === 'suspended') {
            await window.audioContext.resume();
        }

        radioState.audioElement.src = url;

        // Connect to analyser immediately
        radioState.sourceNode = window.audioContext.createMediaElementSource(radioState.audioElement);

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

        // Update UI immediately
        updatePlayButton(true);
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');

        if (statusText) statusText.textContent = 'Loading: ' + (radioState.currentStation?.name || 'Custom Stream');
        if (statusIndicator) statusIndicator.classList.add('active');

        // Start playing
        radioState.audioElement.play().then(() => {
            radioState.isPlaying = true;
            if (statusText) statusText.textContent = 'Playing: ' + (radioState.currentStation?.name || 'Custom Stream');
        }).catch(error => {
            console.error('Playback failed:', error);
            if (statusText) statusText.textContent = 'Playback failed - try another station';
        });

        // Start visualization if available
        if (window.visualize && !window.animationId) {
            window.visualize();
        }

    } catch (error) {
        console.error('Failed to play stream:', error);
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Failed to play stream';
    }
}

// Stop radio playback
function stopRadio() {
    if (radioState.sourceNode) {
        try {
            radioState.sourceNode.disconnect();
        } catch (e) {}
        radioState.sourceNode = null;
    }

    if (radioState.audioElement) {
        radioState.audioElement.pause();
        radioState.audioElement.src = '';
        radioState.audioElement = null;
    }

    radioState.isPlaying = false;
    updatePlayButton(false);

    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (statusIndicator) statusIndicator.classList.remove('active');
    if (statusText) statusText.textContent = 'Stopped';
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

// Detect user location
async function detectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        radioState.location.country = data.country_code || 'US';
        radioState.location.state = '';

        const countrySelect = document.getElementById('country-select');
        if (countrySelect) {
            countrySelect.value = radioState.location.country;
        }

        await updateStateDropdown(radioState.location.country);
        await fetchStations();
    } catch (error) {
        console.error('Location detection failed:', error);
        radioState.location.country = 'US';
        await updateStateDropdown('US');
        await fetchStations();
    }
}

// Initialize radio event listeners
function initRadioEventListeners() {
    // Country select
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
        countrySelect.addEventListener('change', async (e) => {
            radioState.location.country = e.target.value;
            await updateStateDropdown(e.target.value);
            await fetchStations();
        });
    }

    // State select
    const stateSelect = document.getElementById('state-select');
    if (stateSelect) {
        stateSelect.addEventListener('change', async (e) => {
            radioState.location.state = e.target.value;
            await fetchStations();
        });
    }

    // Genre select
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        genreSelect.addEventListener('change', async (e) => {
            radioState.genre = e.target.value;
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
            if (url) {
                radioState.currentStation = { name: 'Custom Stream', url_resolved: url };
                radioState.currentStationIndex = -1;
                const stationName = document.getElementById('station-name');
                const stationGenre = document.getElementById('station-genre');
                if (stationName) stationName.textContent = 'Custom Stream';
                if (stationGenre) stationGenre.textContent = '';
                playStreamUrl(url);
            }
        });

        customUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                playCustomBtn.click();
            }
        });
    }
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
    stopRadio,
    prevStation,
    nextStation,
    fetchStations,
    radioState
};
