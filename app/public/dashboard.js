// Variable globale pour stocker les données actuellement chargées
let allCitiesData = [];

// ========== MAP ==========
// 🚨 OPTIMISATION 1 : preferCanvas force l'utilisation de la carte graphique
const map = L.map('map', {
    preferCanvas: true
}).setView([46.5, 2.5], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Utilisation d'un LayerGroup pour gérer et effacer les points ultra rapidement
let markersLayer = L.layerGroup().addTo(map);

let cityChart, regionChart, demandChart;

function getColor(score) {
    return score > 80 ? '#28a745' : score > 50 ? '#ffc107' : '#dc3545';
}

// 1. ÉCOUTER LES MOUVEMENTS DE LA CARTE
// 🚨 OPTIMISATION 2 : À chaque déplacement ou zoom, on relance la requête API avec la nouvelle zone visible
map.on('moveend', () => {
    updateDashboard();
});

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
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.region;
        opt.textContent = r.region;
        select.appendChild(opt);
    });
}

// ========== DASHBOARD PRINCIPAL (Chargement des données & Carte) ==========
async function updateDashboard() {
    const minScore = document.getElementById('scoreFilter').value;
    const region = document.getElementById('regionFilter').value;

    // 🚨 OPTIMISATION 3 : On récupère les limites visibles de la carte
    const bounds = map.getBounds();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    // On ajoute les limites à l'URL pour que le serveur filtre (max 1500 points)
    let url = `/api/cities?minScore=${minScore}&minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
    if (region && region !== 'Toutes') {
        url += `&region=${encodeURIComponent(region)}`;
    }

    // On récupère uniquement les données de la zone visible
    allCitiesData = await (await fetch(url)).json();

    // --- Carte ---
    // On efface les anciens points d'un seul coup
    markersLayer.clearLayers();

    allCitiesData.forEach(city => {
        // Le circleMarker est dessiné sur le Canvas, c'est ultra léger
        const m = L.circleMarker([city.lat, city.lng], {
            radius: Math.max(4, city.opportunity_score / 10), // Taille légèrement réduite pour la lisibilité
            fillColor: getColor(city.opportunity_score),
            color: '#fff',
            weight: 1, // Bordure plus fine pour la performance
            fillOpacity: 0.85
        });

        m.bindPopup(`
            <strong>${city.city_name}</strong> (#${city.rank})<br>
            📍 ${city.region}<br>
            🎯 Score : <strong>${city.opportunity_score}/100</strong><br>
            🅿️ Places étudiées : ${city.total_spots.toLocaleString()}<br>
            📈 Demande : ${city.demand_category}
        `);

        markersLayer.addLayer(m);
    });

    // Dès qu'on a mis à jour la carte, on met à jour les graphiques
    updateChartsWithVisibleCities();
}

// ========== MISE À JOUR DES GRAPHIQUES ==========
function updateChartsWithVisibleCities() {
    // Plus besoin de filtrer géographiquement ici, l'API s'en est déjà chargée !
    if (!allCitiesData || allCitiesData.length === 0) {
        if (cityChart) cityChart.destroy();
        if (demandChart) demandChart.destroy();
        return;
    }

    // --- Graphique villes (les 30 meilleures visibles pour ne pas surcharger le graph) ---
    const ctx1 = document.getElementById('cityChart').getContext('2d');
    if (cityChart) cityChart.destroy();

    // On trie les villes par score et on ne garde que le top 30 pour le graphique
    const sortedCities = [...allCitiesData].sort((a, b) => b.opportunity_score - a.opportunity_score).slice(0, 30);

    cityChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: sortedCities.map(d => d.city_name),
            datasets: [{
                label: 'Score',
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

    // --- Graphique demande (donut) ---
    const demandCounts = {};
    allCitiesData.forEach(d => { demandCounts[d.demand_category] = (demandCounts[d.demand_category] || 0) + 1; });

    const ctx3 = document.getElementById('demandChart').getContext('2d');
    if (demandChart) demandChart.destroy();
    demandChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: Object.keys(demandCounts),
            datasets: [{
                data: Object.values(demandCounts),
                backgroundColor: ['#dc3545', '#ffc107', '#17a2b8', '#28a745']
            }]
        },
        options: { responsive: true }
    });
}

// ========== GRAPHIQUE RÉGIONAL (indépendant des filtres) ==========
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
document.getElementById('scoreFilter').addEventListener('input', (e) => {
    document.getElementById('scoreVal').innerText = e.target.value;
    updateDashboard();
});

document.getElementById('regionFilter').addEventListener('change', () => updateDashboard());

// ========== INIT ==========
loadStats();
loadRegions();
// On attend un court instant au chargement pour que la carte ait bien sa taille finale
setTimeout(() => {
    updateDashboard();
}, 200);
loadRegionChart();

