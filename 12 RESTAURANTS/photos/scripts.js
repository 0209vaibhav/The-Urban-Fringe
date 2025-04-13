// Global variable to store image data
let imageData = null;

// Function to load image data
async function loadImageData() {
  if (!imageData) {
    try {
      const response = await fetch('image_data.json');
      if (!response.ok) {
        throw new Error('Failed to load image data');
      }
      imageData = await response.json();
    } catch (error) {
      console.error('Error loading image data:', error);
      imageData = {};
    }
  }
  return imageData;
}

// Function to get available years for a restaurant
async function getYearsForRestaurant(restaurantName) {
  console.log(`Checking years for restaurant: ${restaurantName}`);
  const data = await loadImageData();
  const restaurant = data[restaurantName];
  
  if (!restaurant) {
    console.error(`No data found for restaurant: ${restaurantName}`);
    return [];
  }
  
  const years = restaurant.images.map(img => img.year);
  console.log(`Found years for ${restaurantName}:`, years);
  return years;
}

// Function to get all available years across all restaurants
async function getAvailableYears(gridItems) {
  console.log('Getting available years for all restaurants');
  const allYears = new Set();
  const data = await loadImageData();
  
  for (const item of gridItems) {
    const restaurantName = item.getAttribute('data-restaurant');
    console.log(`Processing restaurant: ${restaurantName}`);
    const years = await getYearsForRestaurant(restaurantName);
    years.forEach(year => allYears.add(year));
  }
  
  const yearsArray = Array.from(allYears).sort((a, b) => a - b);
  console.log('Available years:', yearsArray);
  return yearsArray;
}

// Function to get the last available year for a restaurant
async function getLastAvailableYear(restaurantName, targetYear) {
  const data = await loadImageData();
  const restaurant = data[restaurantName];
  
  if (!restaurant) {
    console.error(`No images found for ${restaurantName}`);
    return null;
  }
  
  const years = restaurant.images.map(img => img.year);
  if (years.length === 0) {
    console.error(`No images found for ${restaurantName}`);
    return null;
  }
  
  // Find the closest year that is less than or equal to the target year
  const availableYears = years.filter(year => year <= targetYear);
  if (availableYears.length === 0) {
    // If no years are available before the target year, use the earliest available year
    return Math.min(...years);
  }
  
  // Return the most recent available year
  return Math.max(...availableYears);
}

// Function to get image path for a restaurant and year
async function getImagePath(restaurantName, year) {
  const data = await loadImageData();
  const restaurant = data[restaurantName];
  
  if (!restaurant) {
    console.error(`No data found for restaurant: ${restaurantName}`);
    return null;
  }
  
  const image = restaurant.images.find(img => img.year === year);
  return image ? image.path : null;
}

// Function to update images
async function updateImages(selectedYear, gridItems) {
  console.log(`Updating images for year: ${selectedYear}`);
  const transitionPromises = [];

  for (const item of gridItems) {
    const restaurantName = item.getAttribute('data-restaurant');
    const img = item.querySelector('img');
    
    // Get the last available year for this restaurant
    const lastAvailableYear = await getLastAvailableYear(restaurantName, selectedYear);
    if (!lastAvailableYear) {
      console.error(`No available images found for ${restaurantName}`);
      continue;
    }

    const imagePath = await getImagePath(restaurantName, lastAvailableYear);
    if (!imagePath) {
      console.error(`No image path found for ${restaurantName} in year ${lastAvailableYear}`);
      continue;
    }

    const imageUrl = `/12%20RESTAURANTS/photos/${imagePath}`;
    console.log(`Updating image for ${restaurantName}: ${imageUrl} (using year ${lastAvailableYear})`);
    
    // Create a promise for this image transition
    const transitionPromise = new Promise((resolve) => {
      // Create container for the transition
      const transitionContainer = document.createElement('div');
      transitionContainer.style.position = 'absolute';
      transitionContainer.style.top = '0';
      transitionContainer.style.left = '0';
      transitionContainer.style.width = '100%';
      transitionContainer.style.height = '100%';
      transitionContainer.style.overflow = 'hidden';
      item.appendChild(transitionContainer);

      // Create new image element
      const newImg = new Image();
      newImg.src = imageUrl;
      newImg.alt = restaurantName;
      
      // Preload the image
      newImg.onload = function() {
        console.log(`Image loaded successfully: ${imageUrl}`);
        
        // Style the new image
        newImg.style.position = 'absolute';
        newImg.style.top = '0';
        newImg.style.left = '0';
        newImg.style.width = '100%';
        newImg.style.height = '100%';
        newImg.style.objectFit = 'cover';
        newImg.style.opacity = '0';
        newImg.style.transform = 'scale(1.02)';
        newImg.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        transitionContainer.appendChild(newImg);
        
        // Clone the current image for the transition
        const oldImg = img.cloneNode();
        oldImg.style.position = 'absolute';
        oldImg.style.top = '0';
        oldImg.style.left = '0';
        oldImg.style.width = '100%';
        oldImg.style.height = '100%';
        oldImg.style.objectFit = 'cover';
        oldImg.style.opacity = '1';
        oldImg.style.transform = 'scale(1)';
        oldImg.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        transitionContainer.appendChild(oldImg);
        
        // Start the transition
        requestAnimationFrame(() => {
          // Fade out the old image and scale it down slightly
          oldImg.style.opacity = '0';
          oldImg.style.transform = 'scale(0.98)';
          
          // Fade in the new image and scale it to normal
          newImg.style.opacity = '1';
          newImg.style.transform = 'scale(1)';
          
          // After transition, update the main image and clean up
          setTimeout(() => {
            img.src = imageUrl;
            img.style.opacity = '1';
            item.removeChild(transitionContainer);
            resolve();
          }, 300);
        });
      };
      
      // Handle image loading errors
      newImg.onerror = function() {
        console.error(`Failed to load image: ${imageUrl}`);
        item.removeChild(transitionContainer);
        resolve();
      };
    });
    
    transitionPromises.push(transitionPromise);
  }
  
  // Wait for all transitions to complete
  await Promise.all(transitionPromises);
}

