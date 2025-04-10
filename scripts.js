// Section Navigation Functions
function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        updateActiveTab(sectionId);
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        updateActiveTab(sectionId);
    }
}

function updateActiveTab(sectionId) {
    // Remove active class from all links
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current section link
    const activeLink = document.querySelector(`nav a[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function scrollPrev() {
    const sections = Array.from(document.querySelectorAll('section'));
    const currentScroll = window.scrollY;
    
    // Find the current section
    let currentSectionIndex = -1;
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentSectionIndex = i;
            break;
        }
    }
    
    // If we found a current section and it's not the first one
    if (currentSectionIndex > 0) {
        const targetSection = sections[currentSectionIndex - 1];
        targetSection.scrollIntoView({ behavior: 'smooth' });
        updateActiveTab(targetSection.id);
    }
}

function scrollNext() {
    const sections = Array.from(document.querySelectorAll('section'));
    const currentScroll = window.scrollY;
    
    // Find the current section
    let currentSectionIndex = -1;
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentSectionIndex = i;
            break;
        }
    }
    
    // If we found a current section and it's not the last one
    if (currentSectionIndex >= 0 && currentSectionIndex < sections.length - 1) {
        const targetSection = sections[currentSectionIndex + 1];
        targetSection.scrollIntoView({ behavior: 'smooth' });
        updateActiveTab(targetSection.id);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Navigation link click handlers
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Set initial active tab based on current URL hash or default to home
    const initialSection = window.location.hash.substring(1) || 'home';
    updateActiveTab(initialSection);

    // Update active tab on scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const sections = document.querySelectorAll('section');
                let currentSection = '';
                
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                        currentSection = section.id;
                    }
                });
                
                if (currentSection) {
                    updateActiveTab(currentSection);
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    // Project name color change on scroll
    const projectNameSection = document.getElementById('project-name-section');
    const projectName = document.getElementById('project-name');
    
    if (projectNameSection && projectName) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const sectionHeight = projectNameSection.offsetHeight;
            const opacity = scrollY / sectionHeight;

            if (opacity > 0.5) {
                projectName.style.color = '#ff006d';
            } else {
                projectName.style.color = `rgba(255, 0, 109, ${opacity})`;
            }
        });
    }
});
