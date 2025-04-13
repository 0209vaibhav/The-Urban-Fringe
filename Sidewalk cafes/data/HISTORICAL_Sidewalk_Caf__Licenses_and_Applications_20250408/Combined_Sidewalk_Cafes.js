// sidewalk_cafes_map.js

mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Force the map container to take full height
document.getElementById('map').style.height = '100%';

let histogramChart;
let hoveredMarkerId = null;
let clickedMarkerId = null;
let lastClickedProperties = null;

// Sidewalk visualization functions
let widthHistogramChart;
let hoveredSidewalkId = null;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.9712, 40.7831],
  zoom: 11.5,
  maxZoom: 18,
  minZoom: 11.5,
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

function getColorForWidth(width) {
  if (width <= 3) return '#e5f5e0';
  if (width <= 6) return '#c7e9c0';
  if (width <= 9) return '#a1d99b';
  if (width <= 12) return '#74c476';
  if (width <= 15) return '#41ab5d';
  return '#238b45';
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
    // Load the dataset
    const response = await fetch('cleaned-noduplicates-combined-manhattan.geojson');
    
    const geojson = await response.json();

    // Process the features
    const combinedFeatures = geojson.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        // Map the properties to match the existing structure
        BUSINESS_NAME: feature.properties.RestaurantName || feature.properties.DoingBusinessAs,
        BUILDING: feature.properties.BuildingNumber,
        STREET: feature.properties.Street,
        SWC_SQ_FT: feature.properties['Sidewalk Dimensions (Area)'] || 0,
        SWC_TYPE: feature.properties.SeatingChoice === 'both' ? 'Enclosed' : 'Unenclosed',
        SWC_TABLES: 0, // Default value if not available
        SWC_CHAIRS: 0, // Default value if not available
        LIC_STATUS: feature.properties.IsSidewayCompliant === 'Compliant' ? 'Active' : 'Inactive',
        BUSINESS_NAME2: feature.properties.LegalBusinessName,
        APP_ID: feature.properties.RestaurantInspectionID?.toString() || feature.properties.objectid?.toString() || ''
      }
    }));

    const combinedGeoJSON = {
      type: 'FeatureCollection',
      features: combinedFeatures
    };

    map.addSource('sidewalk-cafes', {
      type: 'geojson',
      data: combinedGeoJSON
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
        'circle-opacity': 0.5,
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
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000'
      },
      filter: ['all', 
        ['!=', ['get', 'SWC_TYPE'], 'Enclosed'],
        ['==', ['get', 'APP_ID'], '']
      ]
    });

    // Create colored square images for each category with borders and opacity
    const size = 20; // Define size for square markers
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    colors.forEach((color, i) => {
      // Regular square with opacity
      const coloredSquare = new Image(size, size);
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const colorCtx = colorCanvas.getContext('2d');
      
      // Draw filled square with opacity
      colorCtx.fillStyle = color;
      colorCtx.globalAlpha = 0.5;
      colorCtx.fillRect(0, 0, size, size);
      
      coloredSquare.src = colorCanvas.toDataURL();
      map.loadImage(coloredSquare.src, function(error, image) {
        if (error) throw error;
        map.addImage(`square-${i}`, image);
      });

      // Hover square with border and full opacity
      const borderWidth = 4;
      const paddedSize = size + (borderWidth * 2);
      const hoverSquare = new Image(paddedSize, paddedSize);
      const hoverCanvas = document.createElement('canvas');
      hoverCanvas.width = paddedSize;
      hoverCanvas.height = paddedSize;
      const hoverCtx = hoverCanvas.getContext('2d');
      
      hoverCtx.imageSmoothingEnabled = true;
      hoverCtx.imageSmoothingQuality = 'high';
      
      hoverCtx.clearRect(0, 0, paddedSize, paddedSize);
      
      hoverCtx.fillStyle = '#000000';
      hoverCtx.fillRect(0, 0, paddedSize, paddedSize);
      
      hoverCtx.fillStyle = color;
      hoverCtx.globalAlpha = 0.9;
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
      if (!e.point) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['sidewalk-cafes-circles', 'sidewalk-cafes-squares']
      });

      // Update legend bars
      const legendBars = document.querySelectorAll('.legend-bar');
      const legendLabels = document.querySelectorAll('.legend-label');
      
      if (legendBars && legendLabels) {
        legendBars.forEach(bar => {
          if (bar) bar.classList.remove('highlighted');
        });
        legendLabels.forEach(label => {
          if (label) label.classList.remove('highlighted');
        });
      }

      if (features.length > 0) {
        const feature = features[0];
        const area = feature.properties.SWC_AREA;
        const width = feature.properties.SIDEWALK_WIDTH;
        const sidewalkArea = feature.properties.SIDEWALK_AREA;

        // Find and highlight corresponding legend bar
        if (legendBars && legendLabels) {
          const currentStep = document.querySelector('.story-section[data-step]').getAttribute('data-step');
          let value, bars, labels;

          switch (currentStep) {
            case 'area':
              value = area;
              bars = document.querySelectorAll('[data-step="area"] .legend-bar');
              labels = document.querySelectorAll('[data-step="area"] .legend-label');
              break;
            case 'widths':
              value = width;
              bars = document.querySelectorAll('.widths-section .legend-bar');
              labels = document.querySelectorAll('.widths-section .legend-label');
              break;
            case 'sidewalks':
              value = sidewalkArea;
              bars = document.querySelectorAll('.sidewalks-section .legend-bar');
              labels = document.querySelectorAll('.sidewalks-section .legend-label');
              break;
          }

          if (bars && labels) {
            const index = findLegendIndex(value, currentStep);
            if (index >= 0 && index < bars.length) {
              bars[index].classList.add('highlighted');
              labels[index].classList.add('highlighted');
            }
          }
        }
      }
    });

    // Helper function to find legend index
    function findLegendIndex(value, step) {
      if (!value) return -1;
      
      const ranges = {
        'area': [0, 100, 300, 500, 700, 1000],
        'widths': [0, 3, 6, 9, 12, 15, Infinity],
        'sidewalks': [0, 5000, 10000, 15000, 20000, 25000, Infinity]
      };

      const range = ranges[step];
      if (!range) return -1;

      for (let i = 0; i < range.length - 1; i++) {
        if (value >= range[i] && value < range[i + 1]) {
          return i;
        }
      }
      return range.length - 2;
    }

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

    processCafeDataForCharts(combinedGeoJSON);
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

