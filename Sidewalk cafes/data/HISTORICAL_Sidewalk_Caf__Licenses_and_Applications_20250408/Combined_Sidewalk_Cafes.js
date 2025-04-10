// sidewalk_cafes_map.js

mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Force the map container to take full height
document.getElementById('map').style.height = '100%';

let histogramChart;
let hoveredMarkerId = null;
let clickedMarkerId = null;
let lastClickedProperties = null;

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

function getSizeCategory(sqft) {
  if (sqft <= 100) return 0;
  if (sqft <= 300) return 1;
  if (sqft <= 500) return 2;
  if (sqft <= 700) return 3;
  return 4;
}

function getColorForSize(sqft) {
  if (sqft <= 100) return '#fee5d9';
  if (sqft <= 300) return '#fcae91';
  if (sqft <= 500) return '#fb6a4a';
  if (sqft <= 700) return '#de2d26';
  return '#a50f15';
}

function highlightSizeRange(sqft) {
  const category = getSizeCategory(sqft);
  const color = getColorForSize(sqft);
  
  // Highlight legend bar
  document.querySelectorAll('.legend-bar').forEach((bar, i) => {
    if (i === category) {
      bar.classList.add('highlighted');
    } else {
      bar.classList.remove('highlighted');
    }
  });
  
  // Highlight histogram bar
  if (window.histogramChart) {
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    window.histogramChart.data.datasets[0].backgroundColor = colors;
    window.histogramChart.data.datasets[0].borderColor = colors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    window.histogramChart.data.datasets[0].borderWidth = colors.map((_, i) => 
      i === category ? 2 : 0
    );
    window.histogramChart.update();
  }

  // Update scatter plot selected point
  if (window.scatterChart && window.scatterChart.data.datasets[1].data.length > 0) {
    window.scatterChart.data.datasets[1].backgroundColor = color;
    window.scatterChart.data.datasets[1].borderColor = '#000000';
    window.scatterChart.data.datasets[1].borderWidth = 2;
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

async function loadSidewalkCafesGeoJSON() {
  try {
    const response = await fetch('Sidewalk_Cafes.geojson');
    const geojson = await response.json();

    map.addSource('sidewalk-cafes', {
      type: 'geojson',
      data: geojson
    });

    // Add circle layer for non-enclosed cafes
    map.addLayer({
      id: 'sidewalk-cafes-circles',
      type: 'circle',
      source: 'sidewalk-cafes',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 2, 1000, 8],
          20, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 4, 1000, 16]
        ],
        'circle-color': [
          'step',
          ['get', 'SWC_SQ_FT'],
          '#fee5d9', 100,
          '#fcae91', 300,
          '#fb6a4a', 500,
          '#de2d26', 700,
          '#a50f15'
        ],
        'circle-stroke-width': 0,
        'circle-stroke-color': '#000000'
      },
      filter: ['!=', ['get', 'SWC_TYPE'], 'Enclosed']
    });

    // Add square layer for enclosed cafes
    map.addLayer({
      id: 'sidewalk-cafes-squares',
      type: 'symbol',
      source: 'sidewalk-cafes',
      layout: {
        'icon-image': [
          'step',
          ['get', 'SWC_SQ_FT'],
          'square-0', 100,
          'square-1', 300,
          'square-2', 500,
          'square-3', 700,
          'square-4'
        ],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 0.3, 1000, 0.8],
          20, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 0.6, 1000, 1.6]
        ],
        'icon-allow-overlap': true
      },
      filter: ['==', ['get', 'SWC_TYPE'], 'Enclosed']
    });

    // Add hover layer for circles
    map.addLayer({
      id: 'sidewalk-cafes-hover-circles',
      type: 'circle',
      source: 'sidewalk-cafes',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 3, 1000, 10],
          20, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 6, 1000, 20]
        ],
        'circle-color': [
          'step',
          ['get', 'SWC_SQ_FT'],
          '#fee5d9', 100,
          '#fcae91', 300,
          '#fb6a4a', 500,
          '#de2d26', 700,
          '#a50f15'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000'
      },
      filter: ['all', 
        ['!=', ['get', 'SWC_TYPE'], 'Enclosed'],
        ['==', ['get', 'APP_ID'], '']
      ]
    });

    // Create colored square images for each category with borders
    const size = 20; // Define size for square markers
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    colors.forEach((color, i) => {
      // Regular square
      const coloredSquare = new Image(size, size);
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const colorCtx = colorCanvas.getContext('2d');
      
      // Draw filled square
      colorCtx.fillStyle = color;
      colorCtx.fillRect(0, 0, size, size);
      
      coloredSquare.src = colorCanvas.toDataURL();
      map.loadImage(coloredSquare.src, function(error, image) {
        if (error) throw error;
        map.addImage(`square-${i}`, image);
      });

      // Hover square with border
      const borderWidth = 4; // Increased border width to match circle stroke
      const paddedSize = size + (borderWidth * 2);
      const hoverSquare = new Image(paddedSize, paddedSize);
      const hoverCanvas = document.createElement('canvas');
      hoverCanvas.width = paddedSize;
      hoverCanvas.height = paddedSize;
      const hoverCtx = hoverCanvas.getContext('2d');
      
      // Enable anti-aliasing
      hoverCtx.imageSmoothingEnabled = true;
      hoverCtx.imageSmoothingQuality = 'high';
      
      // Clear the canvas
      hoverCtx.clearRect(0, 0, paddedSize, paddedSize);
      
      // Draw black border square first
      hoverCtx.fillStyle = '#000000';
      hoverCtx.fillRect(0, 0, paddedSize, paddedSize);
      
      // Draw smaller colored square inside
      hoverCtx.fillStyle = color;
      hoverCtx.fillRect(borderWidth, borderWidth, size, size);
      
      hoverSquare.src = hoverCanvas.toDataURL();
      map.loadImage(hoverSquare.src, function(error, image) {
        if (error) throw error;
        map.addImage(`square-hover-${i}`, image);
      });
    });

    // Add hover layer for squares
    map.addLayer({
      id: 'sidewalk-cafes-hover-squares',
      type: 'symbol',
      source: 'sidewalk-cafes',
      layout: {
        'icon-image': [
          'step',
          ['get', 'SWC_SQ_FT'],
          'square-hover-0', 100,
          'square-hover-1', 300,
          'square-hover-2', 500,
          'square-hover-3', 700,
          'square-hover-4'
        ],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 0.3, 1000, 0.9],
          20, ['interpolate', ['linear'], ['get', 'SWC_SQ_FT'], 0, 0.6, 1000, 1.8]
        ],
        'icon-allow-overlap': true
      },
      filter: ['all',
        ['==', ['get', 'SWC_TYPE'], 'Enclosed'],
        ['==', ['get', 'APP_ID'], '']
      ]
    });

    // Update mouse events to handle both shapes
    map.on('mousemove', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['sidewalk-cafes-circles', 'sidewalk-cafes-squares']
      });

      if (features.length > 0) {
        const f = features[0];
        
        if (hoveredMarkerId !== f.id) {
          hoveredMarkerId = f.id;
          
          const isEnclosed = f.properties.SWC_TYPE === 'Enclosed';
          const sqft = parseFloat(f.properties.SWC_SQ_FT);
          const tables = parseInt(f.properties.SWC_TABLES);
          const color = getColorForSize(sqft);
          const category = getSizeCategory(sqft);

          // Reset all hover states first
          map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
          map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
          
          // Set hover state for the appropriate shape
          if (isEnclosed) {
            map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], f.properties.APP_ID]);
          } else {
            map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], f.properties.APP_ID]);
          }

          // Highlight corresponding elements in legend, histogram, and the specific point in scatter plot
          window.highlightVisualizations(category, isEnclosed, { x: sqft, y: tables });
          
          // Show details on hover if no marker is currently clicked
          if (!clickedMarkerId) {
            updateRestaurantDetails(f.properties);
          }
        }
        
        map.getCanvas().style.cursor = 'pointer';
      } else {
        // Reset hover states when not hovering over any feature
        if (hoveredMarkerId !== null) {
          hoveredMarkerId = null;
          
          map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
          map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
          
          // Reset all visualization highlights
          window.resetVisualizationHighlights();

          // If a marker is clicked, keep showing its details
          if (clickedMarkerId !== null && lastClickedProperties) {
            updateRestaurantDetails(lastClickedProperties);
          } else {
            resetRestaurantDetails();
          }
        }
        
        map.getCanvas().style.cursor = '';
      }
    });

    // Update click events
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['sidewalk-cafes-circles', 'sidewalk-cafes-squares']
      });

      if (features.length > 0) {
        const f = features[0];
        const isEnclosed = f.properties.SWC_TYPE === 'Enclosed';
        const sqft = parseFloat(f.properties.SWC_SQ_FT);
        const tables = parseInt(f.properties.SWC_TABLES);
        const color = getColorForSize(sqft);

        // Update clicked marker ID and store properties
        clickedMarkerId = f.id;
        lastClickedProperties = f.properties;

        // Reset hover states
        map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
        map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);

        // Set hover state for clicked marker
        if (isEnclosed) {
          map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], f.properties.APP_ID]);
        } else {
          map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], f.properties.APP_ID]);
        }

        if (window.scatterChart) {
          window.scatterChart.data.datasets[2].data = [{ x: sqft, y: tables }];
          window.scatterChart.data.datasets[2].backgroundColor = color;
          window.scatterChart.data.datasets[2].borderColor = '#000000';
          window.scatterChart.data.datasets[2].borderWidth = 2;
          window.scatterChart.data.datasets[2].pointStyle = isEnclosed ? 'rect' : 'circle';
          window.scatterChart.update('none');
        }
        
        highlightSizeRange(sqft);
        updateRestaurantDetails(f.properties);
      } else {
        // Reset clicked marker and hover states
        clickedMarkerId = null;
        lastClickedProperties = null;
        
        map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
        map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
        
        if (window.scatterChart) {
          window.scatterChart.data.datasets[2].data = [];
          window.scatterChart.update('none');
        }
        
        resetHighlights();
        resetRestaurantDetails();
      }
    });

    processCafeDataForCharts(geojson);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

