// sidewalk_cafes_map.js

// Open Restaurants Map
mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

document.getElementById('map').style.height = '100%';

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
    const response = await fetch('Cleaned_Open_Restaurant_Applications__Historic__20250408.geojson');
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
    let currentPopup = null;

    map.on('mouseenter', 'restaurants-layer', (e) => {
      if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const properties = feature.properties;
        
        // Remove existing popup if any
        if (currentPopup) {
          currentPopup.remove();
        }
        
        // Create detailed popup content
        const popupContent = `
          <div style="max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${properties.restaurant_name || 'Unnamed Restaurant'}</h3>
            <p style="margin: 0 0 8px 0;">
              <strong>Address:</strong> ${properties.street || 'Address not available'}<br>
              <strong>Borough:</strong> ${properties.borough || 'Borough not available'}<br>
              <strong>Seating Type:</strong> ${properties.seating_type || 'Seating type not available'}<br>
              <strong>Sidewalk Approved:</strong> ${properties.approved_sidewalk || 'Not available'}<br>
              <strong>Roadway Approved:</strong> ${properties.approved_roadway || 'Not available'}<br>
              <strong>Neighborhood:</strong> ${properties.nta || 'Not available'}
            </p>
          </div>
        `;

        currentPopup = new mapboxgl.Popup()
          .setLngLat(coords)
          .setHTML(popupContent)
          .addTo(map);
      }
    });

    map.on('mouseleave', 'restaurants-layer', () => {
      map.getCanvas().style.cursor = '';
      if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
    });
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
  }
}

map.on('load', loadRestaurantsData);
