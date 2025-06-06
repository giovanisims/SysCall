document.getElementById('menuButton').addEventListener('click', function () {
    const nav = document.getElementById("navBar");
    const computedStyle = window.getComputedStyle(nav);
    const display = computedStyle.display;

    if (display === "none") {
        nav.style.display = "flex";
    }
    else {
        nav.style.display = "none";
    }
});

// Close menu when clicking anywhere else on the page
document.addEventListener('click', function(event) {
    const nav = document.getElementById("navBar");
    const menuButton = document.getElementById("menuButton");
    
    if (window.innerWidth <= 800 && !nav.contains(event.target) && event.target !== menuButton) {
        nav.style.display = "none";
    }
});

window.addEventListener('resize', function () {
    const nav = document.getElementById("navBar");
    if (window.innerWidth > 800) {
        nav.style.display = "flex";
    } else {
        nav.style.display = "none";
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('userModal');
    const userIcon = document.querySelector('.user-icon');

    // Open modal when clicking on user icon
    userIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent this click from being caught by the document click handler
        const isVisible = modal.style.display === 'block';
        modal.style.display = isVisible ? 'none' : 'block';
    });

    // Close modal when clicking outside
    document.addEventListener('click', function (event) {
        if (event.target !== modal && !modal.contains(event.target) && !userIcon.contains(event.target)) {
            modal.style.display = 'none';
        }
    });
});