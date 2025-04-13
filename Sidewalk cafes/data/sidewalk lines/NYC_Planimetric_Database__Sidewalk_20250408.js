// sidewalk_cafes_map.js

mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Force the map container to take full height
document.getElementById('map').style.height = '100%';

let histogramChart;
let widthHistogramChart;  // Add reference to width histogram
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

function getAreaCategory(area) {
  if (area <= 5000) return 0;
  if (area <= 10000) return 1;
  if (area <= 15000) return 2;
  if (area <= 20000) return 3;
  if (area <= 25000) return 4;
  return 5;
}

function getColorForArea(area) {
  if (area <= 5000) return '#deebf7';
  if (area <= 10000) return '#c6dbef';
  if (area <= 15000) return '#9ecae1';
  if (area <= 20000) return '#6baed6';
  if (area <= 25000) return '#4292c6';
  return '#2171b5';
}

function getWidthCategory(width) {
  if (width <= 3) return 0;
  if (width <= 6) return 1;
  if (width <= 9) return 2;
  if (width <= 12) return 3;
  if (width <= 15) return 4;
  return 5;
}

function highlightAreaRange(area) {
  const category = getAreaCategory(area);
  const color = getColorForArea(area);
  
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

function highlightWidthRange(width) {
  const category = getWidthCategory(width);
  
  // Highlight width histogram bar
  if (widthHistogramChart) {
    // Store original colors if not stored yet
    if (!widthHistogramChart.originalColors) {
      widthHistogramChart.originalColors = [...widthHistogramChart.data.datasets[0].backgroundColor];
    }
    
    // Add black border to the highlighted bar
    widthHistogramChart.data.datasets[0].borderColor = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    widthHistogramChart.data.datasets[0].borderWidth = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? 2 : 0
    );
    
    widthHistogramChart.update();
  }
}

function resetHighlights() {
  // Reset legend bars
  document.querySelectorAll('.legend-bar').forEach(bar => {
    bar.classList.remove('highlighted');
  });
  
  // Reset histogram bars
  if (histogramChart) {
    histogramChart.data.datasets[0].borderColor = Array(6).fill('transparent');
    histogramChart.data.datasets[0].borderWidth = Array(6).fill(0);
    histogramChart.update();
  }

  // Reset width histogram bars
  if (widthHistogramChart) {
    widthHistogramChart.data.datasets[0].borderColor = Array(6).fill('transparent');
    widthHistogramChart.data.datasets[0].borderWidth = Array(6).fill(0);
    widthHistogramChart.update();
  }
}

