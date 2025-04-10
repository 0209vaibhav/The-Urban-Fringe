// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiMDIwOXZhaWJoYXYiLCJhIjoiY2x6cW4xY2w5MWswZDJxcHhreHZ2OG5mbSJ9.ozamGsW5CZrZdL5bG7n_0A';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/0209vaibhav/cm86orke900fn01qv4s7u9gwl',
    center: [10, 30], // Center is less relevant when using fitBounds immediately
    // zoom: 1.8, // Initial zoom will be set by fitBounds
    maxZoom: 4,
    // minZoom: 1.5, // minZoom will be set dynamically after fitBounds
    preserveDrawingBuffer: true,
    maxBounds: [ // Update these bounds to match the desired visible area
        [-180, -55], // Southwest coordinates
        [180, 70]  // Northeast coordinates
    ],
    renderWorldCopies: false, // Keep false to prevent repeating world
    fitBoundsOptions: { // Default padding for fitBounds calls if not specified
        padding: 0
    }
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// City data with additional info and color coding
const cities = [
    // Highlighted in magenta -> Changed to black
    { name: 'Amsterdam', coordinates: [52.3676, 4.9041], color: 'black',  country: 'Netherlands', continent: 'Europe', population: '872,680', footprint: '4,743 km²' },
    { name: 'Barcelona', coordinates: [41.3851, 2.1734], color: 'black',  country: 'Spain', continent: 'Europe', population: '1,620,343', footprint: '101 km²' },
    { name: 'Berlin', coordinates: [52.5200, 13.4050], color: 'black',  country: 'Germany', continent: 'Europe', population: '3,769,495', footprint: '891.8 km²' },
    { name: 'Buenos Aires', coordinates: [-34.6037, -58.3816], color: 'black',  country: 'Argentina', continent: 'South America', population: '2,891,000', footprint: '203 km²' },
    { name: 'Copenhagen', coordinates: [55.6761, 12.5683], color: 'black',  country: 'Denmark', continent: 'Europe', population: '794,128', footprint: '86.2 km²' },
    { name: 'Hong Kong', coordinates: [22.3193, 114.1694], color: 'black',  country: 'China', continent: 'Asia', population: '7,500,700', footprint: '1,104 km²' },
    { name: 'Istanbul', coordinates: [41.0082, 28.9784], color: 'black',  country: 'Turkey', continent: 'Asia', population: '15,067,724', footprint: '5,343 km²' },
    { name: 'Milan', coordinates: [45.4642, 9.1900], color: 'black',  country: 'Italy', continent: 'Europe', population: '1,396,000', footprint: '181 km²' },
    { name: 'Mumbai', coordinates: [19.0760, 72.8777], color: 'black',  country: 'India', continent: 'Asia', population: '12,478,447', footprint: '603 km²' },
    { name: 'Paris', coordinates: [48.8566, 2.3522], color: 'black',  country: 'France', continent: 'Europe', population: '2,165,423', footprint: '105 km²' },
    { name: 'Sao Paolo', coordinates: [-23.5505, -46.6333], color: 'black',  country: 'Brazil', continent: 'South America', population: '11,253,503', footprint: '1,521 km²' },
    { name: 'Tokyo', coordinates: [35.6824, 139.7590], color: 'black',  country: 'Japan', continent: 'Asia', population: '14,043,000', footprint: '2,194 km²' },

    // Additional cities in black
    { name: 'New York City', coordinates: [40.7128, -74.0060], color: 'black', country: 'USA', continent: 'North America', population: '8,336,817', footprint: '789 km²' },
    { name: 'San Francisco', coordinates: [37.7749, -122.4194], color: 'black', country: 'USA', continent: 'North America', population: '881,549', footprint: '121 km²' },
    { name: 'Toronto', coordinates: [43.6510, -79.3470], color: 'black', country: 'Canada', continent: 'North America', population: '2,731,571', footprint: '630 km²' },
    { name: 'Los Angeles', coordinates: [34.0522, -118.2437], color: 'black', country: 'USA', continent: 'North America', population: '3,898,747', footprint: '1,302 km²' },
    { name: 'Chicago', coordinates: [41.8781, -87.6298], color: 'black', country: 'USA', continent: 'North America', population: '2,746,388', footprint: '606 km²' },
    { name: 'Vancouver', coordinates: [49.2827, -123.1207], color: 'black', country: 'Canada', continent: 'North America', population: '631,486', footprint: '115 km²' },
    { name: 'Seattle', coordinates: [47.6062, -122.3321], color: 'black', country: 'USA', continent: 'North America', population: '724,745', footprint: '217 km²' },
    { name: 'Boston', coordinates: [42.3601, -71.0589], color: 'black', country: 'USA', continent: 'North America', population: '692,600', footprint: '125 km²' },
    { name: 'Washington D.C.', coordinates: [38.9072, -77.0369], color: 'black', country: 'USA', continent: 'North America', population: '705,749', footprint: '177 km²' },
    { name: 'Montreal', coordinates: [45.5017, -73.5673], color: 'black', country: 'Canada', continent: 'North America', population: '1,704,694', footprint: '431 km²' },
    { name: 'London', coordinates: [51.5074, -0.1278], color: 'black', country: 'UK', continent: 'Europe', population: '8,982,965', footprint: '1,572 km²' },
    { name: 'Madrid', coordinates: [40.4168, -3.7038], color: 'black', country: 'Spain', continent: 'Europe', population: '6,661,949', footprint: '604 km²' },
    { name: 'Rome', coordinates: [41.9028, 12.4964], color: 'black', country: 'Italy', continent: 'Europe', population: '2,860,009', footprint: '1,285 km²' },
    { name: 'Vienna', coordinates: [48.2082, 16.3738], color: 'black', country: 'Austria', continent: 'Europe', population: '1,911,191', footprint: '414.6 km²' },
    { name: 'Brussels', coordinates: [50.8503, 4.3517], color: 'black', country: 'Belgium', continent: 'Europe', population: '1,212,000', footprint: '161 km²' },
    { name: 'Lisbon', coordinates: [38.7223, -9.1393], color: 'black', country: 'Portugal', continent: 'Europe', population: '505,526', footprint: '84.8 km²' },
    { name: 'Dublin', coordinates: [53.3331, -6.2489], color: 'black', country: 'Ireland', continent: 'Europe', population: '1,169,000', footprint: '115 km²' },
    { name: 'Shanghai', coordinates: [31.2304, 121.4737], color: 'black', country: 'China', continent: 'Asia', population: '24,153,000', footprint: '6,340 km²' },
    { name: 'Singapore', coordinates: [1.3521, 103.8198], color: 'black', country: 'Singapore', continent: 'Asia', population: '5,637,000', footprint: '728.6 km²' },
    { name: 'Seoul', coordinates: [37.5665, 126.9780], color: 'black', country: 'South Korea', continent: 'Asia', population: '9,733,000', footprint: '605 km²' },
    { name: 'Bangkok', coordinates: [13.7563, 100.5018], color: 'black', country: 'Thailand', continent: 'Asia', population: '8,281,000', footprint: '1,568 km²' },
    { name: 'Delhi', coordinates: [28.6139, 77.2090], color: 'black', country: 'India', continent: 'Asia', population: '31,000,000', footprint: '1,484 km²' },
    { name: 'Kuala Lumpur', coordinates: [3.139, 101.6869], color: 'black', country: 'Malaysia', continent: 'Asia', population: '1,808,000', footprint: '243 km²' },
    { name: 'Jakarta', coordinates: [-6.2088, 106.8456], color: 'black', country: 'Indonesia', continent: 'Asia', population: '10,562,000', footprint: '662 km²' },
    { name: 'Taipei', coordinates: [25.0330, 121.5654], color: 'black', country: 'Taiwan', continent: 'Asia', population: '2,646,000', footprint: '272 km²' },
    { name: 'Rio de Janeiro', coordinates: [-22.9068, -43.1729], color: 'black', country: 'Brazil', continent: 'South America', population: '6,750,000', footprint: '1,255 km²' },
    { name: 'Santiago', coordinates: [-33.4489, -70.6693], color: 'black', country: 'Chile', continent: 'South America', population: '5,610,000', footprint: '641 km²' },
    { name: 'Lima', coordinates: [-12.0464, -77.0428], color: 'black', country: 'Peru', continent: 'South America', population: '9,751,000', footprint: '2,674 km²' },
    { name: 'Cape Town', coordinates: [-33.9249, 18.4241], color: 'black', country: 'South Africa', continent: 'Africa', population: '4,710,000', footprint: '400 km²' },
    { name: 'Johannesburg', coordinates: [-26.2041, 28.0473], color: 'black', country: 'South Africa', continent: 'Africa', population: '5,822,000', footprint: '1,645 km²' },
    { name: 'Lagos', coordinates: [6.5244, 3.3792], color: 'black', country: 'Nigeria', continent: 'Africa', population: '14,368,000', footprint: '1,171 km²' },
    { name: 'Nairobi', coordinates: [-1.2864, 36.8172], color: 'black', country: 'Kenya', continent: 'Africa', population: '4,397,073', footprint: '696 km²' },
    { name: 'Accra', coordinates: [5.6037, -0.1870], color: 'black', country: 'Ghana', continent: 'Africa', population: '2,201,863', footprint: '225 km²' },
    { name: 'Sydney', coordinates: [-33.8688, 151.2093], color: 'black', country: 'Australia', continent: 'Australia', population: '5,312,000', footprint: '12,368 km²' },
    { name: 'Melbourne', coordinates: [-37.8136, 144.9631], color: 'black', country: 'Australia', continent: 'Australia', population: '5,078,000', footprint: '9,990 km²' },
    { name: 'Auckland', coordinates: [-36.8481, 174.7625], color: 'black', country: 'New Zealand', continent: 'Oceania', population: '1,657,200', footprint: '1,086 km²' },
    { name: 'Wellington', coordinates: [-41.2865, 174.7762], color: 'black', country: 'New Zealand', continent: 'Oceania', population: '431,200', footprint: '290 km²' },
    { name: 'Dubai', coordinates: [25.2769, 55.2962], color: 'black', country: 'United Arab Emirates', continent: 'Asia', population: '3,490,000', footprint: '4,114 km²' },
    { name: 'Tel Aviv', coordinates: [32.0853, 34.7818], color: 'black', country: 'Israel', continent: 'Asia', population: '451,523', footprint: '52 km²' },
    { name: 'Doha', coordinates: [25.2760, 51.5200], color: 'black', country: 'Qatar', continent: 'Asia', population: '1,945,000', footprint: '132 km²' }
];

