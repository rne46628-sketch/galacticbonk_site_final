// main.js – Adds interactivity and animation to the GalacticBonk site

// Immediately invoked function to avoid polluting the global scope
(() => {
  // Create star elements and animate their twinkle
  function createStars() {
    const starfield = document.getElementById('starfield');
    if (!starfield) return;
    const totalStars = 350;
    for (let i = 0; i < totalStars; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.top = Math.random() * 100 + '%';
      star.style.left = Math.random() * 100 + '%';
      // randomise size to add depth
      const size = 2 + Math.random() * 3;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      // Vary animation delay and duration for randomness
      const delay = Math.random() * 8;
      const duration = 6 + Math.random() * 6;
      star.style.animationDelay = `${delay}s`;
      star.style.animationDuration = `${duration}s`;
      starfield.appendChild(star);
    }
  }

  // Create comets that fly diagonally across the screen
  function createComets() {
    const starfield = document.getElementById('starfield');
    if (!starfield) return;
    const totalComets = 10;
    for (let i = 0; i < totalComets; i++) {
      const comet = document.createElement('div');
      comet.classList.add('comet');
      comet.style.top = Math.random() * 100 + '%';
      comet.style.left = (50 + Math.random() * 50) + '%';
      // Stagger each comet's animation
      const delay = Math.random() * 12;
      comet.style.animationDelay = `${delay}s`;
      starfield.appendChild(comet);
    }
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
    createStars();
    createComets();
    initScrollAnimations();
    initMenuToggle();
    initChart();
    populateTweets();
    initCopyAddress();
    initWalletConnect();
  });
})();