// Make map instance globally accessible
window.mapInstance = map;

// Function to highlight elements across all visualizations
window.highlightVisualizations = function(category, isEnclosed, specificPoint = null) {
  // Highlight legend bar
  document.querySelectorAll('.legend-bar').forEach((bar, i) => {
    if (i === category) {
      bar.classList.add('highlighted');
    } else {
      bar.classList.remove('highlighted');
    }
  });
  
  // Highlight histogram bar
  if (window.histogramChart) {
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    window.histogramChart.data.datasets[0].backgroundColor = colors;
    window.histogramChart.data.datasets[0].borderColor = colors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    window.histogramChart.data.datasets[0].borderWidth = colors.map((_, i) => 
      i === category ? 2 : 0
    );
    window.histogramChart.update();
  }

  // Highlight scatter plot points
  if (window.scatterChart) {
    const color = getColorForSize([50, 200, 400, 600, 800][category]);
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    if (specificPoint) {
      // Single point highlight (from map marker hover)
      window.scatterChart.data.datasets[2].data = [specificPoint];
      window.scatterChart.data.datasets[2].backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;
      window.scatterChart.data.datasets[2].pointStyle = isEnclosed ? 'rect' : 'circle';
    } else {
      // Category highlight (from legend/histogram hover)
      const minSqft = [0, 100, 300, 500, 700][category];
      const maxSqft = [100, 300, 500, 700, Infinity][category];
      
      // Find all points in the category
      const categoryPoints = [];
      [0, 1].forEach(datasetIndex => {
        const dataset = window.scatterChart.data.datasets[datasetIndex];
        dataset.data.forEach(point => {
          if (point.x >= minSqft && point.x < maxSqft) {
            categoryPoints.push({
              ...point,
              pointStyle: datasetIndex === 1 ? 'rect' : 'circle'
            });
          }
        });
      });
      
      // Update the highlight dataset with all matching points
      window.scatterChart.data.datasets[2].data = categoryPoints;
      window.scatterChart.data.datasets[2].backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;
      window.scatterChart.data.datasets[2].pointRadius = 7;
    }
    
    window.scatterChart.update('none');
  }
};

