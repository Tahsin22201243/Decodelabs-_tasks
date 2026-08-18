// ============================================
// Mobile navigation toggle
// ============================================
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');

navToggle.addEventListener('click', () => {
  const isOpen = primaryNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close the mobile menu after a nav link is clicked
document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', () => {
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// Highlight the nav link for the section in view
// ============================================
const sections = document.querySelectorAll('main > section[id]');
const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    });
  },
  { rootMargin: '-50% 0px -50% 0px' }
);

sections.forEach((section) => observer.observe(section));
