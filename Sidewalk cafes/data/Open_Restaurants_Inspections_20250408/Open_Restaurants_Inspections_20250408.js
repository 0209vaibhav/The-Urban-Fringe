// sidewalk_cafes_map.js

// Open Restaurants Map
mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

document.getElementById('map').style.height = '100%';

let histogramChart;
let pieChart;
let hoveredStateId = null;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.9712, 40.7831], // NYC coordinates
  zoom: 12,
  maxZoom: 18,
  minZoom: 10
});

window.addEventListener('resize', () => {
  map.resize();
});

map.addControl(new mapboxgl.NavigationControl());

function getColorForSeatingType(seatingType) {
  switch(seatingType.toLowerCase()) {
    case 'sidewalk': return '#1f77b4';
    case 'roadway': return '#ff7f0e';
    case 'both': return '#2ca02c';
    default: return '#cccccc';
  }
}

async function loadRestaurantsData() {
  try {
    const response = await fetch('Open_Restaurants_Inspections_20250408.geojson');
    const geojson = await response.json();

    map.addSource('restaurants', {
      type: 'geojson',
      data: geojson
    });

    // Add restaurant points layer
    map.addLayer({
      id: 'restaurants-layer',
      type: 'circle',
      source: 'restaurants',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 3,
          16, 8
        ],
        'circle-color': [
          'match',
          ['get', 'seating_choice'],
          'sidewalk', '#1f77b4',
          'roadway', '#ff7f0e',
          'both', '#2ca02c',
          '#cccccc'
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Mouse events
    map.on('mouseenter', 'restaurants-layer', (e) => {
      if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        
        // Create popup content
        const popupContent = `
          <strong>${feature.properties.restaurant_name}</strong><br>
          ${feature.properties.address}<br>
          <em>${feature.properties.borough}</em><br>
          Seating: ${feature.properties.seating_choice}
        `;

        new mapboxgl.Popup()
          .setLngLat(coords)
          .setHTML(popupContent)
          .addTo(map);
      }
    });

    map.on('mouseleave', 'restaurants-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    processRestaurantData(geojson);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

function processRestaurantData(geojson) {
  // Process data for charts
  const boroughCounts = {};
  const seatingCounts = {};
  
  geojson.features.forEach(feature => {
    const borough = feature.properties.borough;
    const seatingType = feature.properties.seating_choice;
    
    // Count by borough
    boroughCounts[borough] = (boroughCounts[borough] || 0) + 1;
    
    // Count by seating type
    seatingCounts[seatingType] = (seatingCounts[seatingType] || 0) + 1;
  });

  createHistogram(boroughCounts);
  createPieChart(seatingCounts);
}

function createHistogram(boroughCounts) {
  const ctx = document.getElementById('chart-histogram');
  
  histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(boroughCounts),
      datasets: [{
        label: 'Number of Restaurants',
        data: Object.values(boroughCounts),
        backgroundColor: '#1f77b4',
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#1a1a1a',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#666' },
          grid: { color: 'rgba(0,0,0,0.1)' }
        },
        x: {
          ticks: { color: '#666' },
          grid: { display: false }
        }
      }
    }
  });
}

function createPieChart(seatingCounts) {
  const ctx = document.getElementById('chart-scatter');
  
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(seatingCounts),
      datasets: [{
        data: Object.values(seatingCounts),
        backgroundColor: [
          '#1f77b4',  // sidewalk
          '#ff7f0e',  // roadway
          '#2ca02c'   // both
        ],
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#666'
          }
        },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#1a1a1a',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1
        }
      }
    }
  });
}

map.on('load', loadRestaurantsData);
