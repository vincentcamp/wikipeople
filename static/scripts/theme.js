
const toggleDarkMode = (darkModeEnabled) => {
    const body = document.body;
    const peopleGrid = document.getElementById('peopleGrid');
    body.classList.toggle('dark-mode', darkModeEnabled);
    peopleGrid.classList.toggle('ag-theme-alpine-dark', darkModeEnabled);
}

window.addEventListener('DOMContentLoaded', () => {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const prefersLightScheme = window.matchMedia("(prefers-color-scheme: light)").matches;
    let isDarkMode = false;
    if (prefersDarkScheme) {
        isDarkMode = true;
    } else if (prefersLightScheme) {
        isDarkMode = false;
    }

    toggleDarkMode(isDarkMode);
});