async function loadSidewalkPolygonsGeoJSON() {
  try {
    // Update the path to point to the correct location of the sidewalk GeoJSON file
    const response = await fetch('Manhattan_Sidewalks.geojson');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const geojson = await response.json();
    
    if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('Invalid GeoJSON format');
    }

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
          ['get', 'SIDEWALK_WIDTH'],
          '#e5f5e0', 3,
          '#c7e9c0', 6,
          '#a1d99b', 9,
          '#74c476', 12,
          '#41ab5d', 15,
          '#238b45'
        ],
        'fill-opacity': 0.9,
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
          ['get', 'SIDEWALK_WIDTH'],
          '#e5f5e0', 3,
          '#c7e9c0', 6,
          '#a1d99b', 9,
          '#74c476', 12,
          '#41ab5d', 15,
          '#238b45'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'transparent'
      }
    });

    // Update map layer colors for widths section
    map.on('style.load', () => {
      // Remove any existing layers first
      if (map.getLayer('sidewalk-polygons-layer')) {
        map.removeLayer('sidewalk-polygons-layer');
      }
      if (map.getLayer('sidewalk-polygons-hover')) {
        map.removeLayer('sidewalk-polygons-hover');
      }

      // Add the layers again with correct colors
      map.addLayer({
        id: 'sidewalk-polygons-layer',
        type: 'fill',
        source: 'sidewalk-polygons',
        layout: {},
        paint: {
          'fill-color': [
            'step',
            ['get', 'SIDEWALK_WIDTH'],
            '#e5f5e0', 3,
            '#c7e9c0', 6,
            '#a1d99b', 9,
            '#74c476', 12,
            '#41ab5d', 15,
            '#238b45'
          ],
          'fill-opacity': 0.7,
          'fill-outline-color': 'transparent'
        }
      });

      map.addLayer({
        id: 'sidewalk-polygons-hover',
        type: 'fill',
        source: 'sidewalk-polygons',
        layout: {},
        paint: {
          'fill-color': [
            'step',
            ['get', 'SIDEWALK_WIDTH'],
            '#e5f5e0', 3,
            '#c7e9c0', 6,
            '#a1d99b', 9,
            '#74c476', 12,
            '#41ab5d', 15,
            '#238b45'
          ],
          'fill-opacity': 0.9,
          'fill-outline-color': 'transparent'
        },
        filter: ['==', 'id', '']
      });
    });

    // Mouse enter event
    map.on('mousemove', 'sidewalk-polygons-layer', (e) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const area = parseFloat(f.properties.SHAPE_Area);
        const length = parseFloat(f.properties.SHAPE_Leng);
        const width = area/length;
        const color = getColorForArea(area);
        
        if (hoveredSidewalkId !== f.id) {
          hoveredSidewalkId = f.id;
          // Only set filter if we have a valid id
          if (hoveredSidewalkId) {
            map.setFilter('sidewalk-polygons-hover', ['==', 'id', hoveredSidewalkId]);
          }
          
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
      if (hoveredSidewalkId !== null) {
        hoveredSidewalkId = null;
        map.setFilter('sidewalk-polygons-hover', ['==', 'id', '']);
        
        if (window.scatterChart) {
          window.scatterChart.data.datasets[1].data = [];
          window.scatterChart.update('none');
        }
        
        resetSidewalkHighlights();
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

      // Only update scatter chart if it exists and has the required dataset
      if (window.scatterChart && window.scatterChart.data && window.scatterChart.data.datasets && window.scatterChart.data.datasets[1]) {
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
    console.error("Error loading Sidewalk GeoJSON:", err);
    // Add a user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <h3>Error Loading Sidewalk Data</h3>
      <p>Could not load sidewalk data. Please ensure the file exists at the correct location.</p>
      <p>Error details: ${err.message}</p>
    `;
    document.querySelector('.info-panel').appendChild(errorDiv);
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
window.highlightMarkersBySize = function(minSqft, maxSqft, isEnclosed = null) {
  if (!map) return;
  
  // Ensure we have valid numbers for the filter
  minSqft = Number(minSqft) || 0;
  maxSqft = Number(maxSqft) || Infinity;
  
  // Determine the category based on the size range
  const category = getSizeCategory((minSqft + maxSqft) / 2);
  
  // Check if layers exist before filtering
  const layers = ['sidewalk-cafes-hover-circles', 'sidewalk-cafes-hover-squares'];
  
  layers.forEach(layer => {
    if (map.getLayer(layer)) {
      const baseFilter = [
    'all',
    ['>=', ['get', 'SWC_SQ_FT'], minSqft],
        ['<', ['get', 'SWC_SQ_FT'], maxSqft]
      ];

      if (layer.includes('circles')) {
        map.setFilter(layer, [
          ...baseFilter,
    ['!=', ['get', 'SWC_TYPE'], 'Enclosed']
  ]);
      } else {
        map.setFilter(layer, [
          ...baseFilter,
    ['==', ['get', 'SWC_TYPE'], 'Enclosed']
  ]);
      }
    }
  });

  // Move hover layer to the top
  layers.forEach(layer => {
    if (map.getLayer(layer)) {
      map.moveLayer(layer);
  }
  });

  // Highlight corresponding elements in other visualizations
  window.highlightVisualizations(category, isEnclosed === null ? false : isEnclosed);
};

// Update the resetMarkerHighlights function
window.resetMarkerHighlights = function() {
  if (!map) return;
  
  const layers = ['sidewalk-cafes-hover-circles', 'sidewalk-cafes-hover-squares'];
  
  layers.forEach(layer => {
    if (map.getLayer(layer)) {
      map.setFilter(layer, ['==', ['get', 'APP_ID'], '']);
    }
  });
  
  window.resetVisualizationHighlights();
};

// Scrollytelling configuration
const scrollyConfig = {
  'sidewalks': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  },
  'widths': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  },
  'intro': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  },
  'area': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  },
  'types': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  },
  'seating': {
    center: [-73.9712, 40.7831],
    zoom: 11.5,
    pitch: 0,
    bearing: 0,
    duration: 2000
  }
};

// Initialize scrollytelling
function initScrollytelling() {
  const sections = document.querySelectorAll('.story-section');
  const infoPanel = document.querySelector('.info-panel');
  
  // Create intersection observer for the info panel
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const step = entry.target.dataset.step;
        updateMapView(step);
        updateSectionState(entry.target);
      }
    });
  }, {
    root: infoPanel,
    threshold: 0.5
  });

  sections.forEach(section => {
    observer.observe(section);
  });
}

// Update map view based on current step
function updateMapView(step) {
  const config = scrollyConfig[step];
  if (!config) return;

  map.easeTo({
    center: config.center,
    zoom: config.zoom,
    pitch: config.pitch,
    bearing: config.bearing,
    duration: config.duration
  });

  // Update map layers based on step
  const cafeLayers = ['sidewalk-cafes-circles', 'sidewalk-cafes-squares', 
                     'sidewalk-cafes-hover-circles', 'sidewalk-cafes-hover-squares'];
  
  // First, check if all layers exist before proceeding
  const layersExist = cafeLayers.every(layer => map.getLayer(layer));
  if (!layersExist) {
    console.log('Waiting for layers to be loaded...');
    return;
  }

  if (step === 'types') {
    // Show cafe layers with type-specific colors
    cafeLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', 'visible');
      }
    });

    // Update circle layers (unenclosed) to magenta with transparency
    if (map.getLayer('sidewalk-cafes-circles')) {
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-color', '#ff007f');
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-opacity', 0.2);
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-stroke-width', 0);
    }
    
  if (map.getLayer('sidewalk-cafes-hover-circles')) {
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-color', '#ff007f');
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-opacity', 0.4);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-stroke-width', 2);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-stroke-color', '#000000');
    }

    // Create yellow square markers with transparency
    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw yellow square with transparency
    ctx.fillStyle = '#ffbf00';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, size, size);
    
    // Create hover version with slightly more opacity
    const hoverCanvas = document.createElement('canvas');
    hoverCanvas.width = size;
    hoverCanvas.height = size;
    const hoverCtx = hoverCanvas.getContext('2d');
    
    hoverCtx.fillStyle = '#ffbf00';
    hoverCtx.globalAlpha = 0.4;
    hoverCtx.fillRect(0, 0, size, size);
    
    const hoverImageData = hoverCtx.getImageData(0, 0, size, size);

    // Remove existing images if they exist
    if (map.hasImage('type-square')) {
      map.removeImage('type-square');
    }
    if (map.hasImage('type-square-hover')) {
      map.removeImage('type-square-hover');
    }

    // Add new images
    map.addImage('type-square', imageData, { sdf: false });
    map.addImage('type-square-hover', hoverImageData, { sdf: false });

    // Update square layers
    if (map.getLayer('sidewalk-cafes-squares')) {
      map.setLayoutProperty('sidewalk-cafes-squares', 'icon-image', 'type-square');
      map.setPaintProperty('sidewalk-cafes-squares', 'icon-opacity', 0.2);
    }
    
    if (map.getLayer('sidewalk-cafes-hover-squares')) {
      map.setLayoutProperty('sidewalk-cafes-hover-squares', 'icon-image', 'type-square-hover');
      map.setPaintProperty('sidewalk-cafes-hover-squares', 'icon-opacity', 0.4);
    }

    // Hide sidewalk polygons
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'none');
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'none');
    }

  } else if (step === 'intro') {
    // Show cafe layers in single color with transparency
    const cafeLayers = [
      'sidewalk-cafes-circles',
      'sidewalk-cafes-hover-circles',
      'sidewalk-cafes-squares',
      'sidewalk-cafes-hover-squares'
    ];

    // First, make all cafe layers visible
    cafeLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', 'visible');
      }
    });

    // Update circle layers
    if (map.getLayer('sidewalk-cafes-circles')) {
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-color', '#ff0000');
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-opacity', 0.2);
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-stroke-width', 0);
      map.setFilter('sidewalk-cafes-circles', null);
    }
    
    if (map.getLayer('sidewalk-cafes-hover-circles')) {
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-color', '#ff0000');
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-opacity', 0.4);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-stroke-width', 0);
    map.setFilter('sidewalk-cafes-hover-circles', ['==', ['get', 'APP_ID'], '']);
  }

    // Create single color square markers with transparency
    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, size, size);
    
    // Draw red square with transparency
    ctx.fillStyle = '#ff0000';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, size, size);
    
    // Create hover version with same transparency
    const hoverCanvas = document.createElement('canvas');
    hoverCanvas.width = size;
    hoverCanvas.height = size;
    const hoverCtx = hoverCanvas.getContext('2d');
    
    // Set background to transparent
    hoverCtx.clearRect(0, 0, size, size);
    
    // Draw red square with transparency
    hoverCtx.fillStyle = '#ff0000';
    hoverCtx.globalAlpha = 0.4;
    hoverCtx.fillRect(0, 0, size, size);
    
    const hoverImageData = hoverCtx.getImageData(0, 0, size, size);

    // Remove existing images if they exist
    if (map.hasImage('single-square')) {
      map.removeImage('single-square');
    }
    if (map.hasImage('single-square-hover')) {
      map.removeImage('single-square-hover');
    }

    // Add new images
    map.addImage('single-square', imageData, { sdf: false });
    map.addImage('single-square-hover', hoverImageData, { sdf: false });

    // Update square layers
    if (map.getLayer('sidewalk-cafes-squares')) {
      map.setLayoutProperty('sidewalk-cafes-squares', 'icon-image', 'single-square');
      map.setPaintProperty('sidewalk-cafes-squares', 'icon-opacity', 0.2);
      map.setFilter('sidewalk-cafes-squares', null);
    }
    
  if (map.getLayer('sidewalk-cafes-hover-squares')) {
      map.setLayoutProperty('sidewalk-cafes-hover-squares', 'icon-image', 'single-square-hover');
      map.setPaintProperty('sidewalk-cafes-hover-squares', 'icon-opacity', 0.4);
    map.setFilter('sidewalk-cafes-hover-squares', ['==', ['get', 'APP_ID'], '']);
  }
  
    // Hide sidewalk polygons
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'none');
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'none');
    }

    // Reset any filters that might be affecting visibility
    cafeLayers.forEach(layer => {
      if (layer.includes('hover')) {
        map.setFilter(layer, ['==', ['get', 'APP_ID'], '']);
      } else {
        map.setFilter(layer, null);
      }
    });
  } else if (step === 'area') {
    // Show cafe layers with original gradient colors
    if (map.getLayer('sidewalk-cafes-circles')) {
      map.setLayoutProperty('sidewalk-cafes-circles', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-color', [
        'step',
        ['get', 'SWC_SQ_FT'],
        '#fee5d9', 100,
        '#fcae91', 300,
        '#fb6a4a', 500,
        '#de2d26', 700,
        '#a50f15'
      ]);
    }
    if (map.getLayer('sidewalk-cafes-hover-circles')) {
      map.setLayoutProperty('sidewalk-cafes-hover-circles', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-color', [
        'step',
        ['get', 'SWC_SQ_FT'],
        '#fee5d9', 100,
        '#fcae91', 300,
        '#fb6a4a', 500,
        '#de2d26', 700,
        '#a50f15'
      ]);
    }
    if (map.getLayer('sidewalk-cafes-squares')) {
      map.setLayoutProperty('sidewalk-cafes-squares', 'visibility', 'visible');
      map.setLayoutProperty('sidewalk-cafes-squares', 'icon-image', [
        'step',
        ['get', 'SWC_SQ_FT'],
        'square-0', 100,
        'square-1', 300,
        'square-2', 500,
        'square-3', 700,
        'square-4'
      ]);
    }

    // Hide sidewalk polygons
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'none');
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'none');
    }
  } else if (step === 'sidewalks') {
    // Handle sidewalks section
    cafeLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', 'none');
      }
    });
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-polygons-layer', 'fill-color', [
        'step',
        ['get', 'SHAPE_Area'],
        '#deebf7', 5000,
        '#c6dbef', 10000,
        '#9ecae1', 15000,
        '#6baed6', 20000,
        '#4292c6', 25000,
        '#2171b5'
      ]);
      map.setPaintProperty('sidewalk-polygons-layer', 'fill-opacity', 0.7);
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-polygons-hover', 'fill-color', [
        'step',
        ['get', 'SHAPE_Area'],
        '#deebf7', 5000,
        '#c6dbef', 10000,
        '#9ecae1', 15000,
        '#6baed6', 20000,
        '#4292c6', 25000,
        '#2171b5'
      ]);
      map.setPaintProperty('sidewalk-polygons-hover', 'fill-opacity', 0.9);
    }
  } else if (step === 'widths') {
    // Handle widths section
    cafeLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', 'none');
      }
    });
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-polygons-layer', 'fill-color', [
        'step',
        ['/', ['get', 'SHAPE_Area'], ['get', 'SHAPE_Leng']],
        '#e5f5e0', 3,
        '#c7e9c0', 6,
        '#a1d99b', 9,
        '#74c476', 12,
        '#41ab5d', 15,
        '#238b45'
      ]);
      map.setPaintProperty('sidewalk-polygons-layer', 'fill-opacity', 0.7);
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-polygons-hover', 'fill-color', [
        'step',
        ['/', ['get', 'SHAPE_Area'], ['get', 'SHAPE_Leng']],
        '#e5f5e0', 3,
        '#c7e9c0', 6,
        '#a1d99b', 9,
        '#74c476', 12,
        '#41ab5d', 15,
        '#238b45'
      ]);
      map.setPaintProperty('sidewalk-polygons-hover', 'fill-opacity', 0.9);
    }
  } else if (step === 'seating') {
    // Handle seating section
    cafeLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', 'visible');
      }
    });

    // Update circle layers (unenclosed) with seating type colors
    if (map.getLayer('sidewalk-cafes-circles')) {
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-color', [
        'case',
        ['all', 
          ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
          ['==', ['get', 'Approved for Roadway Seating'], 'yes']
        ],
        '#2ecc71', // Green for Hybrid
        ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
        '#4a90e2', // Blue for Sidewalk
        ['==', ['get', 'Approved for Roadway Seating'], 'yes'],
        '#e74c3c', // Red for Roadway
        '#999999'  // Default gray
      ]);
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-opacity', 0.7);
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-stroke-width', 1);
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-stroke-color', '#ffffff');
    }
    
    if (map.getLayer('sidewalk-cafes-hover-circles')) {
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-color', [
        'case',
        ['all', 
          ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
          ['==', ['get', 'Approved for Roadway Seating'], 'yes']
        ],
        '#2ecc71', // Green for Hybrid
        ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
        '#4a90e2', // Blue for Sidewalk
        ['==', ['get', 'Approved for Roadway Seating'], 'yes'],
        '#e74c3c', // Red for Roadway
        '#999999'  // Default gray
      ]);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-opacity', 0.9);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-stroke-width', 2);
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-stroke-color', '#000000');
    }

    // Create colored square markers for each seating type
    const size = 20;
    const colors = {
      'sidewalk': '#4a90e2', // Blue
      'roadway': '#e74c3c',  // Red
      'hybrid': '#2ecc71',   // Green
      'default': '#999999'   // Gray
    };

    // Remove existing images if they exist
    Object.keys(colors).forEach(type => {
      const regularImageName = `seating-square-${type}`;
      const hoverImageName = `seating-square-hover-${type}`;
      
      if (map.hasImage(regularImageName)) {
        map.removeImage(regularImageName);
      }
      if (map.hasImage(hoverImageName)) {
        map.removeImage(hoverImageName);
      }
    });

    // Create regular and hover versions for each color
    Object.entries(colors).forEach(([type, color]) => {
      // Regular square
      const coloredSquare = new Image(size, size);
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const colorCtx = colorCanvas.getContext('2d');
      
      colorCtx.fillStyle = color;
      colorCtx.globalAlpha = 0.7;
      colorCtx.fillRect(0, 0, size, size);
      colorCtx.strokeStyle = '#ffffff';
      colorCtx.lineWidth = 1;
      colorCtx.strokeRect(0, 0, size, size);
      
      coloredSquare.src = colorCanvas.toDataURL();
      map.addImage(`seating-square-${type}`, coloredSquare);

      // Hover square
      const hoverSquare = new Image(size, size);
      const hoverCanvas = document.createElement('canvas');
      hoverCanvas.width = size;
      hoverCanvas.height = size;
      const hoverCtx = hoverCanvas.getContext('2d');
      
      hoverCtx.fillStyle = color;
      hoverCtx.globalAlpha = 0.9;
      hoverCtx.fillRect(0, 0, size, size);
      hoverCtx.strokeStyle = '#000000';
      hoverCtx.lineWidth = 2;
      hoverCtx.strokeRect(0, 0, size, size);
      
      hoverSquare.src = hoverCanvas.toDataURL();
      map.addImage(`seating-square-hover-${type}`, hoverSquare);
    });

    // Update square layers (enclosed) with seating type icons
    if (map.getLayer('sidewalk-cafes-squares')) {
      map.setLayoutProperty('sidewalk-cafes-squares', 'icon-image', [
        'case',
        ['all', 
          ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
          ['==', ['get', 'Approved for Roadway Seating'], 'yes']
        ],
        'seating-square-hybrid',
        ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
        'seating-square-sidewalk',
        ['==', ['get', 'Approved for Roadway Seating'], 'yes'],
        'seating-square-roadway',
        'seating-square-default'
      ]);
      map.setPaintProperty('sidewalk-cafes-squares', 'icon-opacity', 0.7);
    }
    
    if (map.getLayer('sidewalk-cafes-hover-squares')) {
      map.setLayoutProperty('sidewalk-cafes-hover-squares', 'icon-image', [
        'case',
        ['all', 
          ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
          ['==', ['get', 'Approved for Roadway Seating'], 'yes']
        ],
        'seating-square-hover-hybrid',
        ['==', ['get', 'Approved for Sidewalk Seating'], 'yes'],
        'seating-square-hover-sidewalk',
        ['==', ['get', 'Approved for Roadway Seating'], 'yes'],
        'seating-square-hover-roadway',
        'seating-square-hover-default'
      ]);
      map.setPaintProperty('sidewalk-cafes-hover-squares', 'icon-opacity', 0.9);
    }

    // Hide sidewalk polygons
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'none');
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'none');
    }
  } else {
    // Default case: show cafe layers with original colors
    if (map.getLayer('sidewalk-cafes-circles')) {
      map.setLayoutProperty('sidewalk-cafes-circles', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-cafes-circles', 'circle-color', [
        'step',
        ['get', 'SWC_SQ_FT'],
        '#fee5d9', 100,
        '#fcae91', 300,
        '#fb6a4a', 500,
        '#de2d26', 700,
        '#a50f15'
      ]);
    }
    if (map.getLayer('sidewalk-cafes-hover-circles')) {
      map.setLayoutProperty('sidewalk-cafes-hover-circles', 'visibility', 'visible');
      map.setPaintProperty('sidewalk-cafes-hover-circles', 'circle-color', [
        'step',
        ['get', 'SWC_SQ_FT'],
        '#fee5d9', 100,
        '#fcae91', 300,
        '#fb6a4a', 500,
        '#de2d26', 700,
        '#a50f15'
      ]);
    }
    if (map.getLayer('sidewalk-cafes-squares')) {
      map.setLayoutProperty('sidewalk-cafes-squares', 'visibility', 'visible');
      map.setLayoutProperty('sidewalk-cafes-squares', 'icon-image', [
        'step',
        ['get', 'SWC_SQ_FT'],
        'square-0', 100,
        'square-1', 300,
        'square-2', 500,
        'square-3', 700,
        'square-4'
      ]);
    }

    // Hide sidewalk polygons
    if (map.getLayer('sidewalk-polygons-layer')) {
      map.setLayoutProperty('sidewalk-polygons-layer', 'visibility', 'none');
    }
    if (map.getLayer('sidewalk-polygons-hover')) {
      map.setLayoutProperty('sidewalk-polygons-hover', 'visibility', 'none');
    }
  }
}

// Function to create single color square markers
function createSingleColorSquareMarkers(color) {
  const size = 20;
  const borderWidth = 4;
  const paddedSize = size + (borderWidth * 2);

  // Create regular and hover versions of the marker
  for (let i = 0; i < 5; i++) {
    // Regular square
    const coloredSquare = new Image(size, size);
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d');
    
    colorCtx.fillStyle = color;
    colorCtx.globalAlpha = 0.5;
    colorCtx.fillRect(0, 0, size, size);
    
    coloredSquare.src = colorCanvas.toDataURL();
    map.addImage(`square-${i}`, coloredSquare, { replace: true });

    // Hover square
    const hoverSquare = new Image(paddedSize, paddedSize);
    const hoverCanvas = document.createElement('canvas');
    hoverCanvas.width = paddedSize;
    hoverCanvas.height = paddedSize;
    const hoverCtx = hoverCanvas.getContext('2d');
    
    hoverCtx.fillStyle = '#000000';
    hoverCtx.fillRect(0, 0, paddedSize, paddedSize);
    
    hoverCtx.fillStyle = color;
    hoverCtx.globalAlpha = 0.9;
    hoverCtx.fillRect(borderWidth, borderWidth, size, size);
    
    hoverSquare.src = hoverCanvas.toDataURL();
    map.addImage(`square-hover-${i}`, hoverSquare, { replace: true });
  }
}

// Function to restore gradient square markers
function createGradientSquareMarkers() {
  const size = 20;
  const borderWidth = 4;
  const paddedSize = size + (borderWidth * 2);
  const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];

  colors.forEach((color, i) => {
    // Regular square
    const coloredSquare = new Image(size, size);
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d');
    
    colorCtx.fillStyle = color;
    colorCtx.globalAlpha = 0.5;
    colorCtx.fillRect(0, 0, size, size);
    
    coloredSquare.src = colorCanvas.toDataURL();
    map.addImage(`square-${i}`, coloredSquare, { replace: true });

    // Hover square
    const hoverSquare = new Image(paddedSize, paddedSize);
    const hoverCanvas = document.createElement('canvas');
    hoverCanvas.width = paddedSize;
    hoverCanvas.height = paddedSize;
    const hoverCtx = hoverCanvas.getContext('2d');
    
    hoverCtx.fillStyle = '#000000';
    hoverCtx.fillRect(0, 0, paddedSize, paddedSize);
    
    hoverCtx.fillStyle = color;
    hoverCtx.globalAlpha = 0.9;
    hoverCtx.fillRect(borderWidth, borderWidth, size, size);
    
    hoverSquare.src = hoverCanvas.toDataURL();
    map.addImage(`square-hover-${i}`, hoverSquare, { replace: true });
  });
}

// Update section state
function updateSectionState(activeSection) {
  document.querySelectorAll('.story-section').forEach(section => {
    section.classList.remove('active');
  });
  activeSection.classList.add('active');
  
  // Scroll the active section into view
  activeSection.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

// Initialize navigation buttons
function initNavigationButtons() {
  const navButtons = document.querySelectorAll('.nav-button');
  const infoPanel = document.querySelector('.info-panel');
  
  // Add click event listeners to navigation buttons
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const section = this.dataset.section;
      const targetSection = document.querySelector(`[data-step="${section}"]`);
      
      if (targetSection) {
        // Update active button
        navButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update map view
        updateMapView(section);
      }
    });
  });

  // Create intersection observer for sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target.dataset.step;
        navButtons.forEach(button => {
          button.classList.toggle('active', button.dataset.section === section);
        });
      }
    });
  }, {
    root: infoPanel,
    threshold: 0.5
  });

  // Observe all story sections
  document.querySelectorAll('.story-section').forEach(section => {
    observer.observe(section);
  });

  // Set default section to Sidewalks
  const defaultSection = document.querySelector('[data-step="sidewalks"]');
  const defaultButton = document.querySelector('[data-section="sidewalks"]');
  if (defaultSection && defaultButton) {
    defaultButton.classList.add('active');
    defaultSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    updateMapView('sidewalks');
  }
}

// Initialize everything when the map is loaded
map.on('load', async () => {
  try {
    // Load both GeoJSON files
    const cafesGeoJSON = await loadSidewalkCafesGeoJSON();
    const sidewalksGeoJSON = await loadSidewalkPolygonsGeoJSON();

    // Initialize navigation and scrollytelling
    initNavigationButtons();
    initScrollytelling();

    // Set default section to Sidewalks
    const defaultSection = 'sidewalks';
    const defaultButton = document.querySelector(`.nav-button[data-section="${defaultSection}"]`);
    if (defaultButton) {
      defaultButton.classList.add('active');
    }

    // Show the sidewalks section
    const sidewalksSection = document.querySelector('.sidewalks-section');
    if (sidewalksSection) {
      sidewalksSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Update map view to sidewalks section
    updateMapView('sidewalks');

    // Process and display sidewalks data
    if (sidewalksGeoJSON && sidewalksGeoJSON.features) {
      processSidewalkDataForCharts(sidewalksGeoJSON);
      createSidewalkHistogram(sidewalksGeoJSON.features.map(f => f.properties.area));
      createWidthHistogram(sidewalksGeoJSON.features.map(f => f.properties.width));
    }

    // Process cafe data for other sections
    if (cafesGeoJSON) {
      processCafeDataForCharts(cafesGeoJSON);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

// Initialize interactions after the map is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the map to be loaded before setting up chart interactions
  if (map.loaded()) {
    setupLegendInteractions();
    setupChartInteractions();
    resetRestaurantDetails();
  } else {
    map.on('load', () => {
      setupLegendInteractions();
      setupChartInteractions();
      resetRestaurantDetails();
    });
  }
});

function processCafeDataForCharts(geojson) {
  const sizes = [];
  const typeCounts = {
    'Enclosed': 0,
    'Unenclosed': 0
  };
  const seatingCounts = {
    'Sidewalk': 0,
    'Roadway': 0,
    'Hybrid': 0
  };

  geojson.features.forEach(feature => {
    const sqft = parseFloat(feature.properties.SWC_SQ_FT);
    const type = feature.properties.SWC_TYPE;
    const sidewalkApproved = feature.properties['Approved for Sidewalk Seating'] === 'yes';
    const roadwayApproved = feature.properties['Approved for Roadway Seating'] === 'yes';
    
    if (!isNaN(sqft)) {
      sizes.push(sqft);
    }

    // Count cafe types
    if (type === 'Enclosed') {
      typeCounts.Enclosed++;
    } else {
      typeCounts.Unenclosed++;
    }

    // Count seating types
    if (sidewalkApproved && roadwayApproved) {
      seatingCounts.Hybrid++;
    } else if (sidewalkApproved) {
      seatingCounts.Sidewalk++;
    } else if (roadwayApproved) {
      seatingCounts.Roadway++;
    }
  });

  // Create charts only if their canvas elements exist
  const histogramCanvas = document.getElementById('chart-histogram');
  const typeCanvas = document.getElementById('chart-types');
  const seatingCanvas = document.getElementById('chart-seating');

  if (histogramCanvas) {
    createHistogram(sizes);
  }
  if (typeCanvas) {
    createTypeChart(typeCounts);
  }
  if (seatingCanvas) {
    createSeatingChart(seatingCounts);
  }
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

function createTypeChart(typeCounts) {
  const ctx = document.getElementById('chart-types').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Enclosed Seating', 'Unenclosed Seating'],
      datasets: [{
        label: 'Number of Cafes',
        data: [typeCounts.Enclosed, typeCounts.Unenclosed],
        backgroundColor: [
          '#ffbf00', // Yellow for Enclosed
          '#ff007f'  // Magenta for Unenclosed
        ],
        borderColor: [
          '#ffbf00',
          '#ff007f'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { 
            display: true, 
            text: 'Number of Cafes',
            font: {
              size: 12
            }
          },
          ticks: { 
            font: {
              size: 11
            }
            }
          },
        x: {
          title: { 
            display: true, 
            text: 'Cafe Type',
            font: {
              size: 12
            }
          },
          ticks: { 
            font: {
              size: 11
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Count: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}

function createSeatingChart(seatingCounts) {
  const ctx = document.getElementById('chart-seating');
  const labels = ['Sidewalk', 'Roadway', 'Hybrid'];
  const colors = ['#4a90e2', '#e74c3c', '#2ecc71']; // Blue, Red, Green

  window.seatingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Cafes',
        data: [
          seatingCounts.Sidewalk || 0,
          seatingCounts.Roadway || 0,
          seatingCounts.Hybrid || 0
        ],
        backgroundColor: colors,
        borderColor: Array(3).fill('transparent'),
        borderWidth: Array(3).fill(0),
        hoverBackgroundColor: colors,
        hoverBorderWidth: 2,
        hoverBorderColor: '#000000'
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
              return `Number of cafes: ${context.raw}`;
            }
          }
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

// Function to update restaurant details in the info panel
function updateRestaurantDetails(properties) {
  const detailsContainer = document.getElementById('restaurant-details');
  detailsContainer.className = 'details-section';
  
  const statusClass = properties.LIC_STATUS === 'Active' ? 'active' : 'inactive';
  
  detailsContainer.innerHTML = `
    <div class="restaurant-header">
      <h3>Restaurant Details</h3>
      <span class="status ${statusClass}">${properties.LIC_STATUS}</span>
    </div>
    <div class="restaurant-name">
      <i class="fas fa-utensils"></i>
      ${properties.BUSINESS_NAME || 'N/A'}
    </div>
    <div class="restaurant-address">
      <i class="fas fa-map-marker-alt"></i>
      ${properties.BUILDING || ''} ${properties.STREET || ''}
    </div>
    <div class="restaurant-address2">
        <i class="fas fa-building"></i>
      ${properties.BUSINESS_NAME2 || 'N/A'}
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label"><i class="fas fa-id-card"></i> Resto Inspection ID</span>
        <span class="value">${properties.APP_ID || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-calendar-check"></i> Inspected On</span>
        <span class="value">${properties.InspectedOn || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-chair"></i> Seating Interest</span>
        <span class="value">${properties.SeatingInterest || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-file-alt"></i> Food Service Permit</span>
        <span class="value">${properties.FoodServiceEstablishmentPermit || 'N/A'}</span>
      </div>

      <h4 style="grid-column: 1 / -1; margin: 15px 0 5px 0; color: #1a1a1a; font-size: 16px;">Sidewalk</h4>
      <div class="info-item">
        <span class="label"><i class="fas fa-check-circle"></i> Sidewalk Compliant</span>
        <span class="value">${properties.IsSidewayCompliant || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-check"></i> Sidewalk Seating Approved</span>
        <span class="value">${properties.ApprovedForSidewalkSeating || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler"></i> Sidewalk Length</span>
        <span class="value">${properties['Sidewalk Dimensions (Length)'] || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler"></i> Sidewalk Width</span>
        <span class="value">${properties['Sidewalk Dimensions (Width)'] || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler-combined"></i> Sidewalk Area</span>
        <span class="value">${properties['Sidewalk Dimensions (Area)'] || 'N/A'}</span>
      </div>

      <h4 style="grid-column: 1 / -1; margin: 15px 0 5px 0; color: #1a1a1a; font-size: 16px;">Roadway</h4>
      <div class="info-item">
        <span class="label"><i class="fas fa-check-circle"></i> Roadway Compliant</span>
        <span class="value">${properties.IsRoadwayCompliant || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-check"></i> Roadway Seating Approved</span>
        <span class="value">${properties.ApprovedForRoadwaySeating || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler"></i> Roadway Length</span>
        <span class="value">${properties['Roadway Dimensions (Length)'] || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler"></i> Roadway Width</span>
        <span class="value">${properties['Roadway Dimensions (Width)'] || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label"><i class="fas fa-ruler-combined"></i> Roadway Area</span>
        <span class="value">${properties['Roadway Dimensions (Area)'] || 'N/A'}</span>
      </div>
    </div>
  `;
}

// Function to reset restaurant details to placeholder
function resetRestaurantDetails() {
  const detailsContainer = document.getElementById('restaurant-details');
  detailsContainer.className = 'details-section placeholder';
  
  detailsContainer.innerHTML = `
    <h3><i class="fas fa-utensils"></i> Restaurant Details</h3>
    <i class="fas fa-hand-pointer"></i>
    <p>Hover or click on a marker to see restaurant details</p>
  `;
}

// Function to handle legend bar interactions
function setupLegendInteractions() {
  const legendBars = document.querySelectorAll('.legend-bar');
  legendBars.forEach((bar, index) => {
    bar.addEventListener('mouseenter', () => {
      const minSqft = [0, 100, 300, 500, 700][index];
      const maxSqft = [100, 300, 500, 700, Infinity][index];
      window.highlightMarkersBySize(minSqft, maxSqft);
    });

    bar.addEventListener('mouseleave', () => {
      window.resetMarkerHighlights();
    });
  });
}

// Function to handle chart interactions
function setupChartInteractions() {
  const histogram = document.getElementById('chart-histogram');

  // Histogram interaction
  if (histogram) {
    histogram.addEventListener('mousemove', (e) => {
      if (!window.histogramChart) return;
      
      const points = window.histogramChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
      if (points.length > 0) {
        const index = points[0].index;
        const minSqft = [0, 100, 300, 500, 700][index];
        const maxSqft = [100, 300, 500, 700, Infinity][index];
        window.highlightMarkersBySize(minSqft, maxSqft);
      }
    });

    histogram.addEventListener('mouseleave', () => {
      window.resetMarkerHighlights();
    });
  }
}

// Sidewalk visualization functions
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
  if (widthHistogramChart) {
    if (!widthHistogramChart.originalColors) {
      widthHistogramChart.originalColors = [...widthHistogramChart.data.datasets[0].backgroundColor];
    }
    
    widthHistogramChart.data.datasets[0].borderColor = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    widthHistogramChart.data.datasets[0].borderWidth = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? 2 : 0
    );
    
    widthHistogramChart.update();
  }
}

function highlightWidthRange(width) {
  const category = getWidthCategory(width);
  
  if (widthHistogramChart) {
    if (!widthHistogramChart.originalColors) {
      widthHistogramChart.originalColors = [...widthHistogramChart.data.datasets[0].backgroundColor];
    }
    
    widthHistogramChart.data.datasets[0].borderColor = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? '#000000' : 'transparent'
    );
    widthHistogramChart.data.datasets[0].borderWidth = widthHistogramChart.originalColors.map((_, i) => 
      i === category ? 2 : 0
    );
    
    widthHistogramChart.update();
  }
}

function resetSidewalkHighlights() {
  document.querySelectorAll('.legend-bar').forEach(bar => {
    bar.classList.remove('highlighted');
  });
  
  if (widthHistogramChart) {
    widthHistogramChart.data.datasets[0].borderColor = Array(6).fill('transparent');
    widthHistogramChart.data.datasets[0].borderWidth = Array(6).fill(0);
    widthHistogramChart.update();
  }
}

function processSidewalkDataForCharts(geojson) {
  const areas = [];
  const widths = [];

  geojson.features.forEach(feature => {
    const a = parseFloat(feature.properties.SHAPE_Area);
    const l = parseFloat(feature.properties.SHAPE_Leng);
    if (!isNaN(a) && !isNaN(l)) {
      areas.push(a);
      const width = a/l;
      widths.push(width);
    }
  });

  createSidewalkHistogram(areas);
  createWidthHistogram(widths);
}

function createSidewalkHistogram(areas) {
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

  const ctx = document.getElementById('sidewalk-histogram');
  if (!ctx) return;

  widthHistogramChart = new Chart(ctx, {
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
        legend: { display: false },
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
            font: { size: 11 }
          },
          beginAtZero: true,
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        x: {
          title: {
            display: true,
            text: 'Sidewalk Area (sq ft)',
            color: '#666',
            font: { size: 11 }
          },
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

function createWidthHistogram(widths) {
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

  const ctx = document.getElementById('sidewalk-width-histogram');
  if (!ctx) return;

  widthHistogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins,
      datasets: [{
        label: 'Number of Sidewalks',
        data: counts,
        backgroundColor: [
          '#e5f5e0',
          '#c7e9c0',
          '#a1d99b',
          '#74c476',
          '#41ab5d',
          '#238b45'
        ],
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
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Sidewalks',
            color: '#666',
            font: { size: 11 }
          },
          ticks: { 
            color: '#666',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.1)', drawTicks: false, drawBorder: false }
        },
        x: {
          title: {
            display: true,
            text: 'Width (feet)',
            color: '#666',
            font: { size: 11 }
          },
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

// ... existing code ...