// Wait for map style to load before adding markers
map.on('style.load', () => {
    // Define the target bounds
    const targetBounds = [
        [-180, -55],
        [180, 70]
    ];

    // Fit the map to the target bounds immediately
    map.fitBounds(targetBounds, {
        padding: 0,
        duration: 0,
        linear: true
    });

    // Set the minZoom AFTER the fitBounds operation completes
    map.once('zoomend', () => {
        const currentZoom = map.getZoom();
        map.setMinZoom(currentZoom);
    });

    // Convert cities data to GeoJSON
    const geojsonData = {
        type: 'FeatureCollection',
        features: cities.map(city => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [city.coordinates[1], city.coordinates[0]]
            },
            properties: {
                name: city.name,
                color: city.color,
                country: city.country,
                continent: city.continent,
                population: city.population,
                footprint: city.footprint
            }
        }))
    };

    // Add the cities source
    map.addSource('cities', {
        type: 'geojson',
        data: geojsonData
    });

    // ADD single layer for all city points with consistent style
    map.addLayer({
        id: 'city-points',
        type: 'circle',
        source: 'cities',
        paint: {
            'circle-radius': 8,
            'circle-color': 'black',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    // ADD single layer for all city labels with consistent style
    map.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'cities',
        layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, 0.8],
            'text-anchor': 'top',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
            'text-allow-overlap': false,
            'text-ignore-placement': false
        },
        paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
        }
    });

    // Update popups to use the single layer ID
    map.on('click', 'city-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = `
            <b>${properties.name}</b><br>
            Country: ${properties.country}<br>
            Continent: ${properties.continent}<br>
            Population: ${properties.population}<br>
            Footprint: ${properties.footprint}
        `;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    });

    // Update hover effects to use the single layer ID
    map.on('mouseenter', 'city-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'city-points', () => {
        map.getCanvas().style.cursor = '';
    });
});