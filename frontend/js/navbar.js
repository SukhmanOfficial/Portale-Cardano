/**
 * navbar.js — Gestione navbar: hamburger, menu mobile, scroll
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  const hamburger   = document.getElementById('navbar-hamburger');
  const mobileMenu  = document.getElementById('navbar-mobile-menu');
  const navbar      = document.getElementById('navbar');

  if (!hamburger || !mobileMenu) return;

  // Toggle menu mobile
  hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.classList.toggle('is-active', isOpen);
  });

  // Chiudi menu su click link interno
  mobileMenu.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('click', function () {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Chiudi menu su click fuori
  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target)) {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // Scroll: aggiungi classe scrolled alla navbar
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 10);
  }, { passive: true });

})();