// Function to create year labels
async function createYearLabels(years, yearLabels, yearSlider) {
  console.log('Creating year labels for years:', years);
  
  yearLabels.innerHTML = ''; // Clear existing labels
  
  // Update slider min/max values
  yearSlider.min = Math.min(...years);
  yearSlider.max = Math.max(...years);
  yearSlider.value = Math.max(...years);
  
  // Calculate the height of the slider track
  const sliderHeight = yearSlider.offsetHeight;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearRange = maxYear - minYear;
  
  // Sort years in ascending order
  const sortedYears = [...years].sort((a, b) => a - b);
  
  sortedYears.forEach(year => {
    const label = document.createElement('div');
    label.className = 'year-label';
    label.textContent = year;
    label.dataset.year = year;
    
    // Calculate the position of the label
    // For vertical slider, we need to invert the position
    // and account for the full height of the slider
    const position = 100 - ((year - minYear) / yearRange) * 100;
    
    // Calculate the position within the available height
    const availableHeight = sliderHeight - 40; // 20px padding on top and bottom
    const adjustedPosition = 20 + (position / 100) * availableHeight;
    
    label.style.top = `${adjustedPosition}px`;
    
    // Add click handler to jump to year
    label.addEventListener('click', () => {
      yearSlider.value = year;
      updateActiveLabel(year);
      updateImages(year, gridItems);
    });
    
    yearLabels.appendChild(label);
  });
  
  // Initialize active label
  updateActiveLabel(Math.max(...years));
  
  return years;
}

// Function to update active label
function updateActiveLabel(selectedYear) {
  document.querySelectorAll('.year-label').forEach(label => {
    const year = parseInt(label.dataset.year);
    label.classList.toggle('active', year === selectedYear);
  });
}

// Initialize the slider
function initSlider() {
  console.log('Initializing slider...');
  
  const yearSlider = document.getElementById('yearSlider');
  const yearLabels = document.getElementById('yearLabels');
  const gridItems = document.querySelectorAll('.grid-item');

  console.log('Found elements:', {
    yearSlider: !!yearSlider,
    yearLabels: !!yearLabels,
    gridItems: gridItems.length
  });

  if (!yearSlider || !yearLabels || !gridItems.length) {
    console.error('Required elements not found:', {
      yearSlider: !yearSlider,
      yearLabels: !yearLabels,
      gridItems: !gridItems.length
    });
    return;
  }

  // Initialize years and labels
  getAvailableYears(gridItems).then(availableYears => {
    console.log('Setting up slider event listener...');
    
    // Create year labels
    createYearLabels(availableYears, yearLabels, yearSlider);
    
    let isDragging = false;
    let lastUpdateTime = 0;
    const updateInterval = 100; // Update every 100ms during drag
    
    // Update images and labels when slider changes
    yearSlider.addEventListener('input', function() {
      const selectedYear = parseInt(this.value);
      const currentTime = Date.now();
      
      // Throttle updates during drag
      if (isDragging && currentTime - lastUpdateTime < updateInterval) {
        return;
      }
      
      lastUpdateTime = currentTime;
      updateActiveLabel(selectedYear);
      updateImages(selectedYear, gridItems);
    });
    
    // Track drag state
    yearSlider.addEventListener('mousedown', () => {
      isDragging = true;
    });
    
    yearSlider.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    yearSlider.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    // Add click handler for the slider track
    yearSlider.addEventListener('click', (e) => {
      const rect = yearSlider.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percentage = 1 - (y / rect.height); // Invert the percentage for vertical slider
      const minYear = parseInt(yearSlider.min);
      const maxYear = parseInt(yearSlider.max);
      const yearRange = maxYear - minYear;
      const selectedYear = Math.round(minYear + (percentage * yearRange));
      yearSlider.value = selectedYear;
      updateActiveLabel(selectedYear);
      updateImages(selectedYear, gridItems);
    });

    // Initialize images with the latest available year
    const latestYear = Math.max(...availableYears);
    console.log('Initializing with year:', latestYear);
    updateImages(latestYear, gridItems);
  });
}

// Wait for the DOM to be fully loaded
console.log('Waiting for DOM to load...');
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing slider...');
  initSlider();
});