// Function to reset highlights across all visualizations
window.resetVisualizationHighlights = function() {
  // Reset legend bars
  document.querySelectorAll('.legend-bar').forEach(bar => {
    bar.classList.remove('highlighted');
  });
  
  // Reset histogram bars
  if (window.histogramChart) {
    window.histogramChart.data.datasets[0].borderColor = Array(5).fill('transparent');
    window.histogramChart.data.datasets[0].borderWidth = Array(5).fill(0);
    window.histogramChart.update();
  }

  // Reset scatter plot points
  if (window.scatterChart) {
    window.scatterChart.data.datasets[2].data = [];
    window.scatterChart.update('none');
  }
};

// Update the highlightMarkersBySize function
window.highlightMarkersBySize = function(minSqft, maxSqft, isEnclosed) {
  if (!map) return;
  
  // Determine the category based on the size range
  const category = getSizeCategory((minSqft + maxSqft) / 2);
  
  // Highlight the markers
  map.setFilter('sidewalk-cafes-hover-circles', [
    'all',
    ['>=', ['get', 'SWC_SQ_FT'], minSqft],
    ['<', ['get', 'SWC_SQ_FT'], maxSqft],
    ['!=', ['get', 'SWC_TYPE'], 'Enclosed']
  ]);
  map.setFilter('sidewalk-cafes-hover-squares', [
    'all',
    ['>=', ['get', 'SWC_SQ_FT'], minSqft],
    ['<', ['get', 'SWC_SQ_FT'], maxSqft],
    ['==', ['get', 'SWC_TYPE'], 'Enclosed']
  ]);

  // Move hover layer to the top
  if (map.getLayer('sidewalk-cafes-hover-circles')) {
    map.moveLayer('sidewalk-cafes-hover-circles');
  }
  if (map.getLayer('sidewalk-cafes-hover-squares')) {
    map.moveLayer('sidewalk-cafes-hover-squares');
  }

  // Highlight corresponding elements in other visualizations
  window.highlightVisualizations(category, isEnclosed);
};

