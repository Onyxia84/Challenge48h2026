// Variable globale pour stocker les données actuellement chargées
let allCitiesData = [];


// ========== MAP ==========
const map = L.map('map').setView([46.5, 2.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let markers = [];
let cityChart, regionChart, demandChart;

function getColor(score) {
    return score > 80 ? '#28a745' : score > 50 ? '#ffc107' : '#dc3545';
}

// 1. ÉCOUTER LES MOUVEMENTS DE LA CARTE
// À chaque déplacement ou zoom, on met à jour les graphiques
map.on('moveend', () => {
    updateChartsWithVisibleCities();
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

    const url = `/api/cities?minScore=${minScore}` + (region ? `&region=${encodeURIComponent(region)}` : '');
    
    // On sauvegarde les données globalement pour les réutiliser au zoom
    allCitiesData = await (await fetch(url)).json();

    // --- Carte ---
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    allCitiesData.forEach(city => {
        const m = L.circleMarker([city.lat, city.lng], {
            radius: Math.max(6, city.opportunity_score / 7),
            fillColor: getColor(city.opportunity_score),
            color: '#fff',
            weight: 2,
            fillOpacity: 0.85
        }).addTo(map);

            m.bindPopup(`
            <strong>${city.city_name}</strong> (#${city.rank})<br>
            📍 ${city.region}<br>
            🎯 Score : <strong>${city.opportunity_score}/100</strong><br>
            🅿️ Places étudiées : ${city.total_spots.toLocaleString()}<br>
            📈 Demande : ${city.demand_category}
        `);

        markers.push(m);
    });

    // Dès qu'on a mis à jour la carte, on met à jour les graphiques
    updateChartsWithVisibleCities();
}

// ========== MISE À JOUR DES GRAPHIQUES SELON LE ZOOM ==========
function updateChartsWithVisibleCities() {
    // Si aucune donnée n'est chargée, on s'arrête
    if (!allCitiesData || allCitiesData.length === 0) return;

    // Récupérer les limites visibles de la carte
    const bounds = map.getBounds();

    // Filtrer les villes qui sont strictement dans l'écran
    const visibleCities = allCitiesData.filter(city => bounds.contains([city.lat, city.lng]));

    // S'il n'y a aucune ville visible, on évite de planter les graphiques
    if (visibleCities.length === 0) return;

    // --- Graphique villes (seulement les visibles) ---
    const ctx1 = document.getElementById('cityChart').getContext('2d');
    if (cityChart) cityChart.destroy();
    
    // Astuce : on trie les villes par score pour que le graphique soit lisible
    const sortedCities = [...visibleCities].sort((a, b) => b.opportunity_score - a.opportunity_score);

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

    // --- Graphique demande (donut) (seulement les visibles) ---
    const demandCounts = {};
    visibleCities.forEach(d => { demandCounts[d.demand_category] = (demandCounts[d.demand_category] || 0) + 1; });

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
updateDashboard();
loadRegionChart();
