(function() {
    const LOGOUT_DELAY_SECONDS = 10;
    let inactivityTimeoutId;

    function redirectToLogout() {
        console.log(`User inactive for ${LOGOUT_DELAY_SECONDS} seconds. Logging out via client-side timer.`);
        window.location.href = '/logout'; // Your server's logout endpoint
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeoutId);
        inactivityTimeoutId = setTimeout(redirectToLogout, LOGOUT_DELAY_SECONDS * 1000);
    }

    // List of user activities that will reset the timer
    const activityEvents = [
        'click',
        'mousemove',
        'mousedown',
        'keypress',
        'keydown',
        'scroll',
        'touchstart'
    ];

    // Add event listeners to the document for each activity type
    activityEvents.forEach(eventType => {
        document.addEventListener(eventType, resetInactivityTimer, true);
    });

    // Start the timer when the script is loaded on a page
    // This script should ideally be included on pages where a user is logged in.
    // Your server-side middleware already protects routes, so if this redirects
    // from a public page, /logout should handle it gracefully.
    resetInactivityTimer();
    console.log(`Client-side inactivity logout timer started. Timeout: ${LOGOUT_DELAY_SECONDS} seconds.`);

})();