// Update the resetMarkerHighlights function
window.resetMarkerHighlights = function() {
  if (!map) return;
  if (map.getLayer('sidewalk-cafes-hover-circles')) {
    map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
  }
  if (map.getLayer('sidewalk-cafes-hover-squares')) {
    map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
  }
  window.resetVisualizationHighlights();
};

// Update the map initialization to store the instance
map.on('load', () => {
  loadSidewalkCafesGeoJSON();
  window.mapInstance = map;
});

function processCafeDataForCharts(geojson) {
  const sizes = [];
  const scatterData = [];

  geojson.features.forEach(feature => {
    const sqft = parseFloat(feature.properties.SWC_SQ_FT);
    const tables = parseInt(feature.properties.SWC_TABLES);
    const type = feature.properties.SWC_TYPE;
    const appId = feature.properties.APP_ID;
    
    if (!isNaN(sqft) && !isNaN(tables)) {
      sizes.push(sqft);
      scatterData.push({ 
        x: sqft, 
        y: tables,
        type: type,
        appId: appId  // Add APP_ID to the scatter data
      });
    }
  });

  createHistogram(sizes);
  createScatter(scatterData);
}

function createHistogram(sizes) {
  const bins = ['0–100', '101–300', '301–500', '501–700', '701+'];
  const counts = [0, 0, 0, 0, 0];

  sizes.forEach(sqft => {
    if (sqft <= 100) counts[0]++;
    else if (sqft <= 300) counts[1]++;
    else if (sqft <= 500) counts[2]++;
    else if (sqft <= 700) counts[3]++;
    else counts[4]++;
  });

  const ctx = document.getElementById('chart-histogram');
  window.histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins,
      datasets: [{
        label: 'Cafe Count',
        data: counts,
        backgroundColor: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
        borderColor: Array(5).fill('transparent'),
        borderWidth: Array(5).fill(0),
        hoverBackgroundColor: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
        hoverBorderWidth: 2,
        hoverBorderColor: '#000000'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onHover: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const minSqft = [0, 100, 300, 500, 700][index];
          const maxSqft = [100, 300, 500, 700, Infinity][index];
          window.highlightMarkersBySize(minSqft, maxSqft, false);
        } else {
          window.resetMarkerHighlights();
        }
      },
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
  const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
  
  // Separate data by type
  const enclosedData = data.filter(point => point.type === 'Enclosed');
  const unenclosedData = data.filter(point => point.type !== 'Enclosed');
  
  // Assign colors based on size category with opacity
  const getPointColor = point => {
    const category = getSizeCategory(point.x);
    const color = colors[category];
    // Convert hex to rgba with opacity
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  };

  window.scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Unenclosed Cafes',
          data: unenclosedData,
          backgroundColor: unenclosedData.map(getPointColor),
          pointRadius: 5,
          pointStyle: 'circle',
          order: 2
        },
        {
          label: 'Enclosed Cafes',
          data: enclosedData,
          backgroundColor: enclosedData.map(getPointColor),
          pointRadius: 5,
          pointStyle: 'rect',
          order: 2
        },
        {
          label: 'Highlighted Point',
          data: [],
          backgroundColor: 'rgba(0,0,0,0)',
          pointRadius: 7,
          borderColor: '#000000',
          borderWidth: 2,
          order: 1  // Lower order to bring to front
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
            text: 'Area', 
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
            text: 'Number of Tables', 
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

  // Add hover interaction for scatter plot points
  ctx.addEventListener('mousemove', (e) => {
    if (!window.scatterChart) return;
    
    const points = window.scatterChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
    if (points.length > 0) {
      const datasetIndex = points[0].datasetIndex;
      const pointIndex = points[0].index;
      
      // Only process hover for the main datasets (0 and 1), not the highlight dataset (2)
      if (datasetIndex < 2) {
        const point = window.scatterChart.data.datasets[datasetIndex].data[pointIndex];
        const isEnclosed = datasetIndex === 1;
        
        // Highlight the corresponding map marker
        if (map) {
          // Reset all hover states first
          map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
          map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
          
          // Set hover state for the appropriate shape
          if (isEnclosed) {
            map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], point.appId]);
          } else {
            map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], point.appId]);
          }

          // Update scatter plot highlight
          const category = getSizeCategory(point.x);
          window.highlightVisualizations(category, isEnclosed, point);
        }
      }
    } else {
      // Reset map highlights when not hovering over any point
      if (map && !hoveredMarkerId) {  // Only reset if no map marker is being hovered
        map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
        map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
        window.resetVisualizationHighlights();
      }
    }
  });

  ctx.addEventListener('mouseleave', () => {
    // Reset map highlights when mouse leaves scatter plot
    if (map && !hoveredMarkerId) {  // Only reset if no map marker is being hovered
      map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
      map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
      window.resetVisualizationHighlights();
    }
  });
}

