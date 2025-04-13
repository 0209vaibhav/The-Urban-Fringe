// Arrays to store photo paths
const enclosedPhotos = [
    'enclosed/busy-outdoor-restaurant-during-covid-outbreak-restaurants-started-serving-meals-outdoors-due-to-pandemic-dining-rules-2F9HF63.jpg',
    'enclosed/img-0277-2.jpg',
    'enclosed/img-9379.jpeg',
    'enclosed/judys-roadway-1024x768.jpeg',
    'enclosed/mid_x2.jpeg',
    'enclosed/new-york-city-april-18-2021-an-outdoor-restaurant-during-covid-outbreak-restaurants-started-serving-meals-outdoors-due-to-pandemic-dining-rules-2F9H.jpg',
    'enclosed/new-york-city-april-18-2021-busy-outdoor-restaurant-during-covid-outbreak-restaurants-started-serving-meals-outdoors-due-to-pandemic-dining-rule (1).jpg',
    'enclosed/new-york-city-april-18-2021-busy-outdoor-restaurant-during-covid-outbreak-restaurants-started-serving-meals-outdoors-due-to-pandemic-dining-rules-2F.jpg',
    'enclosed/new-york-city-usa-october-3-20-2020-outdoor-dining-after-re-opening-from-lock-down-in-manhattan-new-york-city-2D1ATAT.jpg',
    'enclosed/new-york-ny-usa-september-19-2020-busy-outdoor-restaurant-in-east-village-manhattan-covid-outdoor-dining-2CT875X.jpg',
    'enclosed/new-york-usa-october-3-2020-an-empty-outdoor-restaurant-in-downtown-manhattan-covid-outdoor-dining-2D1ATXR.jpg',
    'enclosed/new-york-usa-october-10-2020-an-outdoor-restaurant-in-midtown-manhattan-covid-outdoor-dining-2D4XJ65.jpg',
    'enclosed/new-york-usa-october-15-2020-an-outdoor-restaurant-in-downtown-manhattan-phase-4-reopening-of-the-corona-virus-pandemic-2D6FK13.jpg',
    'enclosed/outdoor-dining-due-to-coronavirus-restrictions-in-new-york-city-2F309X4.jpg',
    'enclosed/outdoor-dining-huts-in-korean-town-32th-street-during-covid-19-pandemic-manhattannew-york-cityusa-2H169FG.jpg',
    'enclosed/restaurant-row-west-46th-street-nyc-usa-J3P42D.jpg',
    'enclosed/ROADWAY-CAFE--1024x536.jpeg',
    'enclosed/SIDEWALK-CAFE--1024x536.jpeg',
    'enclosed/sidewalk-dining-tables-and-a-dining-booth-in-the-street-set-up-by-the-garden-cafe-restaurant-to-comply-with-covid-19-or-coronavirus-regulations-in-n.jpg'

    // Add more enclosed photos as needed
];

