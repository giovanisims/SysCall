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
    const userIcon = document.querySelector('.fa-circle-user');

    // Open modal when clicking on user icon
    userIcon.addEventListener('click', function (e) {
        e.preventDefault();
        const isVisible = modal.style.display === 'block';
        modal.style.display = isVisible ? 'none' : 'block';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target !== modal && !modal.contains(event.target) && event.target !== userIcon) {
            modal.style.display = 'none';
        }
    });
});