// Function to update restaurant details in the info panel
function updateRestaurantDetails(properties) {
  const detailsSection = document.getElementById('restaurant-details');
  detailsSection.className = 'details-section';
  
  const statusClass = properties.LIC_STATUS === 'Active' ? 'active' : 'inactive';
  const statusIcon = properties.LIC_STATUS === 'Active' ? 'fa-circle-check' : 'fa-circle-xmark';
  const addressLine2 = properties.BUSINESS_NAME2 ? properties.BUSINESS_NAME2 : 'Not recorded';
  
  const formatSentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  
  detailsSection.innerHTML = `
    <h3><i class="fas fa-utensils"></i> Restaurant Details</h3>
    
    <div class="restaurant-header">
          <p class="status ${statusClass}">
        <i class="fas ${statusIcon}"></i>
        ${properties.LIC_STATUS.toLowerCase()}
      </p>
      <p class="restaurant-name">
        <i class="fas fa-store"></i>
        ${formatSentenceCase(properties.BUSINESS_NAME)}
      </p>

      <p class="restaurant-address">
        <i class="fas fa-location-dot"></i>
        ${formatSentenceCase(properties.BUILDING)} ${formatSentenceCase(properties.STREET)}
      </p>
      <p class="restaurant-address2">
        <i class="fas fa-building"></i>
        ${formatSentenceCase(addressLine2)}
      </p>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <p class="label"><i class="fas fa-ruler"></i> Area</p>
        <p class="value">${parseFloat(properties.SWC_SQ_FT).toLocaleString()} sq ft</p>
      </div>
      <div class="info-item">
        <p class="label"><i class="fas fa-tag"></i> Type</p>
        <p class="value">${properties.SWC_TYPE}</p>
      </div>
      <div class="info-item">
        <p class="label"><i class="fas fa-chair"></i> Tables</p>
        <p class="value">${parseInt(properties.SWC_TABLES)}</p>
      </div>
      <div class="info-item">
        <p class="label"><i class="fas fa-user"></i> Chairs</p>
        <p class="value">${parseInt(properties.SWC_CHAIRS)}</p>
      </div>
    </div>
  `;
}

// Function to reset restaurant details to placeholder
function resetRestaurantDetails() {
  const detailsSection = document.getElementById('restaurant-details');
  detailsSection.className = 'details-section placeholder';
  
  detailsSection.innerHTML = `
    <h3><i class="fas fa-utensils"></i> Restaurant Details</h3>
    <i class="fas fa-hand-pointer"></i>
    <p>Hover or click on a marker to see restaurant details</p>
  `;
}