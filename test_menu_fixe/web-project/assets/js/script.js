// This file contains JavaScript code for interactive features of the website, such as menu toggling and any other dynamic behavior required on the pages.

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menuItems = document.getElementById('menu-items');

    menuToggle.addEventListener('click', function() {
        menuItems.classList.toggle('active');
    });
});