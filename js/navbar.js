/**
 * navbar.js — Hamburger, mobile menu, scroll
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  var hamburger  = document.getElementById('navbar-hamburger');
  var mobileMenu = document.getElementById('navbar-mobile-menu');
  var navbar     = document.getElementById('navbar');

  window.closeMobileMenu = function () {
    if (mobileMenu) mobileMenu.classList.remove('is-open');
    if (hamburger)  { hamburger.classList.remove('is-active'); hamburger.setAttribute('aria-expanded','false'); }
  };

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.classList.toggle('is-active', isOpen);
    });
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) closeMobileMenu();
    });
  }

  // Navbar scrolled shadow
  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('navbar--scrolled', window.scrollY > 10);
  }, { passive: true });

})();
