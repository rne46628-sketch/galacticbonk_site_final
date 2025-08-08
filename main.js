// main.js – Adds interactivity and animation to the GalacticBonk site

// Immediately invoked function to avoid polluting the global scope
(() => {
  // Initialise the canvas‑based universe.  Rather than creating
  // hundreds of DOM elements for stars and comets, we draw
  // everything on a single canvas.  This approach is significantly
  // faster and allows richer animations like falling stars, comets
  // streaking across the view and supernova explosions.
  function initUniverse() {
    const canvas = document.getElementById('universe');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    let stars = [];
    let comets = [];
    let supernovas = [];
    let nebulas = [];

    // Helper to create a batch of stars
    function spawnStars(num) {
      for (let i = 0; i < num; i++) {
        // Assign each star a base speed to create a parallax effect: slower
        // stars appear further away and are rendered smaller and dimmer.  The
        // range of speeds spans from very slow (0.15) to moderately fast
        // (0.9).  The colour alpha is derived from the speed so that far
        // stars twinkle softly while closer stars appear brighter.
        const speed = 0.15 + Math.random() * 0.75;
        const radius = 0.3 + Math.random() * 1.4;
        // Compute alpha between 0.4 and 1.0 based on speed (faster = brighter)
        const alpha = 0.4 + (speed / 0.9) * 0.6;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius,
          speed,
          color: `rgba(255,255,255,${alpha.toFixed(3)})`,
        });
      }
    }

    // Create a single comet with random trajectory
    function spawnComet() {
      const angle = -(Math.PI / 4 + Math.random() * Math.PI / 4);
      const speed = 0.6 + Math.random() * 0.6;
      return {
        x: Math.random() * w + w,
        y: Math.random() * h * 0.5,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        life: 0,
        maxLife: 300 + Math.random() * 200,
        size: 2 + Math.random() * 2,
      };
    }

    // Create a supernova effect
    function spawnSupernova() {
      return {
        x: Math.random() * w * 0.8 + w * 0.1,
        y: Math.random() * h * 0.6 + h * 0.2,
        radius: 0,
        maxRadius: 80 + Math.random() * 120,
        alpha: 1,
      };
    }

    // Create a glowing nebula.  Nebulae are large, slowly rotating
    // gradients that add depth and colour to the cosmos.  Each nebula
    // maintains an angle for rotation; the gradient colours are chosen to
    // complement the site palette.  Nebulae are drawn before stars so
    // that stars can twinkle on top.
    function spawnNebula() {
      const colours = [
        ['rgba(200, 80, 255, 0.05)', 'rgba(50, 0, 70, 0)'],
        ['rgba(0, 150, 200, 0.05)', 'rgba(0, 30, 50, 0)'],
        ['rgba(255, 80, 120, 0.05)', 'rgba(70, 0, 20, 0)'],
      ];
      const choice = colours[Math.floor(Math.random() * colours.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        radius: w * 0.5 + Math.random() * w * 0.4,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.0005) + 0.0002,
        inner: choice[0],
        outer: choice[1],
      };
    }

    // Handle resizing of the canvas
    function onResize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      // reset the arrays and respawn
      stars = [];
      spawnStars(250);
      nebulas = [];
      // Spawn a few nebulae proportional to screen size.  Smaller screens
      // receive fewer nebulas to prevent overwhelming the display.
      const nebCount = Math.max(1, Math.floor(Math.min(w, h) / 600));
      for (let i = 0; i < nebCount; i++) {
        nebulas.push(spawnNebula());
      }
    }

    // Draw the universe on each frame
    function draw() {
      ctx.clearRect(0, 0, w, h);
      // Draw nebulas (background).  Each nebula is a large radial gradient
      // that slowly rotates.  Using save/restore ensures rotation does
      // not interfere with other drawings.
      nebulas.forEach((n) => {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.angle);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, n.radius);
        grad.addColorStop(0, n.inner);
        grad.addColorStop(1, n.outer);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Advance rotation very slowly
        n.angle += n.speed;
      });
      // Draw stars.  Stars are updated based on their individual speeds.
      stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      // Draw comets
      comets.forEach((c, index) => {
        c.x += -c.vx;
        c.y += c.vy;
        c.life++;
        // Draw tail as a glow gradient
        const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 12);
        gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 12, 0, Math.PI * 2);
        ctx.fill();
        // Remove when off screen or expired
        if (c.life > c.maxLife || c.x < -c.size * 12 || c.y > h + c.size * 12) {
          comets.splice(index, 1);
        }
      });
      // Draw supernovas
      supernovas.forEach((s, index) => {
        s.radius += 2;
        s.alpha -= 0.015;
        ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (s.radius > s.maxRadius || s.alpha <= 0) {
          supernovas.splice(index, 1);
        }
      });
      requestAnimationFrame(draw);
    }

    onResize();
    window.addEventListener('resize', onResize);
    // Spawn comets periodically
    setInterval(() => {
      // Limit number of comets at once to avoid overload
      if (comets.length < 6) comets.push(spawnComet());
    }, 5000);
    // Spawn supernovas periodically
    setInterval(() => {
      supernovas.push(spawnSupernova());
    }, 10000);
    draw();
  }

  // FAQ toggle logic: expand/collapse answers on click
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!question || !answer) return;
      question.addEventListener('click', () => {
        const isOpen = item.classList.toggle('open');
        // Toggle ARIA attribute for accessibility
        question.setAttribute('aria-expanded', String(isOpen));
        // Animate the answer's height
        if (isOpen) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        } else {
          answer.style.maxHeight = null;
        }
      });
    });
  }

  // Intersection observer to reveal sections when scrolled into view
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });
  }

  // Toggle mobile menu
  function initMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const menuList = document.getElementById('primary-menu');
    if (toggle && menuList) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menuList.classList.toggle('open');
      });
    }
  }

  // Draw the tokenomics donut chart using Chart.js
  function initChart() {
    const chartEl = document.getElementById('tokenChart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Circulating', 'Treasury & Liquidity', 'Team & Dev', 'Burned'],
        datasets: [
          {
            data: [47, 23, 17, 13],
            backgroundColor: ['#00c2cb', '#ff3860', '#9b59b6', '#ffd700'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Populate sample tweets in the community section
  function populateTweets() {
    const tweets = [
      { text: 'Just bonked my way through the cosmos 🚀 #GBONK #Solana', time: '2h' },
      { text: 'When your bags hit the moon and you’re still holding 💎🙌', time: '8h' },
      { text: 'The only rug we know is the one our dog sleeps on 🐶🧡 #RugProof', time: '1d' },
      { text: 'Staking? More like snacking on gains 🍪 $GBONK', time: '2d' },
      { text: 'Universal domination is one bonk away 🌌 #RoadToMars', time: '3d' },
      { text: 'Warning: Exposure to $GBONK may cause uncontrollable laughter 😂', time: '4d' },
    ];
    const feed = document.getElementById('tweet-feed');
    if (!feed) return;
    tweets.forEach(({ text, time }) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>@GalacticBonk</strong> • <span>${time}</span><br>${text}`;
      feed.appendChild(li);
    });
  }

  // Copy contract address to clipboard
  function initCopyAddress() {
    const copyBtn = document.getElementById('copy-address');
    const addressEl = document.getElementById('contract-address');
    const statusEl = document.getElementById('copy-status');
    if (!copyBtn || !addressEl || !statusEl) return;
    copyBtn.addEventListener('click', () => {
      const text = addressEl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        statusEl.textContent = 'Copied!';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      }).catch(() => {
        statusEl.textContent = 'Failed to copy';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      });
    });
  }

  // Wallet connect logic (supports Phantom or compatible Solana wallet)
  function initWalletConnect() {
    const connectBtn = document.getElementById('connect-wallet');
    const status = document.getElementById('wallet-address');
    if (!connectBtn || !status) return;
    connectBtn.addEventListener('click', async () => {
      if (typeof window.solana === 'undefined') {
        alert('No Solana wallet detected. Please install Phantom or another compatible wallet.');
        return;
      }
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting…';
      try {
        const resp = await window.solana.connect();
        status.textContent = `Connected: ${resp.publicKey.toString()}`;
        connectBtn.textContent = 'Connected';
      } catch (err) {
        console.error(err);
        alert('Failed to connect to wallet.');
        connectBtn.textContent = 'Connect Wallet';
      } finally {
        connectBtn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initUniverse();
    initScrollAnimations();
    initMenuToggle();
    initChart();
    populateTweets();
    initCopyAddress();
    initWalletConnect();
    initFAQ();
  });
})();