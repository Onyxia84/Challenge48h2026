let allCitiesData = [];

// ========== MAP ==========
const map = L.map('map', { preferCanvas: true }).setView([46.5, 2.5], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let cityChart, regionChart, demandChart;

function getColor(score) {
    if (score >= 80) return '#dc3545'; // Rouge
    if (score >= 65) return '#ffc107'; // Orange
    return '#28a745'; // Vert
}

map.on('moveend', () => { updateDashboard(); });

// ========== STATS ==========
async function loadStats() {
    const stats = await (await fetch('/api/stats')).json();
    document.getElementById('statsBar').innerHTML = `
        <div class="stat-card"><h3>${stats.total_cities}</h3><p>Villes analysées</p></div>
        <div class="stat-card"><h3>${stats.avg_score}</h3><p>Score moyen</p></div>
        <div class="stat-card"><h3>${stats.max_score}</h3><p>Score max</p></div>
        <div class="stat-card"><h3>${stats.min_score}</h3><p>Score min</p></div>
    `;
}

// ========== RÉGIONS FILTRE ==========
async function loadRegions() {
    const regions = await (await fetch('/api/regions/list')).json();
    const select = document.getElementById('regionFilter');
    select.innerHTML = '<option value="">Toutes</option>'; 
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;          
        opt.textContent = r.name;  
        select.appendChild(opt);
    });
}

// ========== DASHBOARD PRINCIPAL ==========
async function updateDashboard() {
    const maxScore = document.getElementById('scoreFilter').value;
    const region = document.getElementById('regionFilter').value;

    const bounds = map.getBounds();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    let url = `/api/cities?maxScore=${maxScore}&minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
    if (region && region !== '') {
        url += `&region=${encodeURIComponent(region)}`;
    }

    allCitiesData = await (await fetch(url)).json();

    markersLayer.clearLayers();

    allCitiesData.forEach(city => {
        const m = L.circleMarker([city.lat, city.lng], {
            radius: 6,
            fillColor: getColor(city.opportunity_score),
            color: '#fff',
            weight: 1,
            fillOpacity: 0.85
        });

        m.bindPopup(`
            <strong>${city.city_name}</strong><br>
            📍 Dép: ${city.region}<br>
            🎯 Score : <strong>${city.opportunity_score}/100</strong><br>
            🅿️ Places : ${city.total_spots ? city.total_spots.toLocaleString() : 'N/A'}<br>
            📈 Intérêt : ${city.demand_category}
        `);

        markersLayer.addLayer(m);
    });

    updateChartsWithVisibleCities();
}

// ========== MISE À JOUR DES GRAPHIQUES ==========
async function updateChartsWithVisibleCities() {
    if (!allCitiesData || allCitiesData.length === 0) {
        if (cityChart) cityChart.destroy();
        if (demandChart) demandChart.destroy();
        return;
    }

    // --- Graphique villes : On groupe et on nettoie les arrondissements ---
    const cityMap = new Map();
    allCitiesData.forEach(d => {
        // Enlève les chiffres et mentions d'arrondissements (ex: PARIS 15, LYON 3EME, MARSEILLE 8E ARRONDISSEMENT)
        let cleanName = d.city_name.toUpperCase()
            .replace(/\s\d+(ER|EME|IEME|ÈME|E)?(\sARRONDISSEMENT)?$/i, '')
            .trim();

        if (!cityMap.has(cleanName)) {
            cityMap.set(cleanName, { name: cleanName, totalScore: 0, count: 0 });
        }
        cityMap.get(cleanName).totalScore += d.opportunity_score;
        cityMap.get(cleanName).count += 1;
    });

    const groupedCities = Array.from(cityMap.values()).map(c => ({
        city_name: c.name,
        opportunity_score: Math.round(c.totalScore / c.count)
    }));

    // Trie pour avoir les scores les plus faibles (les plus intéressants) en premier
    const sortedCities = groupedCities.sort((a, b) => a.opportunity_score - b.opportunity_score).slice(0, 20);

    const ctx1 = document.getElementById('cityChart').getContext('2d');
    if (cityChart) cityChart.destroy();
    cityChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: sortedCities.map(d => d.city_name),
            datasets: [{
                label: 'Score Moyen',
                data: sortedCities.map(d => d.opportunity_score),
                backgroundColor: sortedCities.map(d => getColor(d.opportunity_score))
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { max: 100 } }
        }
    });

    // --- Graphique demande ---
    const demandCategories = ['Très intéressant', 'Potentiel moyen', 'Moins intéressant'];
    const bgColors = ['#28a745', '#ffc107', '#dc3545']; // Vert, Jaune, Rouge

    const demandCounts = { 'Très intéressant': 0, 'Potentiel moyen': 0, 'Moins intéressant': 0 };
    allCitiesData.forEach(d => { 
        if (demandCounts[d.demand_category] !== undefined) {
            demandCounts[d.demand_category]++;
        }
    });

    const ctx3 = document.getElementById('demandChart').getContext('2d');
    if (demandChart) demandChart.destroy();
    demandChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: demandCategories,
            datasets: [{
                data: demandCategories.map(cat => demandCounts[cat]),
                backgroundColor: bgColors
            }]
        },
        options: { responsive: true }
    });
}

// ========== GRAPHIQUE RÉGIONAL ==========
async function loadRegionChart() {
    const regions = await (await fetch('/api/regions')).json();
    const ctx2 = document.getElementById('regionChart').getContext('2d');
    if (regionChart) regionChart.destroy();
    regionChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: regions.map(r => r.region),
            datasets: [{
                label: 'Score moyen',
                data: regions.map(r => r.avg_score),
                backgroundColor: regions.map(r => getColor(r.avg_score))
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { max: 100 } }
        }
    });
}

// ========== EVENTS ==========

const scoreFilter = document.getElementById('scoreFilter');
const scoreVal = document.getElementById('scoreVal');

// 1. Met à jour le chiffre en temps réel quand on glisse la barre (sans planter le serveur)
scoreFilter.addEventListener('input', (e) => {
    scoreVal.innerText = e.target.value;
});

// 2. Recharge la carte UNIQUEMENT quand on lâche le clic
scoreFilter.addEventListener('change', () => {
    updateDashboard();
});

document.getElementById('regionFilter').addEventListener('change', () => {
    updateDashboard();
});

// ========== INIT ==========
loadStats();
loadRegions();
setTimeout(() => { updateDashboard(); }, 200);
loadRegionChart();

