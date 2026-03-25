/* ════════════════════════════════════════════════════════════
   script.js — VR Portfolio v9 REBORN
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  initTheme();
  initLoader();
  initGate();
  initTypewriter();
  initNavbar();
  initScrollAnimations();
  initStatsCounter();
  initTabs();
  initProjectFilter();
  initParticles();
  initContact();
  initPremiumUI();
});

/* ── PREMIUM UI ENHANCEMENTS ───────────────────────────────── */
function initPremiumUI() {
  // 1. Scroll Progress Bar
  const progBar = document.getElementById('scroll-progress-bar');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progBar) progBar.style.width = scrolled + "%";

        // Parallax effect for section labels
        const labels = document.querySelectorAll('.section-label');
        labels.forEach(label => {
          const top = label.getBoundingClientRect().top;
          if (top < window.innerHeight) {
            label.style.transform = `translateX(${(window.innerHeight - top) * 0.05}px)`;
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  });

  // 2. 3D Tilt Effect - Performance Aware (Task 2.2)
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.innerWidth > 768;

  if (!isReducedMotion && isDesktop) {
    const tiltEls = document.querySelectorAll('.tilt-el, .project-card, .about-skills-card');
    tiltEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        const dx = x - xc;
        const dy = y - yc;
        el.style.transform = `perspective(1000px) rotateY(${dx / 25}deg) rotateX(${-dy / 25}deg) translateY(-5px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)`;
      });
    });
  }

  // 3. Magnetic Interaction
  const magneticEls = document.querySelectorAll('.btn-primary, .nav-logo, .nav-theme-btn, .hero-social-link');
  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      if (el.classList.contains('btn-primary')) el.style.boxShadow = `0 20px 40px rgba(99, 102, 241, 0.4)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = `translate(0, 0)`;
      if (el.classList.contains('btn-primary')) el.style.boxShadow = "";
    });
  });

  // 4. Background Blob Parallax
  const blobs = document.querySelectorAll('.bg-blob');
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    blobs.forEach((blob, index) => {
      const factor = (index + 1) * 30;
      const moveX = (x - 0.5) * factor;
      const moveY = (y - 0.5) * factor;
      blob.style.translate = `${moveX}px ${moveY}px`;
    });
  });
}



/* ── THEME TOGGLE ──────────────────────────────────────────── */
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const sunIcon = toggle.querySelector('.sun-icon');
  const moonIcon = toggle.querySelector('.moon-icon');
  
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateIcons(savedTheme);

  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcons(newTheme);
  });

  function updateIcons(theme) {
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

/* ── PAGE LOADER ────────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('page-loader');
  const bar    = document.getElementById('loader-bar');
  if (!loader || !bar) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += 40; // Mega speed
    if (progress > 100) progress = 100;
    bar.style.width = `${progress}%`;

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('done');
      }, 50);
    }
  }, 10);
}

/* ── SITE GATE ──────────────────────────────────────────────── */
function initGate() {
  // Gate disabled — recruiters should have zero friction.
  const overlay = document.getElementById('gate-overlay');
  if (overlay) overlay.style.display = 'none';
  localStorage.setItem('portfolio_unlocked', 'true');
}

/* ── TYPEWRITER ────────────────────────────────────────────── */
function initTypewriter() {
  const textEl = document.getElementById('typewriter-text');
  if (!textEl) return;

  const phrases = [
    "Workflow Automation",
    "QA Engineering",
    "Odoo ERP Systems",
    "Process Design",
    "IT & Mechanical Ops"
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function type() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      textEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      textEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

/* ── NAVBAR ─────────────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  const links = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section');

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          nav.classList.add('nav-shrunk');
        } else {
          nav.classList.remove('nav-shrunk');
        }

        let current = "";
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          if (window.pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
          }
        });

        links.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
          }
        });
        navTicking = false;
      });
      navTicking = true;
    }
  });

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        
        // Close mobile menu if it's open
        if (mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        }

        const navHeight = nav.offsetHeight;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
 
        // Skip hash updates on file:// protocol as it triggers security origin errors in many browser frames
        if (window.location.protocol === 'file:') return;

        // Update URL hash for standard web environments
        try {
          if (history.pushState) {
            history.pushState(null, null, targetId);
          } else {
            location.hash = targetId;
          }
        } catch (err) {
          console.warn("URL update blocked by browser, but scroll succeeded.");
        }
      }
    });
  });

  // Close menu when clicking links
  window.closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
  };
}

/* ── SCROLL ANIMATIONS ───────────────────────────────────────── */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

/* ── STATS COUNTER ───────────────────────────────────────────── */
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-count'));
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const updateCount = () => {
          count += increment;
          if (count < target) {
            entry.target.innerText = Math.floor(count);
            requestAnimationFrame(updateCount);
          } else {
            entry.target.innerText = target;
          }
        };
        updateCount();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

/* ── TABS ───────────────────────────────────────────────────── */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  // Set initial aria attributes
  tabButtons.forEach(btn => {
    const panelId = btn.getAttribute('data-tab');
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.hidden = true);
      
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById(target);
      if (targetPanel) targetPanel.hidden = false;
    });
  });
}

/* ── PROJECT FILTER ─────────────────────────────────────────── */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.project-tab-btn');
  const projectCards = document.querySelectorAll('.project-card');

  // Set initial aria attributes
  filterBtns.forEach(btn => {
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      projectCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-cat') === filter) {
          card.style.display = 'flex';
          setTimeout(() => card.style.opacity = '1', 10);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });
}

/* ── PARTICLES ─────────────────────────────────────────────── */
function initParticles() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;
  
  if (isReducedMotion || isMobile) return;

  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  const particles = [];
  const particleCount = 40;

  class Particle {
    constructor() {
      this.init();
    }
    init() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > width) this.speedX *= -1;
      if (this.y < 0 || this.y > height) this.speedY *= -1;
    }
    draw() {
      ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let animFrameId = null;
  let heroVisible = true;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    if (particles.length === 0) {
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    // draw lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    if (heroVisible) {
      animFrameId = requestAnimationFrame(animate);
    }
  }

  // Fix 7: Stop animation when hero leaves viewport (save CPU on scroll)
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    const visObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        heroVisible = entry.isIntersecting;
        if (heroVisible && !animFrameId) {
          animFrameId = requestAnimationFrame(animate);
        } else if (!heroVisible && animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      });
    }, { threshold: 0 });
    visObs.observe(heroSection);
  }

  window.addEventListener('resize', resize);
  resize();
  animFrameId = requestAnimationFrame(animate);
}

/* ── CONTACT ────────────────────────────────────────────────── */
function initContact() {
  const copyBtn = document.getElementById('copy-email-btn');
  const toast = document.getElementById('toast');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const email = "rakeshvakeel000@gmail.com";
      navigator.clipboard.writeText(email).then(() => {
        showToast("Email copied to clipboard!");
      });
    });
  }

  const btt = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btt.classList.add('visible');
    } else {
      btt.classList.remove('visible');
    }
  });
  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Fix 9: Contact form AJAX submission (Formspree, no page reload)
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const submitBtn  = document.getElementById('btn-form-submit');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin fa-xs"></i> Sending…';
      submitBtn.disabled = true;
      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          contactForm.reset();
          if (formSuccess) formSuccess.style.display = 'flex';
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-check fa-xs"></i> Sent!';
        } else {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          showToast('⚠️ Send failed. Please email me directly.');
        }
      } catch {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
        showToast('⚠️ Network error. Please email me directly.');
      }
    });
  }

  function showToast(msg) {
    toast.innerText = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  }
}
