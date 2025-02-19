document.addEventListener('DOMContentLoaded', function () {
    // Sélection des éléments DOM
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const menuContent = document.getElementById('menu-content');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const searchInput = document.getElementById('hamburger-city-search');
    const searchButton = document.getElementById('hamburger-search-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const resetMapButton = document.getElementById('reset-map');
    const toggleColorIconsButton = document.getElementById('toggle-color-icons');
    const showErrorHistoryButton = document.getElementById('show-error-history');
    const closeErrorPopupButton = document.getElementById('close-error-popup');
    const errorPopup = document.getElementById('error-popup');
    const statsPopup = document.getElementById('stats-popup');
    const closeStatsPopupButton = document.getElementById('close-stats-popup');

    // Variables globales pour les statistiques
    let stats = {
        totalViews: 0,
        apiCalls: {},
        apiResponseTimes: [],
        apiSuccessCount: 0,
        apiFailureCount: 0,
        apiResponseSizes: [],
        cacheHits: 0,
        cacheMisses: 0,
    };

    // Gestionnaire d'événements pour le menu hamburger
    hamburgerIcon.addEventListener('click', function () {
        menuContent.classList.toggle('open');
        hamburgerIcon.setAttribute('aria-expanded', menuContent.classList.contains('open'));
    });

    // Fonction pour suivre les points de vue (zooms, déplacements, clics)
    function trackView() {
        stats.totalViews++;
        console.log(`Total views: ${stats.totalViews}`);
    }

    // Fonction pour suivre les appels API par fonction
    function trackApiCall(functionName) {
        if (!stats.apiCalls[functionName]) {
            stats.apiCalls[functionName] = 0;
        }
        stats.apiCalls[functionName]++;
        console.log(`Appels API pour ${functionName}: ${stats.apiCalls[functionName]}`);
    }

    // Fonction pour afficher les statistiques
    function displayStats() {
            console.log('Contenu de stats.apiCalls:', stats.apiCalls); // Ajoutez ce log
        const averageResponseTime = stats.apiResponseTimes.reduce((a, b) => a + b, 0) / stats.apiResponseTimes.length || 0;
        const averageResponseSize = stats.apiResponseSizes.reduce((a, b) => a + b, 0) / stats.apiResponseSizes.length || 0;

        const statsContent = `
            <h2>Statistiques</h2>
            <p>Total des points de vue : ${stats.totalViews}</p>
            <p>Appels API réussis : ${stats.apiSuccessCount}</p>
            <p>Appels API échoués : ${stats.apiFailureCount}</p>
            <p>Temps de réponse moyen des API : ${averageResponseTime.toFixed(2)} ms</p>
            <p>Taille moyenne des réponses API : ${averageResponseSize.toFixed(2)} octets</p>
            <p>Utilisation du cache : ${stats.cacheHits} hits / ${stats.cacheMisses} misses</p>
            <h3>Appels API par fonction :</h3>
            <ul>
                ${Object.entries(stats.apiCalls).map(([func, count]) => `<li>${func}: ${count}</li>`).join('')}
            </ul>
        `;

        statsPopup.innerHTML = statsContent;
        statsPopup.style.display = 'block';
    }

    // Ajouter un bouton pour afficher les statistiques
    const statsButton = document.createElement('button');
    statsButton.textContent = 'Afficher les statistiques';
    statsButton.addEventListener('click', displayStats);
    document.getElementById('menu-content').appendChild(statsButton);

    // Fermer la fenêtre des statistiques en cliquant à l'extérieur
    document.addEventListener('click', function (e) {
        if (!statsPopup.contains(e.target) && e.target !== statsButton) {
            statsPopup.style.display = 'none';
        }
    });

    // Fermer la fenêtre des statistiques
    closeStatsPopupButton.addEventListener('click', function () {
        statsPopup.style.display = 'none';
    });

    // Gestionnaire d'événements pour la touche "Entrée" dans le champ de recherche du menu hamburger
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const cityName = searchInput.value;
            if (cityName) {
                searchAndDisplayCity(cityName);
            } else {
                addErrorToList('Veuillez entrer un nom de ville.');
            }
        }
    });

    // Gestionnaire d'événements pour le bouton de recherche dans le menu hamburger
    searchButton.addEventListener('click', function () {
        const cityName = searchInput.value;
        if (cityName) {
            searchAndDisplayCity(cityName);
        } else {
            addErrorToList('Veuillez entrer un nom de ville.');
        }
    });

    // Fonction pour rechercher une ville et la localiser sur la carte
    function searchAndDisplayCity(cityName) {
        trackApiCall('searchAndDisplayCity');
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`)
            .then(response => {
                if (!response.ok) throw new Error('La réponse du réseau n\'est pas valide');
                return response.json();
            })
            .then(data => {
                if (data.length === 0) {
                    throw new Error('Ville non trouvée');
                }

                const firstResult = data[0];
                const lat = parseFloat(firstResult.lat);
                const lng = parseFloat(firstResult.lon);

                map.setView([lat, lng], 10);
                getWeather(lat, lng, firstResult.display_name);
            })
            .catch(error => {
                console.error('Erreur lors de la recherche de la ville :', error);
                addErrorToList(`Erreur lors de la recherche de la ville : ${error.message}`);
            });
    }

    // Configuration de la carte
    const mapCenter = [46.2276, 2.2137];
    const mapZoomLevel = 6;
    console.log(`Initialisation de la carte avec le centre à ${mapCenter} et le niveau de zoom à ${mapZoomLevel}.`);
    const map = L.map('mapid').setView(mapCenter, mapZoomLevel);

    // Tuiles pour le mode clair (par défaut)
    const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    // Tuiles pour le mode sombre (exemple avec CartoDB Dark Matter)
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    });

    // Ajouter les tuiles par défaut (mode clair)
    lightTiles.addTo(map);

    // Fonction pour basculer entre les tuiles en fonction du thème
    function updateMapTheme() {
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        if (isDarkMode) {
            map.removeLayer(lightTiles);
            darkTiles.addTo(map);
        } else {
            map.removeLayer(darkTiles);
            lightTiles.addTo(map);
        }
    }

    // Appliquer le thème correct au chargement de la page
    updateMapTheme();

    // Variables globales
    let apiCallCount = 0;
    let colorIconsEnabled = true;
    const MAX_CACHE_SIZE = 5000;
    const markers = L.layerGroup().addTo(map);
    const loadedMarkers = new Set();
    let currentWeatherData = null;

    // Fonction pour ajouter des messages d'erreur à la liste
    function addErrorToList(message) {
        const errorListPopup = document.getElementById('error-messages-popup');
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${hours}:${minutes}:${seconds}`;
        const errorItem = document.createElement('li');
        errorItem.textContent = `[${timestamp}] ${message}`;
        errorItem.style.marginBottom = '5px';

        errorListPopup.appendChild(errorItem);

        // Afficher la popup si elle est cachée
        errorPopup.classList.add('open');
        sortErrorList();
    }

    // Fonction pour trier la liste des erreurs
    function sortErrorList() {
        const errorListPopup = document.getElementById('error-messages-popup');
        const errorItems = Array.from(errorListPopup.children);

        // Trier les éléments en fonction de leur contenu (timestamp)
        errorItems.sort((a, b) => {
            const timestampA = a.textContent.match(/\[(\d{2}:\d{2}:\d{2})\]/)[1];
            const timestampB = b.textContent.match(/\[(\d{2}:\d{2}:\d{2})\]/)[1];
            return timestampA.localeCompare(timestampB);
        });

        // Réorganiser les éléments dans la liste
        errorItems.forEach(item => errorListPopup.appendChild(item));
    }

    // Fonction pour vérifier si le cache est valide
    function isCacheValid(cachedData) {
        const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes en millisecondes
        return cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION_TIME;
    }

    // Gestionnaire pour fermer la popup
    closeErrorPopupButton.addEventListener('click', function () {
        errorPopup.classList.remove('open');
    });

    // Fonction pour nettoyer le cache des entrées expirées
    function cleanCache() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const cachedData = JSON.parse(localStorage.getItem(key));

            if (!isCacheValid(cachedData)) {
                console.log(`Suppression de l'entrée de cache expirée avec la clé : ${key}`);
                localStorage.removeItem(key);
            }
        }
        updateCacheSizeDisplay();
    }

    // Fonction pour limiter la taille du cache
    function limitCacheSize() {
        const MAX_CACHE_SIZE_KB = 500; // Taille maximale du cache en Ko
        let cacheSizeKB = calculateCacheSize();

        while (cacheSizeKB > MAX_CACHE_SIZE_KB) {
            let oldestKey = null;
            let oldestTimestamp = Date.now();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const cachedData = JSON.parse(localStorage.getItem(key));

                if (cachedData.timestamp < oldestTimestamp) {
                    oldestKey = key;
                    oldestTimestamp = cachedData.timestamp;
                }
            }

            if (oldestKey) {
                console.log(`Suppression de l'entrée de cache la plus ancienne avec la clé : ${oldestKey}`);
                localStorage.removeItem(oldestKey);
                cacheSizeKB = calculateCacheSize();
            } else {
                break;
            }
        }
        updateCacheSizeDisplay();
    }

    // Fonction pour calculer la taille du cache en Ko
    function calculateCacheSize() {
        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (value) {
                totalSize += key.length * 2 + value.length * 2;
            }
        }

        const sizeInKB = (totalSize / 1024).toFixed(2);
        return sizeInKB;
    }

    // Fonction pour mettre à jour l'affichage de la taille du cache
    function updateCacheSizeDisplay() {
        const cacheSizeKB = calculateCacheSize();
        document.getElementById('cache-size-value').textContent = `${cacheSizeKB} KB`;
    }

    // Fonction pour récupérer les données météo depuis l'API Open-Meteo
