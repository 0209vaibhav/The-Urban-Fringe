// Arrays to store photo paths
const photos = [
  'Screenshot (289).png',
  'Screenshot (291).png', 
  'Screenshot (292).png',
  'Screenshot (293).png',
  'Screenshot (294).png',
  'Screenshot (295).png',
  'Screenshot (296).png',
  'Screenshot (297).png',
  'Screenshot (298).png'
];

// Use photos array directly instead of combining arrays
const allPhotos = photos;
let currentPhotos = [];

// Grid configuration
const GRID_COLS = 3;
const GRID_ROWS = 3;
let currentGridPositions = [];

// Function to initialize grid positions
function initializeGridPositions() {
    currentGridPositions = [];
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            currentGridPositions.push({
                row: row,
                col: col,
                used: false
            });
        }
    }
}

// Function to get next available grid position
function getNextGridPosition() {
    const availablePositions = currentGridPositions.filter(pos => !pos.used);
    if (availablePositions.length === 0) {
        initializeGridPositions();
        return currentGridPositions[0];
    }
    
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions[randomIndex];
    position.used = true;
    
    const container = document.getElementById('photoContainer');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const cellWidth = containerWidth / GRID_COLS;
    const cellHeight = containerHeight / GRID_ROWS;
    
    // Add some randomness within the cell for natural feel
    const randomOffset = 50; // pixels
    
    return {
        x: position.col * cellWidth + (Math.random() * randomOffset),
        y: position.row * cellHeight + (Math.random() * randomOffset)
    };
}

// Function to show a single photo
function showPhoto(index) {
  const container = document.getElementById('photoContainer');
  const photoPath = allPhotos[index];
  
  const img = document.createElement('img');
  img.src = photoPath;
  img.className = 'photo';
  
  const position = getNextGridPosition();
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
  initializeGridPositions();
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
          initializeGridPositions(); // Reset grid positions
          setTimeout(showPhotos, 1000); // Start showing photos again after 1 second
      }
  }
  
  // Start the cycle
  showPhotos();
}

// Start the animation when the page loads
window.addEventListener('load', startAnimation);
