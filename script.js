// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ===== MOBILE NAV =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');
function toggleNav() {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
  navOverlay.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
}
navToggle.addEventListener('click', toggleNav);
navOverlay.addEventListener('click', toggleNav);
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  if (navLinks.classList.contains('open')) toggleNav();
}));

// ===== SCROLL REVEAL =====
const scrollEls = document.querySelectorAll('[data-scroll]');
const scrollObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); scrollObs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
scrollEls.forEach(el => scrollObs.observe(el));

// ===== HERO PARALLAX =====
const heroContent = document.querySelector('.hero-content');
const heroBgText = document.querySelector('.hero-bg-text');
const heroFloat = document.querySelector('.hero-image-float');

function heroParallax() {
  const y = window.scrollY;
  const h = document.querySelector('.hero')?.offsetHeight || 800;
  if (y < h) {
    const p = y / h;
    if (heroContent) {
      heroContent.style.transform = `translateY(${y * 0.3}px)`;
      heroContent.style.opacity = 1 - p * 1.5;
    }
    if (heroBgText) heroBgText.style.transform = `translate(-50%, calc(-50% + ${y * 0.12}px))`;
    if (heroFloat) {
      heroFloat.style.transform = `translateY(${y * 0.18}px)`;
      heroFloat.style.opacity = 1 - p * 1.2;
    }
  }
}
window.addEventListener('scroll', heroParallax, { passive: true });

// ===== 3D CARD TILT =====
function initTilt() {
  if (window.innerWidth < 768 || 'ontouchstart' in window) return;
  const cards = document.querySelectorAll('.service-card, .contact-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      const rx = ((y - cy) / cy) * -14;
      const ry = ((x - cx) / cx) * 14;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-14px) scale(1.04)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
initTilt();
let resizeT;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(initTilt, 250); });

// ===== CURSOR GLOW =====
if (window.innerWidth > 768 && !('ontouchstart' in window)) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function anim() {
    gx += (mx - gx) * 0.1;
    gy += (my - gy) * 0.1;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(anim);
  })();
}

// (Bubbles replaced by Three.js 3D particles)

// ===== SMOOTH ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    const t = document.querySelector(this.getAttribute('href'));
    if (t) {
      const offset = navbar.offsetHeight + 10;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});

// ===== PRICING SHIMMER =====
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,185,72,0.18), rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04))`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = ''; });
});

// ===== INTERACTIVE BIG TEXT =====
document.querySelectorAll('.bt-word').forEach(word => {
  word.addEventListener('mouseenter', () => {
    word.style.transform = 'scale(1.15) rotate(-3deg)';
    word.style.color = '#febc59';
    word.style.textShadow = '0 10px 50px rgba(254,188,89,0.5)';
  });
  word.addEventListener('mouseleave', () => {
    word.style.transform = '';
    word.style.color = '';
    word.style.textShadow = '';
  });
});

// ===== HERO IMAGE 3D TILT =====
const heroCarImg = document.querySelector('.hero-car-img');
if (heroCarImg && window.innerWidth > 768) {
  heroCarImg.addEventListener('mousemove', e => {
    const r = heroCarImg.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    const rx = ((y - cy) / cy) * -12;
    const ry = ((x - cx) / cx) * 12;
    heroCarImg.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
  });
  heroCarImg.addEventListener('mouseleave', () => {
    heroCarImg.style.transform = '';
  });
}

// ===== AREA CHIPS POP =====
document.querySelectorAll('.area-chip').forEach(chip => {
  chip.addEventListener('mouseenter', () => {
    chip.style.transform = `translateY(-8px) scale(1.12) rotate(${(Math.random() - 0.5) * 6}deg)`;
  });
  chip.addEventListener('mouseleave', () => { chip.style.transform = ''; });
});
