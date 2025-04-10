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

function getWidthCategory(width) {
  if (width <= 30) return 0;
  if (width <= 50) return 1;
  if (width <= 70) return 2;
  if (width <= 90) return 3;
  return 4;
}

function getColorForWidth(width) {
  if (width <= 30) return '#fee5d9';
  if (width <= 50) return '#fcae91';
  if (width <= 70) return '#fb6a4a';
  if (width <= 90) return '#de2d26';
  return '#a50f15';
}

function highlightWidthRange(width) {
  const category = getWidthCategory(width);
  const color = getColorForWidth(width);
  
  // Highlight legend bar
  document.querySelectorAll('.legend-bar').forEach((bar, i) => {
    if (i === category) {
      bar.classList.add('highlighted');
    } else {
      bar.classList.remove('highlighted');
    }
  });
  
  // Highlight histogram bar
  if (histogramChart) {
    // Store original colors if not stored yet
    if (!histogramChart.originalColors) {
      histogramChart.originalColors = [...histogramChart.data.datasets[0].backgroundColor];
    }
    
    // Add black border to the highlighted bar
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
  // Reset legend bars
  document.querySelectorAll('.legend-bar').forEach(bar => {
    bar.classList.remove('highlighted');
  });
  
  // Reset histogram bars
  if (histogramChart) {
    histogramChart.data.datasets[0].borderColor = Array(5).fill('transparent');
    histogramChart.data.datasets[0].borderWidth = Array(5).fill(0);
    histogramChart.update();
  }
}

async function loadSidewalkLinesGeoJSON() {
  try {
    const response = await fetch('sidewalk_lines.geojson');
    const geojson = await response.json();

    map.addSource('sidewalk-lines', {
      type: 'geojson',
      data: geojson
    });

    // Add hover layer
    map.addLayer({
      id: 'sidewalk-lines-hover',
      type: 'line',
      source: 'sidewalk-lines',
      layout: {},
      paint: {
        'line-color': [
          'step',
          ['get', 'ST_WIDTH'],
          '#fee5d9', 30,
          '#fcae91', 50,
          '#fb6a4a', 70,
          '#de2d26', 90,
          '#a50f15'
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0.5,
          20, [
            'interpolate',
            ['linear'],
            ['get', 'ST_WIDTH'],
            0, 3,
            30, 5,
            50, 7,
            70, 9,
            90, 11,
            120, 13
          ]
        ]
      },
      filter: ['==', 'id', '']
    });

    map.addLayer({
      id: 'sidewalk-lines-layer',
      type: 'line',
      source: 'sidewalk-lines',
      filter: ['==', ['get', 'BOROCODE'], 1],
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': [
          'step',
          ['get', 'ST_WIDTH'],
          '#fee5d9', 30,
          '#fcae91', 50,
          '#fb6a4a', 70,
          '#de2d26', 90,
          '#a50f15'
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0.5,
          20, [
            'interpolate',
            ['linear'],
            ['get', 'ST_WIDTH'],
            0, 2,
            30, 4,
            50, 6,
            70, 8,
            90, 10,
            120, 12
          ]
        ]
      }
    });

    // Mouse enter event
    map.on('mousemove', 'sidewalk-lines-layer', (e) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const width = parseFloat(f.properties.ST_WIDTH);
        const length = parseFloat(f.properties.SHAPE_Leng);
        const color = getColorForWidth(width);
        
        if (hoveredStateId !== f.id) {
          hoveredStateId = f.id;
          map.setFilter('sidewalk-lines-hover', ['==', 'id', hoveredStateId]);
          
          if (window.scatterChart) {
            // Update the selected point dataset
            window.scatterChart.data.datasets[1].data = [{ x: width, y: length }];
            window.scatterChart.data.datasets[1].backgroundColor = color;
            window.scatterChart.data.datasets[1].borderColor = '#000000';
            window.scatterChart.data.datasets[1].borderWidth = 2;
            window.scatterChart.update('none');
          }
          
          // Highlight corresponding elements
          highlightWidthRange(width);
        }
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    // Mouse leave event
    map.on('mouseleave', 'sidewalk-lines-layer', () => {
      if (hoveredStateId !== null) {
        hoveredStateId = null;
        map.setFilter('sidewalk-lines-hover', ['==', 'id', '']);
        
        if (window.scatterChart) {
          // Clear the selected point dataset
          window.scatterChart.data.datasets[1].data = [];
          window.scatterChart.update('none');
        }
        
        resetHighlights();
      }
      
      map.getCanvas().style.cursor = '';
    });

    // Click event
    map.on('click', 'sidewalk-lines-layer', e => {
      const f = e.features[0];
      const width = parseFloat(f.properties.ST_WIDTH);
      const length = parseFloat(f.properties.SHAPE_Leng);
      const coords = (f.geometry.type === 'MultiLineString')
        ? f.geometry.coordinates[0][0]
        : f.geometry.coordinates[0];
      const color = getColorForWidth(width);

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(`
          <div>
            <h3>${f.properties.FULL_STREE || f.properties.ST_NAME}</h3>
            <p><strong>Street Width:</strong> ${width} ft</p>
            <p><strong>Length:</strong> ${length.toFixed(2)} ft</p>
          </div>
        `)
        .addTo(map);

      if (window.scatterChart) {
        // Update the selected point dataset
        window.scatterChart.data.datasets[1].data = [{ x: width, y: length }];
        window.scatterChart.data.datasets[1].backgroundColor = color;
        window.scatterChart.data.datasets[1].borderColor = '#000000';
        window.scatterChart.data.datasets[1].borderWidth = 2;
        window.scatterChart.update('none');
      }
      
      // Highlight corresponding elements
      highlightWidthRange(width);
    });

    processStreetDataForCharts(geojson);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

map.on('load', loadSidewalkLinesGeoJSON);

function processStreetDataForCharts(geojson) {
  const widths = [];
  const scatterData = [];

  geojson.features.forEach(feature => {
    const w = parseFloat(feature.properties.ST_WIDTH);
    const l = parseFloat(feature.properties.SHAPE_Leng);
    if (!isNaN(w) && !isNaN(l)) {
      widths.push(w);
      scatterData.push({ x: w, y: l });
    }
  });

  createHistogram(widths);
  createScatter(scatterData);
}

function createHistogram(widths) {
  const bins = ['0–30', '31–50', '51–70', '71–90', '91+'];
  const counts = [0, 0, 0, 0, 0];

  widths.forEach(w => {
    if (w <= 30) counts[0]++;
    else if (w <= 50) counts[1]++;
    else if (w <= 70) counts[2]++;
    else if (w <= 90) counts[3]++;
    else counts[4]++;
  });

  histogramChart = new Chart(document.getElementById('chart-histogram'), {
    type: 'bar',
    data: {
      labels: bins,
      datasets: [{
        label: 'Street Count',
        data: counts,
        backgroundColor: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
        borderColor: Array(5).fill('transparent'),
        borderWidth: Array(5).fill(0)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: false 
        },
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
            font: {
              size: 11
            }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        x: {
          ticks: { 
            color: '#666',
            font: {
              size: 11
            }
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
          label: 'Width vs Length',
          data: data,
          backgroundColor: 'rgba(202, 202, 202, 0.3)',
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
        legend: {
          display: false
        },
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
          title: { 
            display: true, 
            text: 'Street Width (ft)', 
            color: '#666',
            font: {
              size: 12
            }
          },
          ticks: { 
            color: '#666',
            font: {
              size: 11
            }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        y: {
          title: { 
            display: true, 
            text: 'Street Length (ft)', 
            color: '#666',
            font: {
              size: 12
            }
          },
          ticks: { 
            color: '#666',
            font: {
              size: 11
            }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        }
      }
    }
  });
}