async function fetchWeatherData(lat, lng, locationName) {
    trackApiCall('fetchWeatherData');
    const startTime = Date.now();
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,precipitation,relativehumidity_2m,pressure_msl,uv_index,weathercode,windspeed_10m,winddirection_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto`;
    console.log(`Appel API à Open-Meteo : ${apiUrl}`);
    apiCallCount++;
    document.getElementById('api-count').textContent = apiCallCount;

    try {
        const response = await fetch(apiUrl);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        stats.apiResponseTimes.push(responseTime);
        console.log(`Temps de réponse de l'API : ${responseTime} ms`);

        if (!response.ok) throw new Error('La réponse du réseau n\'est pas valide');
        const data = await response.json();

        stats.apiSuccessCount++;
        stats.apiResponseSizes.push(JSON.stringify(data).length);

        // Ajouter le fuseau horaire de la ville dans les données
        data.timezone = data.timezone || 'UTC'; // Par défaut, utiliser UTC si le fuseau horaire n'est pas disponible
        return data;
    } catch (error) {
        stats.apiFailureCount++;
        console.error(`Erreur lors de la récupération des données météorologiques pour ${locationName} :`, error);
        addErrorToList(`Erreur lors de la récupération des données météorologiques pour ${locationName} : ${error.message}`);
        return null;
    }
}
    // Fonction pour obtenir l'heure locale de la ville
