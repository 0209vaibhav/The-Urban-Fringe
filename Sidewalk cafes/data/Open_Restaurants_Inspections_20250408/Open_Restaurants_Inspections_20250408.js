// sidewalk_cafes_map.js

mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Force the map container to take full height
document.getElementById('map').style.height = '100%';

let histogramChart;
let hoveredStateId = null;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.9712, 40.7831],
  zoom: 11,
  maxZoom: 18,
  minZoom: 11,
  preserveDrawingBuffer: true
});

// Add resize handler
window.addEventListener('resize', () => {
  map.resize();
});

map.addControl(new mapboxgl.NavigationControl());

function getSeatingTypeColor(type) {
  switch(type) {
    case 'Sidewalk':
      return '#4caf50';
    case 'Roadway':
      return '#ff9800';
    case 'Both':
      return '#2196f3';
    default:
      return '#9e9e9e';
  }
}

function highlightSeatingType(type) {
  const color = getSeatingTypeColor(type);
  
  // Highlight legend bar
  document.querySelectorAll('.legend-item').forEach(item => {
    if (item.textContent.includes(type)) {
      item.classList.add('highlighted');
    } else {
      item.classList.remove('highlighted');
    }
  });
  
  // Highlight histogram bar
  if (histogramChart) {
    const typeIndex = ['Sidewalk', 'Roadway', 'Both', 'Other/Unknown'].indexOf(type);
    if (typeIndex !== -1) {
      histogramChart.data.datasets[0].borderColor = Array(4).fill('transparent');
      histogramChart.data.datasets[0].borderColor[typeIndex] = '#000000';
      histogramChart.data.datasets[0].borderWidth = Array(4).fill(0);
      histogramChart.data.datasets[0].borderWidth[typeIndex] = 2;
      histogramChart.update();
    }
  }
}

function resetHighlights() {
  // Reset legend items
  document.querySelectorAll('.legend-item').forEach(item => {
    item.classList.remove('highlighted');
  });
  
  // Reset histogram bars
  if (histogramChart) {
    histogramChart.data.datasets[0].borderColor = Array(4).fill('transparent');
    histogramChart.data.datasets[0].borderWidth = Array(4).fill(0);
    histogramChart.update();
  }
}

async function loadRestaurantsGeoJSON() {
  try {
    const response = await fetch('Open_Restaurants_Inspections_20250408.geojson');
    const geojson = await response.json();

    map.addSource('restaurants', {
      type: 'geojson',
      data: geojson
    });

    // Add hover layer
    map.addLayer({
      id: 'restaurants-hover',
      type: 'circle',
      source: 'restaurants',
      layout: {},
      paint: {
        'circle-radius': 8,
        'circle-color': '#000000',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      },
      filter: ['==', ['get', 'id'], null]
    });

    map.addLayer({
      id: 'restaurants-layer',
      type: 'circle',
      source: 'restaurants',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'seating_type'],
          'Sidewalk', '#4caf50',
          'Roadway', '#ff9800',
          'Both', '#2196f3',
          '#9e9e9e'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Mouse enter event
    map.on('mousemove', 'restaurants-layer', (e) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const seatingType = f.properties.seating_type || 'Other/Unknown';
        const color = getSeatingTypeColor(seatingType);
        
        if (hoveredStateId !== f.id) {
          hoveredStateId = f.id || null;
          map.setFilter('restaurants-hover', ['==', ['get', 'id'], hoveredStateId]);
          
          // Highlight corresponding elements
          highlightSeatingType(seatingType);
        }
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    // Mouse leave event
    map.on('mouseleave', 'restaurants-layer', () => {
      if (hoveredStateId !== null) {
        hoveredStateId = null;
        map.setFilter('restaurants-hover', ['==', ['get', 'id'], null]);
        resetHighlights();
      }
      
      map.getCanvas().style.cursor = '';
    });

    // Click event
    map.on('click', 'restaurants-layer', e => {
      const f = e.features[0];
      const seatingType = f.properties.SeatingChoice || 'Other/Unknown';
      const restaurantName = f.properties.RestaurantName || 'Unknown Restaurant';
      const address = f.properties.BusinessAddress || 'Address not available';
      const inspectionId = f.properties.RestaurantInspectionID || 'Not available';
      const neighborhood = f.properties.NTA || 'Neighborhood not available';

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div>
            <h3>${restaurantName}</h3>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Seating Type:</strong> ${seatingType}</p>
            <p><strong>Inspection ID:</strong> ${inspectionId}</p>
            <p><strong>Neighborhood:</strong> ${neighborhood}</p>
          </div>
        `)
        .addTo(map);
    });

    // Process data for charts
    processRestaurantDataForCharts(geojson);
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
  }
}

function processRestaurantDataForCharts(geojson) {
  const seatingTypes = {
    'Sidewalk': 0,
    'Roadway': 0,
    'Both': 0,
    'Other/Unknown': 0
  };

  const neighborhoods = {};

  geojson.features.forEach(feature => {
    const seatingType = feature.properties.seating_type || 'Other/Unknown';
    const neighborhood = feature.properties.neighborhood || 'Unknown';
    
    seatingTypes[seatingType]++;
    neighborhoods[neighborhood] = (neighborhoods[neighborhood] || 0) + 1;
  });

  createHistogram(seatingTypes);
  createNeighborhoodChart(neighborhoods);
}

function createHistogram(data) {
  const ctx = document.getElementById('chart-histogram').getContext('2d');
  
  histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [
          '#4caf50',
          '#ff9800',
          '#2196f3',
          '#9e9e9e'
        ],
        borderColor: Array(4).fill('transparent'),
        borderWidth: Array(4).fill(0)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Restaurants'
          }
        }
      }
    }
  });
}

function createNeighborhoodChart(data) {
  const ctx = document.getElementById('chart-scatter').getContext('2d');
  
  // Sort neighborhoods by count and take top 10
  const sortedNeighborhoods = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  window.scatterChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedNeighborhoods.map(item => item[0]),
      datasets: [{
        data: sortedNeighborhoods.map(item => item[1]),
        backgroundColor: '#2196f3',
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Restaurants'
          }
        }
      }
    }
  });
}

// Load the data when the map is ready
map.on('load', loadRestaurantsGeoJSON);
