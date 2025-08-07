// main.js – interactive behaviours for the redesigned site

// Initialize the animated starfield using particles.js.  The configuration
// defines a light sprinkling of stars of varying size and opacity that
// drift slowly to create a sense of depth.  We disable mouse interactivity
// to keep the background subtle and performant.
particlesJS('particles-js', {
  particles: {
    number: { value: 120, density: { enable: true, value_area: 800 } },
    color: { value: ['#ffffff', '#bbeafe', '#ffe58a'] },
    shape: { type: 'circle' },
    opacity: { value: 0.6, random: true },
    size: { value: 2.5, random: true },
    line_linked: { enable: false },
    move: { enable: true, speed: 0.15, direction: 'none', random: true, out_mode: 'out' },
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
  },
  retina_detect: true,
});

// Draw the tokenomics donut chart using Chart.js.  We select the canvas
// element by its id and create a chart with the token distribution data.
const chartCtx = document.getElementById('tokenChart').getContext('2d');
new Chart(chartCtx, {
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

// Populate the sample tweet feed.  These fun messages reflect the
// community spirit and update the DOM without relying on external APIs.
const tweets = [
  { text: 'Just bonked my way through the cosmos 🚀🌌 #GBONK #Solana', time: '2h' },
  { text: 'When your bags hit the moon and you’re still holding 🙌💎 #DiamondHands', time: '8h' },
  { text: 'The only rug we know is the one our dog sleeps on 🐕🛋️ #RugProof', time: '1d' },
  { text: 'Staking? More like snacking on gains 🍪🍪 $GBONK', time: '2d' },
  { text: 'Universal domination is one bonk away 👽🎯 #RoadToMars', time: '3d' },
  { text: 'Warning: Exposure to $GBONK may cause uncontrollable laughter 😂🌙', time: '4d' },
];
const tweetFeed = document.getElementById('tweet-feed');
tweets.forEach(({ text, time }) => {
  const li = document.createElement('li');
  li.innerHTML = `<strong>@GalacticBonk</strong> • <span>${time}</span><br>${text}`;
  tweetFeed.appendChild(li);
});

// Copy contract address to clipboard.  When the button is pressed the
// address string is copied and a temporary confirmation message is shown.
const copyBtn = document.getElementById('copy-address');
const contractElem = document.getElementById('contract-address');
const copyStatus = document.getElementById('copy-status');
copyBtn.addEventListener('click', () => {
  const text = contractElem.textContent.trim();
  navigator.clipboard.writeText(text)
    .then(() => {
      copyStatus.textContent = 'Copied!';
      setTimeout(() => (copyStatus.textContent = ''), 2000);
    })
    .catch(() => {
      copyStatus.textContent = 'Failed to copy';
      setTimeout(() => (copyStatus.textContent = ''), 2000);
    });
});

// Wallet connect logic.  This simplified version attempts to connect
// with Phantom (Solana) and gracefully handles unsupported browsers.
const connectButton = document.getElementById('connect-wallet');
const walletStatus = document.getElementById('wallet-address');
async function connectWallet() {
  if (typeof window.solana === 'undefined') {
    alert('No Solana wallet detected. Please install Phantom or another compatible wallet.');
    return;
  }
  connectButton.disabled = true;
  connectButton.textContent = 'Connecting…';
  try {
    const resp = await window.solana.connect();
    walletStatus.textContent = `Connected: ${resp.publicKey.toString()}`;
    connectButton.textContent = 'Connected';
  } catch (err) {
    console.error(err);
    alert('Failed to connect to wallet.');
    connectButton.textContent = 'Connect Wallet';
  } finally {
    connectButton.disabled = false;
  }
}
if (connectButton) {
  connectButton.addEventListener('click', connectWallet);
}

// FAQ accordion toggle.  Each FAQ item listens for clicks and toggles
// itself open or closed by adding/removing a CSS class.  We rely on
// CSS transitions for smooth height animations.
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    item.classList.toggle('open');
    const answer = item.querySelector('.faq-answer');
    if (item.classList.contains('open')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
      answer.style.maxHeight = 0;
    }
  });
});