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

function getCafeColor(cafeType) {
  switch(cafeType) {
    case 'All Cafes': return '#fb6a4a';
    case 'Small Cafes': return '#de2d26';
    case 'Enclosed Cafes': return '#a50f15';
    default: return '#fee5d9';
  }
}

function highlightCafeType(cafeType) {
  const category = ['All Cafes', 'Small Cafes', 'Enclosed Cafes'].indexOf(cafeType);
  const color = getCafeColor(cafeType);
  
  // Highlight legend bar
  document.querySelectorAll('.legend-bar').forEach((bar, i) => {
    if (i === category) {
      bar.classList.add('highlighted');
    } else {
      bar.classList.remove('highlighted');
    }
  });
  
  // Update histogram highlighting
  if (histogramChart) {
    if (!histogramChart.originalColors) {
      histogramChart.originalColors = [...histogramChart.data.datasets[0].backgroundColor];
    }
    
    histogramChart.data.datasets[0].borderColor = histogramChart.originalColors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    histogramChart.data.datasets[0].borderWidth = histogramChart.originalColors.map((_, i) => 
      i === category ? 2 : 0
    );
    
    histogramChart.update();
  }

  // Update scatter plot selected point
  if (window.scatterChart && window.scatterChart.data.datasets[1].data.length > 0) {
    window.scatterChart.data.datasets[1].backgroundColor = color;
    window.scatterChart.data.datasets[1].borderColor = '#000000';
    window.scatterChart.update();
  }
}

function resetHighlights() {
  document.querySelectorAll('.legend-bar').forEach(bar => {
    bar.classList.remove('highlighted');
  });
  
  if (histogramChart) {
    histogramChart.data.datasets[0].borderColor = Array(3).fill('transparent');
    histogramChart.data.datasets[0].borderWidth = Array(3).fill(0);
    histogramChart.update();
  }
}

async function loadCafeData() {
  try {
    const response = await fetch('nysidewalkcafe_20250408.geojson');
    const geojson = await response.json();

    map.addSource('sidewalk-cafes', {
      type: 'geojson',
      data: geojson
    });

    // Add hover layer
    map.addLayer({
      id: 'cafe-hover',
      type: 'line',
      source: 'sidewalk-cafes',
      layout: {},
      paint: {
        'line-color': [
          'match',
          ['get', 'CafeType'],
          'All Cafes', '#fb6a4a',
          'Small Cafes', '#de2d26',
          'Enclosed Cafes', '#a50f15',
          '#fee5d9'
        ],
        'line-width': 6
      },
      filter: ['==', ['get', 'id'], null]
    });

    map.addLayer({
      id: 'cafe-locations',
      type: 'line',
      source: 'sidewalk-cafes',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'CafeType'],
          'All Cafes', '#fb6a4a',
          'Small Cafes', '#de2d26',
          'Enclosed Cafes', '#a50f15',
          '#fee5d9'
        ],
        'line-width': 4
      }
    });

    // Mouse enter event
    map.on('mousemove', 'cafe-locations', (e) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const cafeType = f.properties.CafeType;
        const length = parseFloat(f.properties.Shape_Leng);
        const color = getCafeColor(cafeType);
        
        if (hoveredStateId !== f.id) {
          hoveredStateId = f.id;
          map.setFilter('cafe-hover', ['==', ['get', 'id'], hoveredStateId || null]);
          
          if (window.scatterChart) {
            window.scatterChart.data.datasets[1].data = [{ x: cafeType, y: length }];
            window.scatterChart.data.datasets[1].backgroundColor = color;
            window.scatterChart.data.datasets[1].borderColor = '#000000';
            window.scatterChart.data.datasets[1].borderWidth = 2;
            window.scatterChart.update('none');
          }
          
          highlightCafeType(cafeType);
        }
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    // Mouse leave event
    map.on('mouseleave', 'cafe-locations', () => {
      if (hoveredStateId !== null) {
        hoveredStateId = null;
        map.setFilter('cafe-hover', ['==', ['get', 'id'], null]);
        
        if (window.scatterChart) {
          window.scatterChart.data.datasets[1].data = [];
          window.scatterChart.update('none');
        }
        
        resetHighlights();
      }
      
      map.getCanvas().style.cursor = '';
    });

    // Click event
    map.on('click', 'cafe-locations', e => {
      const f = e.features[0];
      const cafeType = f.properties.CafeType;
      const length = parseFloat(f.properties.Shape_Leng);
      const coords = (f.geometry.type === 'MultiLineString')
        ? f.geometry.coordinates[0][0]
        : f.geometry.coordinates[0];
      const color = getCafeColor(cafeType);

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(`
          <div>
            <h3>${cafeType}</h3>
            <p><strong>Length:</strong> ${length.toFixed(2)} ft</p>
          </div>
        `)
        .addTo(map);

      if (window.scatterChart) {
        window.scatterChart.data.datasets[1].data = [{ x: cafeType, y: length }];
        window.scatterChart.data.datasets[1].backgroundColor = color;
        window.scatterChart.data.datasets[1].borderColor = '#000000';
        window.scatterChart.data.datasets[1].borderWidth = 2;
        window.scatterChart.update('none');
      }
      
      highlightCafeType(cafeType);
    });

    processCafeData(geojson);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

map.on('load', loadCafeData);

function processCafeData(geojson) {
  const cafeTypes = new Map();
  const scatterData = [];

  geojson.features.forEach(feature => {
    const type = feature.properties.CafeType;
    const length = parseFloat(feature.properties.Shape_Leng);
    
    if (type) {
      cafeTypes.set(type, (cafeTypes.get(type) || 0) + 1);
      if (!isNaN(length)) {
        scatterData.push({ x: type, y: length });
      }
    }
  });

  createHistogram(Array.from(cafeTypes.entries()));
  createScatter(scatterData);
}

function createHistogram(cafeTypeCounts) {
  const ctx = document.getElementById('chart-histogram');
  histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cafeTypeCounts.map(([type]) => type),
      datasets: [{
        label: 'Number of Cafes',
        data: cafeTypeCounts.map(([, count]) => count),
        backgroundColor: cafeTypeCounts.map(([type]) => getCafeColor(type)),
        borderColor: Array(cafeTypeCounts.length).fill('transparent'),
        borderWidth: Array(cafeTypeCounts.length).fill(0)
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
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        x: {
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { display: false }
        }
      }
    }
  });
}

function createScatter(data) {
  const ctx = document.getElementById('chart-scatter');
  window.scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Cafes',
          data: data,
          backgroundColor: data.map(d => getCafeColor(d.x)),
          pointRadius: 3,
          order: 2
        },
        {
          label: 'Selected',
          data: [],
          backgroundColor: '#000000',
          pointRadius: 6,
          borderColor: '#000000',
          borderWidth: 2,
          order: 1
        }
      ]
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
        x: {
          type: 'category',
          title: { 
            display: true, 
            text: 'Cafe Type', 
            color: '#666',
            font: { size: 12 }
          },
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        y: {
          title: { 
            display: true, 
            text: 'Length (ft)', 
            color: '#666',
            font: { size: 12 }
          },
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        }
      }
    }
  });
}
