// Function to force autoplay on all YouTube iframes
function forceAutoplay() {
    const players = document.querySelectorAll('iframe');
    
    players.forEach((player, index) => {
        try {
            // Try to play using YouTube API
            player.contentWindow.postMessage(JSON.stringify({
                "event": "command",
                "func": "playVideo",
                "args": []
            }), "*");

            // Backup method: reload the iframe with autoplay
            if (!player.src.includes('&autoplay=1')) {
                player.src = player.src + '&autoplay=1';
            }
        } catch (e) {
            console.log('Autoplay attempt failed for player:', index + 1);
        }
    });
}

// Try to autoplay as soon as possible
document.addEventListener('DOMContentLoaded', () => {
    forceAutoplay();
    // Try multiple times in case the first attempt fails
    setTimeout(forceAutoplay, 1000);
    setTimeout(forceAutoplay, 2000);
    setTimeout(forceAutoplay, 3000);
});

// Handle visibility changes (when user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        forceAutoplay();
    }
});

// Handle window focus
window.addEventListener('focus', forceAutoplay);

// Initial attempt
forceAutoplay(); 