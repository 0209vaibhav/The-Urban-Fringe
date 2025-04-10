// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Initialize the map centered on NYC
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-74.0060, 40.7128],
    zoom: 10, // Adjusted default zoom level
    maxZoom: 15,
    minZoom: 8,
    preserveDrawingBuffer: true
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Load and add borough GeoJSON
map.on('load', () => {
    fetch('nybb_25a/nybb.geojson') // Make sure nybb.geojson is in the same folder
        .then(response => {
            if (!response.ok) throw new Error("Failed to load GeoJSON.");
            return response.json();
        })
        .then(data => {
            map.addSource('nyc-boundary', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: 'nyc-borough-fill',
                type: 'fill',
                source: 'nyc-boundary',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'borocode'],
                        '1', '#ff007f',      // Manhattan
                        '2', '#0080ff',      // Bronx
                        '3', '#ff7f00',      // Brooklyn
                        '4', '#80ff00',      // Queens
                        '5', '#8000ff',      // Staten Island
                        '#cccccc'            // Default/Other
                    ],
                    'fill-opacity': 0.7,
                    'fill-outline-color': '#000000'
                }
            });

            // Interactivity
            map.on('click', 'nyc-borough-fill', (e) => {
                const properties = e.features[0].properties;
                const coordinates = e.lngLat;
                const popupContent = `<b>${properties.boroname}</b>`;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);
            });

            map.on('mouseenter', 'nyc-borough-fill', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'nyc-borough-fill', () => {
                map.getCanvas().style.cursor = '';
            });
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            alert('Could not load NYC boroughs. Check console for more info.');
        });
});