const unenclosedPhotos = [
    'unenclosed/5ef261924dca6819ad620b53.jpeg',
    'unenclosed/a-dining-booth-in-the-street-set-up-by-the-garden-cafe-restaurant-in-inwood-to-comply-with-covid-19-or-coronavirus-regulations-in-nyc-2CW5JFP.jpg',
    'unenclosed/after-work-at-stone-street-with-its-many-restaurants-outdoor-dining-and-beer-garden-in-lower-manhattans-financial-district-new-york-2JJ4PRT.jpg',
    'unenclosed/bakery-and-outdoor-cafe-greenwich-village-new-york-city-BAYFKW.jpg',
    'unenclosed/chinatown-mott-street.jpeg',
    'unenclosed/diners-eating-at-outdoor-sidewalk-tables-set-up-by-a-restaurant-in-inwood-new-york-to-comply-with-covid-restrictions-on-restaurants-2CW5JFK.jpg',
    'unenclosed/doyers-street-open-restaurants.jpeg',
    'unenclosed/Dumbo-outdoor-dining-bridge.jpeg',
    'unenclosed/dumbo-outdoor-dining.jpeg',
    'unenclosed/estrellita-poblana-III-Little-Italy-Arthur-Avenue.jpeg',
    'unenclosed/il-Patio-di-Eataly.jpeg',
    'unenclosed/img-0541_orig.jpeg',
    'unenclosed/img-9337_orig.jpeg',
    'unenclosed/img-9338_orig.jpeg',
    'unenclosed/Katzs-Deli.jpeg',
    'unenclosed/LES-broome-street.jpeg',
    'unenclosed/manhattan-upper-east-side-second-avenue-old-apartment-buildings-and-ethnic-restaurants-2J75G7E.jpg',
    'unenclosed/Marios-Little-Italy-Arthur-Avenue.jpeg',
    'unenclosed/mulberry-street-in-little-italy-district-lower-manhattan-new-york-usa-2T0KD48.jpg',
    'unenclosed/neirs-outdoor-dining-2.jpeg',
    'unenclosed/Neirs-outdoor-dining-e1594322916114.jpeg',
    'unenclosed/new-york-city-usa-october-3-20-2020-outdoor-dining-after-re-opening-from-lock-down-in-manhattan-new-york-city-2D1ATA2.jpg',
    'unenclosed/new-york-cityny-nyc-manhattanmeatpacking-district-neighborhood675-HACD5K.jpg',
    'unenclosed/new-york-cityny-nyc-manhattanupper-west-sideella-kitchen-barrestaurant-HACD58.jpg',
    'unenclosed/new-york-cityny-nyc-manhattanwest-villageolio-e-piuitalianrestaurant-H4F52T.jpg',
    'unenclosed/new-york-cityny-nycmanhattanwest-villageolio-e-piuitalianrestaurant-H4F52Y.jpg',
    'unenclosed/new-york-ny-june-26-2020-a-parklet-outside-an-east-village-restaurant-on-avenue-a-for-socially-distanced-outdoor-dining-under-phase-2-reopening-of-n.jpg',
    'unenclosed/new-york-usa-october-10-2020-an-outdoor-restaurant-in-midtown-manhattan-covid-outdoor-dining-2D4XJBG.jpg',
    'unenclosed/new-york-usa-october-15-2020-an-empty-outdoor-restaurant-in-downtown-manhattan-covid-outdoor-dining-2D6FK0R.jpg',
    'unenclosed/new-york-usa-october-15-2020-an-empty-outdoor-restaurant-in-downtown-manhattan-covid-outdoor-dining-2F374XX.jpg',
    'unenclosed/new-york-usa-october-15-2020-an-outdoor-restaurant-in-downtown-manhattan-covid-outdoor-dining-2D6FK0H.jpg',
    'unenclosed/restaurant-on-greenwich-street-tribeca-manhattan-new-york-city-B0E6AC.jpg',
    'unenclosed/restaurant-row-times-square-outdoor-dining-1.jpeg',
    'unenclosed/restaurant-row-times-square-outdoor-dining-2.jpeg',
    'unenclosed/sylvias-soul-food-restaurant-harlem-new-york-city-manhattan-usa-D9982B.jpg',
    'unenclosed/view-of-ristorante-da-gennaro-a-popular-restaurant-in-mulberry-street-in-the-little-italy-district-of-lower-manhattan-new-york-city-usa-W873K9.jpg'
    // Add more unenclosed photos as needed
];

// Combine both arrays
const allPhotos = [...enclosedPhotos, ...unenclosedPhotos];
let currentPhotos = [];

// Function to get random position within container
function getRandomPosition() {
    const container = document.getElementById('photoContainer');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    return {
        x: Math.random() * (containerWidth - 300), // 300 is max-width of photos
        y: Math.random() * (containerHeight - 300) // 300 is max-height of photos
    };
}

// Function to show a single photo
function showPhoto(index) {
    const container = document.getElementById('photoContainer');
    const photoPath = allPhotos[index];
    
    const img = document.createElement('img');
    img.src = photoPath;
    img.className = 'photo';
    
    const position = getRandomPosition();
    img.style.left = `${position.x}px`;
    img.style.top = `${position.y}px`;
    
    container.appendChild(img);
    currentPhotos.push(img);
    
    // Trigger animation
    setTimeout(() => {
        img.classList.add('visible');
    }, 100);
}

// Function to hide a single photo
function hidePhoto(index) {
    if (currentPhotos[index]) {
        currentPhotos[index].classList.remove('visible');
        setTimeout(() => {
            if (currentPhotos[index]) {
                currentPhotos[index].remove();
            }
        }, 1000); // Wait for fade out animation
    }
}

// Function to start the animation cycle
function startAnimation() {
    let currentIndex = 0;
    
    // Function to show photos one by one
    function showPhotos() {
        if (currentIndex < allPhotos.length) {
            showPhoto(currentIndex);
            currentIndex++;
            setTimeout(showPhotos, 1000); // Show next photo after 1 second
        } else {
            // All photos shown, start hiding them
            currentIndex = 0;
            setTimeout(hidePhotos, 2000); // Wait 2 seconds before starting to hide
        }
    }
    
    // Function to hide photos one by one
    function hidePhotos() {
        if (currentIndex < currentPhotos.length) {
            hidePhoto(currentIndex);
            currentIndex++;
            setTimeout(hidePhotos, 1000); // Hide next photo after 1 second
        } else {
            // All photos hidden, clear array and start over
            currentPhotos = [];
            currentIndex = 0;
            setTimeout(showPhotos, 1000); // Start showing photos again after 1 second
        }
    }
    
    // Start the cycle
    showPhotos();
}

// Start the animation when the page loads
window.addEventListener('load', startAnimation);
