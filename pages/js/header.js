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