function getLocalTime(timezone) {
    const now = new Date();
    const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false };
    return now.toLocaleTimeString('fr-FR', options);
}

    // Fonction pour mettre à jour l'heure locale dans le menu
function updateMenuWithLocalTime(timezone) {
    const localTime = getLocalTime(timezone);
    const localDate = new Date().toLocaleDateString('fr-FR', { timeZone: timezone });
    const localTimeElement = document.getElementById('local-time');
    if (localTimeElement) {
        localTimeElement.textContent = `Date : ${localDate} - Heure locale : ${localTime}`;
    }
}

    // Fonction pour récupérer les données météo avec cache
    async function getWeather(lat, lng, locationName) {
        trackApiCall('getWeather');
        const cacheKey = `${lat},${lng}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));

        if (isCacheValid(cachedData)) {
            stats.cacheHits++;
            console.log(`Cache hit pour ${locationName}. Utilisation des données en cache.`);
            currentWeatherData = cachedData.data;
            displayWeatherData(cachedData.data, locationName);
            updateMenuWithLocalTime(cachedData.data.timezone); // Mettre à jour l'heure locale dans le menu
            return;
        } else {
            stats.cacheMisses++;
            console.log(`Cache miss pour ${locationName}. Appel API nécessaire.`);
        }

        console.log(`Récupération des données météorologiques pour ${locationName} aux coordonnées (${lat}, ${lng}).`);
        document.getElementById('loading-spinner').style.display = 'block';
        document.getElementById('sidebar-content').innerHTML = '';

        const data = await fetchWeatherData(lat, lng, locationName);

        if (data) {
            console.log(`Données météorologiques récupérées avec succès pour ${locationName}. Mise en cache des données.`);

            const localTime = getLocalTime(data.timezone);

            const cacheEntry = { data, timestamp: Date.now(), localTime };
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            updateCacheSizeDisplay();
            limitCacheSize();

            document.getElementById('loading-spinner').style.display = 'none';
            currentWeatherData = data;
            displayWeatherData(data, locationName);
            updateMenuWithLocalTime(data.timezone); // Mettre à jour l'heure locale dans le menu
        } else {
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('sidebar-content').innerHTML = 'Données météorologiques non disponibles.';
            document.getElementById('sidebar').classList.add('open');
        }
    }

    // Mapping des codes météo aux icônes
    const weatherIconMapping = {
        0: 'fas fa-sun',
        1: 'fas fa-cloud-sun',
        2: 'fas fa-cloud',
        3: 'fas fa-cloud',
        45: 'fas fa-smog',
        48: 'fas fa-smog',
        51: 'fas fa-cloud-rain',
        53: 'fas fa-cloud-rain',
        55: 'fas fa-cloud-rain',
        56: 'fas fa-cloud-rain',
        57: 'fas fa-cloud-rain',
        61: 'fas fa-cloud-rain',
        63: 'fas fa-cloud-rain',
        65: 'fas fa-cloud-showers-heavy',
        66: 'fas fa-cloud-rain',
        67: 'fas fa-cloud-rain',
        71: 'fas fa-snowflake',
        73: 'fas fa-snowflake',
        75: 'fas fa-snowflake',
        77: 'fas fa-snowflake',
        80: 'fas fa-cloud-showers-heavy',
        81: 'fas fa-cloud-showers-heavy',
        82: 'fas fa-cloud-showers-heavy',
        85: 'fas fa-snowflake',
        86: 'fas fa-snowflake',
        95: 'fas fa-bolt',
        96: 'fas fa-bolt',
        99: 'fas fa-bolt',
    };

    // Fonction pour obtenir la couleur en fonction de la température
    function getColorForTemperature(temp) {
        if (temp === undefined || isNaN(temp)) return '#000000';

        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

        if (isDarkMode) {
            if (temp >= 40) return '#FF6B6B';
            else if (temp >= 35) return '#FF8E6B';
            else if (temp >= 30) return '#FFB56B';
            else if (temp >= 25) return '#FFD56B';
            else if (temp >= 20) return '#FFEE6B';
            else if (temp >= 15) return '#A8E6CF';
            else if (temp >= 10) return '#6BFF6B';
            else if (temp >= 5) return '#6BD4FF';
            else if (temp >= 0) return '#6B8EFF';
            else if (temp >= -5) return '#6B6BFF';
            else if (temp >= -10) return '#8E6BFF';
            else if (temp >= -15) return '#B56BFF';
            else if (temp >= -20) return '#D56BFF';
            else return '#6B6B6B';
        } else {
            if (temp >= 40) return '#FF0000';
            else if (temp >= 35) return '#FF4500';
            else if (temp >= 30) return '#FF8C00';
            else if (temp >= 25) return '#FFA500';
            else if (temp >= 20) return '#FFD700';
            else if (temp >= 15) return '#ADFF2F';
            else if (temp >= 10) return '#32CD32';
            else if (temp >= 5) return '#00BFFF';
            else if (temp >= 0) return '#1E90FF';
            else if (temp >= -5) return '#0000FF';
            else if (temp >= -10) return '#8A2BE2';
            else if (temp >= -15) return '#4B0082';
            else if (temp >= -20) return '#800080';
            else if (temp >= -25) return '#8B0000';
            else return '#000000';
        }
    }

    // Fonction pour obtenir la couleur du texte en fonction de la couleur de fond
    function getTextColorForBackground(bgColor) {
        const r = parseInt(bgColor.slice(1, 3), 16);
        const g = parseInt(bgColor.slice(3, 5), 16);
        const b = parseInt(bgColor.slice(5, 7), 16);
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Fonction pour créer une icône de marqueur
    function createMarkerIcon(weatherCode, temp, precipitation = 0) {
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        const defaultColor = isDarkMode ? '#333' : '#ccc';
        const textColor = isDarkMode ? '#fff' : '#000';

        if (!colorIconsEnabled) {
            return L.icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                shadowSize: [41, 41]
            });
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const defaultIconClass = 'fas fa-question';
        const iconClass = weatherIconMapping[weatherCode] || defaultIconClass;

        const color = getColorForTemperature(temp);

        let animationClass = '';
        let animationSpeed = '1s';

        if (!isMobile) {
            switch (true) {
                case weatherCode === 0:
                    animationClass = 'sun-marker';
                    animationSpeed = '10s';
                    break;
                case weatherCode >= 1 && weatherCode <= 3:
                    animationClass = 'cloud-marker';
                    animationSpeed = '5s';
                    break;
                case weatherCode === 45 || weatherCode === 48:
                    animationClass = 'fog-marker';
                    animationSpeed = '3s';
                    break;
                case weatherCode >= 51 && weatherCode <= 67:
                    animationClass = precipitation > 5 ? 'rain-marker-heavy' : 'rain-marker-light';
                    animationSpeed = precipitation > 5 ? '0.5s' : '1.5s';
                    break;
                case weatherCode >= 71 && weatherCode <= 86:
                    animationClass = precipitation > 2 ? 'snow-marker-heavy' : 'snow-marker-light';
                    animationSpeed = precipitation > 2 ? '2s' : '3s';
                    break;
                case weatherCode >= 95 && weatherCode <= 99:
                    animationClass = 'thunderstorm-marker';
                    animationSpeed = '0.8s';
                    break;
                default:
                    animationClass = 'default-marker';
                    animationSpeed = '1s';
                    break;
            }
        }

        return L.divIcon({
            className: `custom-marker`,
            html: `
                <div style="
                    background-color: ${color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="${iconClass} ${animationClass}" style="
                        color: white;
                        font-size: 16px;
                        animation-duration: ${animationSpeed};
                    "></i>
                </div>
            `
        });
    }

    // Fonction pour obtenir la description météo en fonction du code météo
    function getWeatherDescription(weatherCode) {
        const descriptions = {
            0: '☀️ Ciel dégagé',
            1: '🌤️ Légèrement nuageux',
            2: '⛅ Partiellement nuageux',
            3: '☁️ Couvert',
            45: '🌫️ Brouillard',
            48: '🌫️ Brouillard givrant',
            51: '🌧️ Légère bruine',
            53: '🌧️ Bruine modérée',
            55: '🌧️ Forte bruine',
            56: '🌧️ Légère bruine verglaçante',
            57: '🌧️ Forte bruine verglaçante',
            61: '🌧️ Légère pluie',
            63: '🌧️ Pluie modérée',
            65: '🌧️ Forte pluie',
            66: '🌧️ Légère pluie verglaçante',
            67: '🌧️ Forte pluie verglaçante',
            71: '❄️ Légère neige',
            73: '❄️ Neige modérée',
            75: '❄️ Forte neige',
            77: '❄️ Grésil',
            80: '🌧️ Légères averses',
            81: '🌧️ Averses modérées',
            82: '🌧️ Fortes averses',
            85: '❄️ Légères averses de neige',
            86: '❄️ Fortes averses de neige',
            95: '⛈️ Orage',
            96: '⛈️ Orage avec grêle légère',
            99: '⛈️ Orage avec grêle forte',
        };
        return descriptions[weatherCode] || '❓ Condition météorologique inconnue';
    }

    // Fonction pour afficher les données météo dans la barre latérale
function displayWeatherData(data, locationName) {
    console.log('Affichage des données météorologiques pour :', locationName);

    if (!data || !data.current_weather || !data.hourly || !data.daily) {
        console.error('Données invalides ou incomplètes reçues de l\'API :', data);
        addErrorToList('Données météorologiques invalides ou incomplètes reçues.');
        document.getElementById('sidebar-content').innerHTML = 'Données météorologiques non disponibles.';
        document.getElementById('sidebar').classList.add('open');
        return;
    }

    // Récupérer l'heure locale actuelle du lieu
    const localTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: data.timezone });
    const localHour = new Date().toLocaleString('fr-FR', { hour: '2-digit', timeZone: data.timezone, hour12: false });
    const localDate = new Date().toLocaleDateString('fr-FR', { timeZone: data.timezone });

    // Trouver l'index de départ dans les données horaires
    const startIndex = data.hourly.time.findIndex(time => {
        const hour = new Date(time).toLocaleString('fr-FR', { hour: '2-digit', timeZone: data.timezone, hour12: false });
        return hour === localHour;
    });

    // Si l'index de départ n'est pas trouvé, commencer à partir de l'index 0
    const adjustedStartIndex = startIndex === -1 ? 0 : startIndex;

    // Ajuster les prévisions horaires pour commencer à l'heure locale
    const hourlyForecast = data.hourly.time
        ? data.hourly.time.slice(adjustedStartIndex, adjustedStartIndex + 24).map((time, index) => {
            const date = new Date(time);
            return {
                time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: data.timezone }),
                temperature: data.hourly.temperature_2m[adjustedStartIndex + index],
                precipitation: data.hourly.precipitation[adjustedStartIndex + index],
                humidity: data.hourly.relativehumidity_2m[adjustedStartIndex + index],
                pressure: data.hourly.pressure_msl[adjustedStartIndex + index],
                uv: data.hourly.uv_index[adjustedStartIndex + index],
                weathercode: data.hourly.weathercode[adjustedStartIndex + index],
                windspeed: data.hourly.windspeed_10m[adjustedStartIndex + index], // Vitesse du vent
                winddirection: data.hourly.winddirection_10m[adjustedStartIndex + index], // Direction du vent
            };
        })
        : [];

    // Prévisions quotidiennes
    const dailyForecast = data.daily.time
        ? data.daily.time.slice(0, 7).map((time, index) => {
            const date = new Date(time);
            return {
                date: date.toLocaleDateString('fr-FR', { timeZone: data.timezone }),
                maxTemp: data.daily.temperature_2m_max[index],
                minTemp: data.daily.temperature_2m_min[index],
                weatherCode: data.daily.weathercode[index],
                windSpeed: data.daily.windspeed_10m_max[index], // Vitesse du vent
            };
        })
        : [];

    // Vérifier l'état des cases à cocher
    const showHumidity = document.getElementById('toggle-humidity')?.checked ?? true;
    const showPressure = document.getElementById('toggle-pressure')?.checked ?? true;
    const showUV = document.getElementById('toggle-uv')?.checked ?? true;
    const showWind = document.getElementById('toggle-wind')?.checked ?? true; // Nouvelle case à cocher pour le vent

    // Générer le contenu HTML pour les prévisions horaires
    const hourlyForecastHTML = `
        <h3>Prévisions sur 24 heures</h3>
        <table>
            <thead>
                <tr>
                    <th>Heure</th>
                    <th>Température (°C)</th>
                    <th>Précipitations (mm)</th>
                    ${showHumidity ? '<th>Humidité (%)</th>' : ''}
                    ${showPressure ? '<th>Pression (hPa)</th>' : ''}
                    ${showUV ? '<th>Indice UV</th>' : ''}
                    ${showWind ? '<th>Vent</th>' : ''}
                    <th>Conditions</th>
                </tr>
            </thead>
            <tbody>
                ${hourlyForecast.map(forecast => {
                    const tempColor = getColorForTemperature(forecast.temperature);
                    let rainClass = '';
                    if (forecast.precipitation > 0 && forecast.precipitation <= 2) {
                        rainClass = 'rain-light';
                    } else if (forecast.precipitation > 2 && forecast.precipitation <= 5) {
                        rainClass = 'rain-moderate';
                    } else if (forecast.precipitation > 5) {
                        rainClass = 'rain-heavy';
                    }
                    const weatherDescription = getWeatherDescription(forecast.weathercode);
                    return `
                        <tr>
                            <td>${forecast.time}</td>
                            <td style="background-color: ${tempColor}; color: ${getTextColorForBackground(tempColor)};">${forecast.temperature}</td>
                            <td class="precipitation-cell ${rainClass}">
                                <div class="rain-drops-container"></div>
                                ${forecast.precipitation}
                            </td>
                            ${showHumidity ? `<td>${forecast.humidity}</td>` : ''}
                            ${showPressure ? `<td>${forecast.pressure}</td>` : ''}
                            ${showUV ? `<td>${forecast.uv}</td>` : ''}
                            ${showWind ? `
                                <td>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <i class="fas fa-arrow-up" style="transform: rotate(${forecast.winddirection}deg);"></i>
                                        ${(forecast.windspeed * 3.6).toFixed(2)} km/h
                                    </div>
                                </td>
                            ` : ''}
                            <td>${weatherDescription}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Générer le contenu HTML pour les prévisions quotidiennes
    const dailyForecastHTML = `
        <h3>Prévisions sur 7 jours</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Température max (°C)</th>
                    <th>Température min (°C)</th>
                    <th>Vitesse du vent (km/h)</th>
                    <th>Conditions</th>
                </tr>
            </thead>
            <tbody>
                ${dailyForecast.map(forecast => {
                    const maxTempColor = getColorForTemperature(forecast.maxTemp);
                    const minTempColor = getColorForTemperature(forecast.minTemp);
                    const weatherIconClass = weatherIconMapping[forecast.weatherCode] || 'fas fa-question';
                    const weatherDescription = getWeatherDescription(forecast.weatherCode);
                    return `
                        <tr>
                            <td>${forecast.date}</td>
                            <td style="background-color: ${maxTempColor}; color: ${getTextColorForBackground(maxTempColor)};">${forecast.maxTemp}</td>
                            <td style="background-color: ${minTempColor}; color: ${getTextColorForBackground(minTempColor)};">${forecast.minTemp}</td>
                            <td>${(forecast.windSpeed * 3.6).toFixed(2)}</td>
                            <td>${weatherDescription}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Générer le contenu complet de la barre latérale
    const content = `
        <strong>Lieu : ${locationName}</strong><br>
        <strong>Date : ${localDate}</strong><br>
        <strong>Heure locale : ${localTime}</strong><br>
        <strong>Météo actuelle</strong><br>
        <i class="${weatherIconMapping[data.current_weather.weathercode] || 'fas fa-question'}" aria-label="Météo : ${data.current_weather.weathercode}"></i><br>
        Température : <span style="color: ${getColorForTemperature(data.current_weather.temperature)};">${data.current_weather.temperature}°C</span><br>
        Vitesse du vent : ${(data.current_weather.windspeed * 3.6).toFixed(2)} km/h<br>
        Direction du vent : <i class="fas fa-arrow-up" style="transform: rotate(${data.current_weather.winddirection}deg);"></i><br>
        ${hourlyForecastHTML}
        ${dailyForecastHTML}
    `;

    // Afficher le contenu dans la barre latérale
    document.getElementById('sidebar-content').innerHTML = content;
    document.getElementById('sidebar').classList.add('open');

    // Ajouter des gouttes de pluie dynamiques pour les cellules de précipitations
    hourlyForecast.forEach((forecast, index) => {
        const precipitationCell = document.querySelectorAll('.precipitation-cell')[index];
        if (precipitationCell) {
            let rainDropsContainer = precipitationCell.querySelector('.rain-drops-container');
            if (!rainDropsContainer) {
                rainDropsContainer = document.createElement('div');
                rainDropsContainer.className = 'rain-drops-container';
                precipitationCell.appendChild(rainDropsContainer);
            }
            createRainDrops(rainDropsContainer, forecast.precipitation);
        }
    });
}
document.addEventListener('change', function (e) {
    if (e.target.id === 'toggle-humidity' || e.target.id === 'toggle-pressure' || e.target.id === 'toggle-uv' || e.target.id === 'toggle-wind') {
        const sidebarContent = document.getElementById('sidebar-content');
        if (sidebarContent.innerHTML) {
            const locationName = document.querySelector('#sidebar-content strong').textContent;
            displayWeatherData(currentWeatherData, locationName);
        }
    }
});

// Fonction pour créer des gouttes de pluie dynamiques
    function createRainDrops(container, precipitationValue) {
        if (!container) {
            console.error("Conteneur des gouttes de pluie non trouvé.");
            return;
        }

        container.innerHTML = '';

        const numberOfDrops = Math.floor(precipitationValue * 2);

        for (let i = 0; i < numberOfDrops; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';

            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${Math.random() * 1 + 1}s`;
            const width = Math.random() * 3 + 2;
            const height = Math.random() * 10 + 10;
            drop.style.width = `${width}px`;
            drop.style.height = `${height}px`;

            container.appendChild(drop);
        }
    }

    // Gestionnaire d'événements pour fermer la barre latérale
    closeSidebarButton.addEventListener('click', function () {
        console.log('Fermeture de la barre latérale');
        sidebar.classList.remove('open');
    });

    // Fermer la barre latérale en cliquant à l'extérieur
    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !e.target.closest('.leaflet-marker-icon')) {
            console.log('Clic en dehors de la barre latérale, fermeture de la barre latérale');
            sidebar.classList.remove('open');
        }
    });

    // Gestionnaire d'événements pour les clics sur la carte
    map.on('click', function (e) {
            trackApiCall('mapClickReverseGeocode'); // Ajoutez cette lig
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        console.log(`Clic sur la carte aux coordonnées (${lat}, ${lng}). Récupération du nom du lieu.`);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => {
                if (!response.ok) throw new Error('La réponse du réseau n\'est pas valide');
                return response.json();
            })
            .then(data => {
                if (!data || !data.display_name) throw new Error('Données invalides reçues de l\'API Nominatim');
                console.log(`Nom du lieu trouvé : ${data.display_name}. Récupération des données météorologiques.`);
                getWeather(lat, lng, data.display_name);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération du nom du lieu :', error);
                addErrorToList(`Erreur lors de la récupération du nom du lieu : ${error.message}`);
                getWeather(lat, lng, 'Lieu inconnu');
            });
    });

    // Empêcher les clics sur la barre latérale de se propager à la carte
    sidebar.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Fonction pour obtenir les villes visibles sur la carte
    function getVisibleCities(map, cities) {
        const bounds = map.getBounds();
        return cities.filter(city => bounds.contains([city.lat, city.lng]));
    }

    // Fonction pour ajouter des marqueurs pour les villes visibles
    function addMarkersForCities(map, cities) {
        const visibleCities = getVisibleCities(map, cities);

        visibleCities.forEach(city => {
            if (!loadedMarkers.has(city.name)) {
                const marker = createMarker(city);
                markers.addLayer(marker);
                loadedMarkers.add(city.name);
            }
        });
    }

    // Fonction pour créer un marqueur pour une ville
function createMarker(city) {
    const marker = L.marker([city.lat, city.lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: #ccc; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
                      <i class="fas fa-question" style="color: white; font-size: 16px;"></i>
                   </div>`
        })
    }).addTo(markers);

    marker.bindTooltip(city.name, { permanent: false, direction: 'top' });
    marker.city = city;

    marker.on('click', function (e) {
        if (e.originalEvent) {
            e.originalEvent.stopPropagation();
        }
        console.log(`Clic sur le marqueur pour la ville : ${city.name}. Récupération des données météorologiques.`);
        const cacheKey = `${city.lat},${city.lng}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && isCacheValid(cachedData)) {
            console.log(`Utilisation des données météorologiques en cache pour ${city.name}.`);
            displayWeatherData(cachedData.data, city.name);
        } else {
            getWeather(city.lat, city.lng, city.name);
        }
    });

    marker._icon.setAttribute('tabindex', '0');
    marker._icon.setAttribute('role', 'button');
    marker._icon.setAttribute('aria-label', `Afficher la météo pour ${city.name}`);
    marker.on('keydown', function (e) {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
            if (e.originalEvent) {
                e.originalEvent.stopPropagation();
            }
            console.log(`Marqueur activé via le clavier pour la ville : ${city.name}. Récupération des données météorologiques.`);
            const cacheKey = `${city.lat},${city.lng}`;
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            if (cachedData && isCacheValid(cachedData)) {
                console.log(`Utilisation des données météorologiques en cache pour ${city.name}.`);
            } else {
                getWeather(city.lat, city.lng, city.name);
            }
        }
    });

    const cacheKey = `${city.lat},${city.lng}`;
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedData && isCacheValid(cachedData)) {
        console.log(`Utilisation des données météorologiques en cache pour la configuration initiale du marqueur pour la ville : ${city.name}.`);
        const temp = cachedData.data.current_weather.temperature;
        const weatherCode = cachedData.data.current_weather.weathercode;
        const precipitation = cachedData.data.hourly.precipitation && cachedData.data.hourly.precipitation.length > 0 ? cachedData.data.hourly.precipitation[0] : 0;
        const windSpeedKmh = (cachedData.data.current_weather.windspeed * 3.6).toFixed(2);

        // Récupérer l'heure locale et la date depuis le cache
        const localTime = cachedData.localTime || 'Heure inconnue';
        const localDate = new Date().toLocaleDateString('fr-FR', { timeZone: cachedData.data.timezone });

        console.log(`Données météorologiques récupérées pour la ville : ${city.name}. Température : ${temp}°C, Code météo : ${weatherCode}, Précipitations : ${precipitation}mm.`);
        const icon = createMarkerIcon(weatherCode, temp, precipitation);
        marker.setIcon(icon);

        let updatedTooltipContent = `${city.name}<br>Date : ${localDate}<br>Heure locale : ${localTime}<br>Température : ${temp}°C<br>Vitesse du vent : ${windSpeedKmh} km/h`;
        if (city.department) {
            updatedTooltipContent = `${city.name}<br>Département : ${city.department}<br>Date : ${localDate}<br>Heure locale : ${localTime}<br>Température : ${temp}°C<br>Vitesse du vent : ${windSpeedKmh} km/h`;
        }
        marker.bindTooltip(updatedTooltipContent, { permanent: false, direction: 'top' });

        marker.temp = temp;
        marker.weatherCode = weatherCode;
    } else {
        console.log(`Récupération des données météorologiques initiales pour la ville : ${city.name}.`);

        fetchWeatherData(city.lat, city.lng, city.name).then(data => {
            if (data) {
                const temp = data.current_weather.temperature;
                const weatherCode = data.current_weather.weathercode;
                const precipitation = data.hourly.precipitation && data.hourly.precipitation.length > 0 ? data.hourly.precipitation[0] : 0;
                const windSpeedKmh = (data.current_weather.windspeed * 3.6).toFixed(2);

                // Récupérer l'heure locale et la date à partir des données météorologiques
                const localTime = getLocalTime(data.timezone);
                const localDate = new Date().toLocaleDateString('fr-FR', { timeZone: data.timezone });

                console.log(`Données météorologiques récupérées pour la ville : ${city.name}. Température : ${temp}°C, Code météo : ${weatherCode}, Précipitations : ${precipitation}mm.`);
                const icon = createMarkerIcon(weatherCode, temp, precipitation);
                marker.setIcon(icon);

                let updatedTooltipContent = `${city.name}<br>Date : ${localDate}<br>Heure locale : ${localTime}<br>Température : ${temp}°C<br>Vitesse du vent : ${windSpeedKmh} km/h`;
                if (city.department) {
                    updatedTooltipContent = `${city.name}<br>Département : ${city.department}<br>Date : ${localDate}<br>Heure locale : ${localTime}<br>Température : ${temp}°C<br>Vitesse du vent : ${windSpeedKmh} km/h`;
                }
                marker.bindTooltip(updatedTooltipContent, { permanent: false, direction: 'top' });

                marker.temp = temp;
                marker.weatherCode = weatherCode;

                const cacheEntry = { data, timestamp: Date.now(), localTime }; // Ajout de l'heure locale dans le cache
                localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
                updateCacheSizeDisplay();
            } else {
                marker.bindTooltip(`${city.name}<br>Données météorologiques non disponibles`, { permanent: false, direction: 'top' });
            }
        });
    }

    return marker;
}
    // Fonction pour débouncer les événements de la carte
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    showErrorHistoryButton.addEventListener('click', function () {
        errorPopup.classList.toggle('open');
    });

    // Fonction débouncée pour ajouter des marqueurs pour les villes visibles
    const debouncedAddMarkers = debounce(() => {
        addMarkersForCities(map, cities);
    }, 500);

    // Écouteurs d'événements pour les mouvements et les zooms de la carte
    map.on('moveend', debouncedAddMarkers);
    map.on('zoomend', debouncedAddMarkers);

    // Chargement initial des marqueurs
    addMarkersForCities(map, cities);

    // Mise à jour de l'affichage de la taille du cache au chargement de la page
    updateCacheSizeDisplay();

    themeToggleButton.addEventListener('click', function () {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');

        if (currentTheme === 'dark') {
            body.removeAttribute('data-theme');
        } else {
            body.setAttribute('data-theme', 'dark');
        }

        // Mettre à jour les tuiles de la carte
        updateMapTheme();

        // Mettre à jour les marqueurs
        markers.eachLayer(marker => {
            if (marker.temp !== undefined && marker.weatherCode !== undefined) {
                const icon = createMarkerIcon(marker.weatherCode, marker.temp);
                marker.setIcon(icon);
            }
        });
    });

    resetMapButton.addEventListener('click', function () {
        const mapCenter = [46.2276, 2.2137];
        const mapZoomLevel = 6;

        map.setView(mapCenter, mapZoomLevel);

        markers.clearLayers();
        loadedMarkers.clear();
        addMarkersForCities(map, cities);

        sidebar.classList.remove('open');

        console.log('Carte réinitialisée à la vue par défaut.');
    });

    // Gestionnaire d'événements pour le bouton "Désactiver les icônes colorées"
    toggleColorIconsButton.addEventListener('click', function () {
        colorIconsEnabled = !colorIconsEnabled;

        this.textContent = colorIconsEnabled ? "Désactiver les icônes colorées" : "Activer les icônes colorées";

        markers.eachLayer(marker => {
            if (marker.temp !== undefined && marker.weatherCode !== undefined) {
                if (!colorIconsEnabled) {
                    const icon = L.icon({
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        shadowSize: [41, 41]
                    });
                    marker.setIcon(icon);
                } else {
                    const icon = createMarkerIcon(marker.weatherCode, marker.temp);
                    marker.setIcon(icon);
                }
            }
        });

        console.log(`Icônes colorées ${colorIconsEnabled ? 'activées' : 'désactivées'}.`);
    });

    // Ajouter des écouteurs d'événements pour les cases à cocher
    document.addEventListener('change', function (e) {
        if (e.target.id === 'toggle-humidity' || e.target.id === 'toggle-pressure' || e.target.id === 'toggle-uv') {
            const sidebarContent = document.getElementById('sidebar-content');
            if (sidebarContent.innerHTML) {
                const locationName = document.querySelector('#sidebar-content strong').textContent;
                displayWeatherData(currentWeatherData, locationName);
            }
        }
    });

    // Mettre à jour l'heure locale en temps réel
    setInterval(() => {
        if (currentWeatherData && currentWeatherData.timezone) {
            updateMenuWithLocalTime(currentWeatherData.timezone);
        }
    }, 60000); // Rafraîchir toutes les minutes
});