async function loadSidewalkPolygonsGeoJSON() {
  try {
    const response = await fetch('Manhattan_Sidewalks.geojson');
    const geojson = await response.json();

    map.addSource('sidewalk-polygons', {
      type: 'geojson',
      data: geojson
    });

    // Add hover layer
    map.addLayer({
      id: 'sidewalk-polygons-hover',
      type: 'fill',
      source: 'sidewalk-polygons',
      layout: {},
      paint: {
        'fill-color': [
          'step',
          ['get', 'SHAPE_Area'],
          '#deebf7', 5000,
          '#c6dbef', 10000,
          '#9ecae1', 15000,
          '#6baed6', 20000,
          '#4292c6', 25000,
          '#2171b5'
        ],
        'fill-opacity': 0.8,
        'fill-outline-color': 'transparent'
      },
      filter: ['==', 'id', '']
    });

    map.addLayer({
      id: 'sidewalk-polygons-layer',
      type: 'fill',
      source: 'sidewalk-polygons',
      layout: {},
      paint: {
        'fill-color': [
          'step',
          ['get', 'SHAPE_Area'],
          '#deebf7', 5000,
          '#c6dbef', 10000,
          '#9ecae1', 15000,
          '#6baed6', 20000,
          '#4292c6', 25000,
          '#2171b5'
        ],
        'fill-opacity': 0.6,
        'fill-outline-color': 'transparent'
      }
    });

    // Mouse enter event
    map.on('mousemove', 'sidewalk-polygons-layer', (e) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const area = parseFloat(f.properties.SHAPE_Area);
        const length = parseFloat(f.properties.SHAPE_Leng);
        const width = area/length;
        const color = getColorForArea(area);
        
        if (hoveredStateId !== f.id) {
          hoveredStateId = f.id;
          map.setFilter('sidewalk-polygons-hover', ['==', 'id', hoveredStateId]);
          
          if (window.scatterChart) {
            window.scatterChart.data.datasets[1].data = [{ x: area, y: width }];
            window.scatterChart.data.datasets[1].backgroundColor = color;
            window.scatterChart.data.datasets[1].borderColor = '#000000';
            window.scatterChart.data.datasets[1].borderWidth = 2;
            window.scatterChart.update('none');
          }
          
          highlightAreaRange(area);
          highlightWidthRange(width);
        }
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    // Mouse leave event
    map.on('mouseleave', 'sidewalk-polygons-layer', () => {
      if (hoveredStateId !== null) {
        hoveredStateId = null;
        map.setFilter('sidewalk-polygons-hover', ['==', 'id', '']);
        
        if (window.scatterChart) {
          window.scatterChart.data.datasets[1].data = [];
          window.scatterChart.update('none');
        }
        
        resetHighlights();
      }
      
      map.getCanvas().style.cursor = '';
    });

    // Click event
    map.on('click', 'sidewalk-polygons-layer', e => {
      const f = e.features[0];
      const area = parseFloat(f.properties.SHAPE_Area);
      const length = parseFloat(f.properties.SHAPE_Leng);
      const width = area/length;
      const coords = e.lngLat;
      const color = getColorForArea(area);

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(`
          <div>
            <h3>Sidewalk Information</h3>
            <p><strong>Area:</strong> ${area.toFixed(2)} sq ft</p>
            <p><strong>Length:</strong> ${length.toFixed(2)} ft</p>
            <p><strong>Average Width:</strong> ${width.toFixed(2)} ft</p>
            <p><strong>Status:</strong> ${f.properties.STATUS}</p>
          </div>
        `)
        .addTo(map);

      if (window.scatterChart) {
        window.scatterChart.data.datasets[1].data = [{ x: area, y: width }];
        window.scatterChart.data.datasets[1].backgroundColor = color;
        window.scatterChart.data.datasets[1].borderColor = '#000000';
        window.scatterChart.data.datasets[1].borderWidth = 2;
        window.scatterChart.update('none');
      }
      
      highlightAreaRange(area);
      highlightWidthRange(width);
    });

    processSidewalkDataForCharts(geojson);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

map.on('load', loadSidewalkPolygonsGeoJSON);

function processSidewalkDataForCharts(geojson) {
  const areas = [];
  const scatterData = [];
  const widths = [];

  geojson.features.forEach(feature => {
    const a = parseFloat(feature.properties.SHAPE_Area);
    const l = parseFloat(feature.properties.SHAPE_Leng);
    if (!isNaN(a) && !isNaN(l)) {
      areas.push(a);
      const width = a/l;
      widths.push(width);
      scatterData.push({ x: a, y: width });
    }
  });

  createHistogram(areas);
  createWidthHistogram(widths);
  createScatter(scatterData);
}

function createHistogram(areas) {
  const bins = ['<5k', '5k-10k', '10k-15k', '15k-20k', '20k-25k', '>25k'];
  const counts = [0, 0, 0, 0, 0, 0];

  areas.forEach(a => {
    if (a <= 5000) counts[0]++;
    else if (a <= 10000) counts[1]++;
    else if (a <= 15000) counts[2]++;
    else if (a <= 20000) counts[3]++;
    else if (a <= 25000) counts[4]++;
    else counts[5]++;
  });

  histogramChart = new Chart(document.getElementById('chart-histogram'), {
    type: 'bar',
    data: {
      labels: bins,
      datasets: [{
        label: 'Number of Sidewalks',
        data: counts,
        backgroundColor: ['#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5'],
        borderColor: Array(6).fill('transparent'),
        borderWidth: Array(6).fill(0)
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
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Number of sidewalks: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Number of Sidewalks',
            color: '#666',
            font: {
              size: 12
            }
          },
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
          title: {
            display: true,
            text: 'Sidewalk Area (sq ft)',
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
          grid: { display: false }
        }
      }
    }
  });
}

function createWidthHistogram(widths) {
  const maxWidth = Math.max(...widths);
  const minWidth = Math.min(...widths);
  
  const bins = ['<3', '3-6', '6-9', '9-12', '12-15', '>15'];
  const counts = [0, 0, 0, 0, 0, 0];

  widths.forEach(w => {
    if (w <= 3) counts[0]++;
    else if (w <= 6) counts[1]++;
    else if (w <= 9) counts[2]++;
    else if (w <= 12) counts[3]++;
    else if (w <= 15) counts[4]++;
    else counts[5]++;
  });

  const ctx = document.getElementById('width-histogram');
  widthHistogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins,
      datasets: [{
        label: 'Number of Sidewalks',
        data: counts,
        backgroundColor: ['#909090', '#808080', '#707070', '#606060', '#505050', '#404040'],
        borderColor: Array(6).fill('transparent'),
        borderWidth: Array(6).fill(0)
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
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Number of sidewalks: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Number of Sidewalks',
            color: '#666',
            font: {
              size: 12
            }
          },
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
          title: {
            display: true,
            text: 'Average Width (ft)',
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
          label: 'Width vs Area',
          data: data,
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
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
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Width: ${context.raw.y.toFixed(2)} ft, Area: ${context.raw.x.toFixed(2)} sq ft`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Area (sq ft)', 
            color: '#666',
            font: {
              size: 12
            },
            padding: { top: 10 }
          },
          ticks: { 
            color: '#666',
            font: {
              size: 11
            },
            callback: function(value) {
              if (value >= 1000) {
                return (value/1000).toFixed(1) + 'k';
              }
              return value;
            }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        y: {
          title: { 
            display: true, 
            text: 'Width (ft)', 
            color: '#666',
            font: {
              size: 12
            },
            padding: { top: 10 }
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
