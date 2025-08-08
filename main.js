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

    // Load the G‑Bonk mascot for rendering directly on the canvas.  By drawing
    // the dog into the universe rather than overlaying it in the DOM we
    // integrate it seamlessly with the stars, comets and nebulas.  This
    // approach also makes the dog responsive to canvas transforms like
    // rotation and scaling.
    const dogImg = new Image();
    dogImg.src = 'dog3d.png';
    // Approximate aspect ratio of the dog sprite (width/height).  Our
    // cropped 3D mascot has a width of ~614px and height of ~1382px giving
    // a ratio of about 0.444.  This ratio is used to compute the base
    // rendering dimensions.  Should the underlying image change, update
    // these values accordingly.
    const DOG_RATIO = 0.444;
    const DOG_BASE_HEIGHT = 260;
    const DOG_BASE_WIDTH = DOG_BASE_HEIGHT * DOG_RATIO;

    // Track mouse movement to breathe life into our mascot.  We listen
    // globally for pointer motion and normalise the x/y values to a
    // range of [-0.5, 0.5].  These values modulate the dog’s rotation,
    // scale and brightness in the draw loop.  The mascot will subtly
    // tilt toward the pointer, grow when the pointer is near the
    // centre and dim/brighten based on horizontal position.  Using
    // viewport dimensions here ensures the behaviour remains
    // consistent on resize.
    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      // guard against zero width/height in edge cases
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      mouseX = (e.clientX / vw) - 0.5;
      mouseY = (e.clientY / vh) - 0.5;
    });

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
        // Deep magenta to indigo
        ['rgba(200, 80, 255, 0.05)', 'rgba(40, 0, 80, 0)'],
        // Cyan to midnight blue
        ['rgba(0, 180, 220, 0.05)', 'rgba(0, 20, 60, 0)'],
        // Pink to burgundy
        ['rgba(255, 100, 150, 0.05)', 'rgba(70, 0, 20, 0)'],
        // Gold to amber
        ['rgba(255, 180, 70, 0.05)', 'rgba(70, 20, 0, 0)'],
      ];
      const choice = colours[Math.floor(Math.random() * colours.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        radius: w * 0.4 + Math.random() * w * 0.6,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.0007) + 0.0001,
        scaleX: 1.0 + Math.random() * 1.5,
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
        // Apply horizontal scaling to create elliptical nebulae.  This adds
        // variety to the shapes and makes the nebulas feel more organic.
        ctx.scale(n.scaleX, 1);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, n.radius);
        grad.addColorStop(0, n.inner);
        grad.addColorStop(1, n.outer);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Advance rotation slowly and also gently fluctuate the scale to
        // simulate swirling clouds.
        n.angle += n.speed;
        // Oscillate scaleX between its original value and a slightly
        // expanded state for subtle pulsation.
        n.scaleX += Math.sin(performance.now() * 0.0002) * 0.0003;
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

      // Draw the G‑Bonk dog.  Compute scroll progress to determine the
      // mascot’s position, rotation and base scale.  The dog travels
      // across the viewport from left to right as the user scrolls down
      // the document.  It bobs up and down and scales in and out to
      // simulate depth.  We further modulate these transforms using
      // the pointer position so that the mascot appears to respond to
      // user movement – tilting and brightening as the mouse moves.
      if (dogImg.complete && dogImg.naturalWidth > 0) {
        const doc = document.documentElement;
        const scrollTop = window.pageYOffset || doc.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const percent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        // Horizontal travel across the entire canvas plus extra margins.  The
        // dog starts 150px off‑screen and exits 150px off‑screen on the
        // opposite side.
        const totalDistance = w + 300;
        const xPos = percent * totalDistance - 150;
        // Vertical bobbing relative to canvas height.  We center the dog
        // vertically and add a sine wave for gentle floating.  Pointer Y
        // subtly adjusts vertical position to give a sense of depth.
        const bob = Math.sin(percent * Math.PI * 4) * 50;
        const yPos = h * 0.5 + bob + mouseY * 80;
        // Base rotation around the Z‑axis (we use Z since 2D canvas
        // doesn’t support 3D yaw/pitch).  A higher frequency yields
        // playful wobbling as the dog travels.  Pointer X modifies the
        // rotation so the dog turns slightly toward the cursor.
        const baseRotate = Math.sin(percent * Math.PI * 8) * 25 * Math.PI / 180;
        const interactiveRotate = baseRotate + mouseX * 0.5;
        // Base scale – the mascot grows in the middle of the journey and
        // shrinks near the start/end.  Pointer Y accentuates this,
        // making the dog grow when the cursor is nearer the centre and
        // shrink at the edges.  We clamp to reasonable limits.
        let baseScale = 0.8 + 0.4 * Math.sin(percent * Math.PI);
        baseScale *= 1 + mouseY * 0.3;
        baseScale = Math.max(0.5, Math.min(1.4, baseScale));
        ctx.save();
        ctx.translate(xPos, yPos);
        ctx.rotate(interactiveRotate);
        ctx.scale(baseScale, baseScale);
        // Adjust brightness and saturation based on pointer movement.
        const brightness = 1 + Math.abs(mouseX) * 0.4;
        const saturate = 1 + Math.abs(mouseY) * 0.5;
        ctx.filter = `brightness(${brightness}) saturate(${saturate})`;
        // Draw the image centred on its origin.  Use the base width and
        // height defined at initialisation to ensure consistent sizing.
        ctx.drawImage(dogImg, -DOG_BASE_WIDTH / 2, -DOG_BASE_HEIGHT / 2, DOG_BASE_WIDTH, DOG_BASE_HEIGHT);
        // Reset filter for subsequent drawings.
        ctx.filter = 'none';
        ctx.restore();
      }
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

    // Spawn a supernova at the click location on the document.  This makes
    // the universe interactive: tapping anywhere triggers a small
    // explosion.  Coordinates are taken directly from the event, which
    // correspond to the viewport; they map naturally onto the canvas.
    document.addEventListener('click', (e) => {
      supernovas.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 80 + Math.random() * 100,
        alpha: 1,
      });
    });
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
    initRocketScroll();
    initProgressBar();
    initDogScroll();
    initDog3D();
  });

  // Animate the hero rocket based on scroll position rather than a fixed
  // CSS animation.  As the user scrolls past the hero section the rocket
  // moves diagonally upward and rotates slightly, reinforcing the sense
  // of lifting off.  This function disables the default CSS animation on
  // the hero rocket and updates its transform on each scroll event.
  function initRocketScroll() {
    const rockets = document.querySelectorAll('.rocket-container');
    if (!rockets.length) return;
    const heroRocket = rockets[0];
    // Stop the CSS animation if it exists
    heroRocket.style.animation = 'none';
    window.addEventListener('scroll', () => {
      const heroSection = document.getElementById('hero');
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      // Calculate how far the hero section has scrolled out of view.  When
      // the top of the hero is at the top of the viewport, progress is 0.
      // When the bottom of the hero hits the top of the viewport, progress
      // reaches 1.
      const progress = Math.min(Math.max(1 - rect.bottom / rect.height, 0), 1);
      // Define a curved flight path.  The rocket moves upward while
      // oscillating horizontally along a gentle sine wave.  This adds
      // dynamism compared to a straight line.  Rotation also varies
      // slightly with a sine wave to suggest banking as it flies.
      const baseX = 600 * progress;
      const wave = Math.sin(progress * Math.PI) * 200; // side‑to‑side motion
      const translateX = baseX + wave;
      const translateY = -800 * progress + Math.sin(progress * Math.PI) * -120;
      const rotate = -20 * progress + Math.sin(progress * Math.PI * 2) * 8;
      heroRocket.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
    });
  }

  // Animate the G‑Bonk dog as the user scrolls.  The dog starts
  // off‑screen to the left and moves horizontally across the viewport
  // over the course of the page scroll.  A gentle vertical bobbing
  // motion and a 3D yaw rotation add life to the mascot.  The dog’s
  // journey is independent of the rocket and uses overall page scroll
  // percentage to compute its position.
  function initDogScroll() {
    const dog = document.querySelector('.dog-container');
    if (!dog) return;
    const updateDog = () => {
      const doc = document.documentElement;
      const scrollTop = window.pageYOffset || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
      // Horizontal travel: move from off‑screen left to off‑screen right.
      // The dog traverses the entire viewport plus an extra margin so it
      // appears to enter and exit the scene smoothly.
      const viewportWidth = window.innerWidth;
      const totalDistance = viewportWidth + 300; // 150px off‑screen on each side
      const translateX = percent * totalDistance - 150;
      // Vertical bobbing: oscillate up and down to suggest floating.
      const bob = Math.sin(percent * Math.PI * 4) * 50;
      const translateY = bob;
      // 3D yaw rotation: tilt left and right as it moves.  A faster
      // frequency adds playful energy to the animation.
      const rotateY = Math.sin(percent * Math.PI * 8) * 25; // degrees
      // 3D pitch rotation: nod the dog up and down to further
      // emphasise its three‑dimensionality.
      const rotateX = Math.sin(percent * Math.PI * 6) * 10; // degrees
      // Scale the dog slightly along its journey.  At the middle of the
      // scroll it grows larger, creating a sense of depth as if the
      // mascot is coming closer to the viewer, then recedes again.
      const scale = 0.8 + 0.4 * Math.sin(percent * Math.PI);
      dog.style.transform =
        `translate(${translateX}px, calc(-50% + ${translateY}px)) ` +
        `rotateY(${rotateY}deg) rotateX(${rotateX}deg) ` +
        `scale(${scale})`;
    };
    updateDog();
    window.addEventListener('scroll', updateDog);
    window.addEventListener('resize', updateDog);
  }

  // Update the scroll progress indicator based on page scroll position.  The
  // height of the progress bar reflects the percentage of the document
  // that has been scrolled.  Because the progress bar is purely
  // decorative, it does not interfere with keyboard navigation.
  function initProgressBar() {
    const progress = document.querySelector('.progress-bar');
    if (!progress) return;
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = window.pageYOffset || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
      progress.style.height = `${percent * 100}%`;
    };
    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
  }

  // Initialise a 3D rendering of the G‑Bonk mascot using Three.js.
  // This function constructs a simple low‑poly dog composed of
  // spheres, cylinders and cones to approximate the character’s
  // silhouette.  A transparent helmet surrounds the head to evoke
  // an astronaut suit.  The model is lit with ambient and directional
  // lights to give depth and shading.  On each animation frame the
  // dog’s position, rotation and tail wag are updated based on scroll
  // progress and time, then the scene is rendered.  If Three.js is
  // unavailable or the container element is missing, the function exits.
  function initDog3D() {
    const container = document.getElementById('dog3d-container');
    // Ensure Three.js is loaded and a container exists
    if (!container || typeof THREE === 'undefined') return;
    // Create the renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);
    // Create the scene
    const scene = new THREE.Scene();
    // Camera with perspective projection; positioned back to view the dog
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 12);
    // Lighting: ambient provides base illumination; directional light simulates a sun
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.7);
    directional.position.set(5, 10, 7);
    scene.add(directional);
    // Group to hold all dog parts for easy transformation
    // Declare limb variables here so they are accessible within the
    // animation loop.  They will be assigned later when the meshes
    // are created.
    let leftArm, rightArm, leftLeg, rightLeg, tailPivot;
    const dog = new THREE.Group();
    scene.add(dog);
    // Body – blue sphere scaled into an ellipsoid for the spacesuit
    const bodyGeom = new THREE.SphereGeometry(1, 32, 32);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x0066aa });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.scale.set(0.9, 1.2, 0.9);
    body.position.set(0, 0, 0);
    dog.add(body);
    // Head – orange sphere for fur
    const headGeom = new THREE.SphereGeometry(0.7, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xf5a623 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 1.5, 0);
    dog.add(head);
    // Muzzle – lighter sphere
    const muzzleGeom = new THREE.SphereGeometry(0.35, 32, 32);
    const muzzleMat = new THREE.MeshPhongMaterial({ color: 0xffd9b3 });
    const muzzle = new THREE.Mesh(muzzleGeom, muzzleMat);
    muzzle.position.set(0, 1.3, 0.45);
    dog.add(muzzle);
    // Nose – small black sphere
    const noseGeom = new THREE.SphereGeometry(0.1, 16, 16);
    const noseMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 1.33, 0.63);
    dog.add(nose);
    // Construct expressive eyes with eyeballs, pupils and highlights.
    const eyeBallGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeBallMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pupilGeom = new THREE.SphereGeometry(0.07, 16, 16);
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const glintGeom = new THREE.SphereGeometry(0.03, 16, 16);
    const glintMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    function createEye(x, y, z) {
      const eyeGroup = new THREE.Group();
      const eyeball = new THREE.Mesh(eyeBallGeom, eyeBallMat);
      eyeGroup.add(eyeball);
      const pupil = new THREE.Mesh(pupilGeom, pupilMat);
      pupil.position.set(0, 0, 0.1);
      eyeGroup.add(pupil);
      const glint = new THREE.Mesh(glintGeom, glintMat);
      glint.position.set(0.04, 0.04, 0.14);
      eyeGroup.add(glint);
      eyeGroup.position.set(x, y, z);
      return eyeGroup;
    }
    dog.add(createEye(-0.22, 1.5, 0.52));
    dog.add(createEye(0.22, 1.5, 0.52));
    // Add cheeks with a soft pink tone.
    const cheekGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const cheekMat = new THREE.MeshPhongMaterial({ color: 0xffc09e });
    const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
    leftCheek.position.set(-0.35, 1.28, 0.55);
    const rightCheek = leftCheek.clone();
    rightCheek.position.set(0.35, 1.28, 0.55);
    dog.add(leftCheek);
    dog.add(rightCheek);
    // Add a rocket badge on the chest
    const badgeGroup = new THREE.Group();
    const badgeBaseGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 32);
    const badgeBaseMat = new THREE.MeshPhongMaterial({ color: 0x004a7f });
    const badgeBase = new THREE.Mesh(badgeBaseGeom, badgeBaseMat);
    badgeBase.rotation.x = Math.PI / 2;
    badgeGroup.add(badgeBase);
    const rocketBodyGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16);
    const rocketMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const rocketBody = new THREE.Mesh(rocketBodyGeom, rocketMat);
    rocketBody.rotation.x = Math.PI / 2;
    rocketBody.position.set(0, 0, 0.09);
    badgeGroup.add(rocketBody);
    const rocketConeGeom = new THREE.ConeGeometry(0.045, 0.08, 16);
    const rocketCone = new THREE.Mesh(rocketConeGeom, rocketMat);
    rocketCone.rotation.x = Math.PI / 2;
    rocketCone.position.set(0, 0, 0.15);
    badgeGroup.add(rocketCone);
    badgeGroup.position.set(0, 0.3, 0.7);
    dog.add(badgeGroup);
    // Ears – two orange cones
    const earGeom = new THREE.ConeGeometry(0.2, 0.6, 16);
    const earMat = new THREE.MeshPhongMaterial({ color: 0xf5a623 });
    const leftEar = new THREE.Mesh(earGeom, earMat);
    leftEar.position.set(-0.35, 2.05, 0);
    leftEar.rotation.set(Math.PI / 2.8, 0, Math.PI / 9);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.35, 2.05, 0);
    rightEar.rotation.z = -Math.PI / 9;
    dog.add(leftEar);
    dog.add(rightEar);
    // Arms – cylinders sticking out of the body.  Assign to outer
    // variables so they can be animated later.  Start with a
    // horizontal orientation (rotation around Z) and position at
    // shoulder level.
    const armGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
    const armMat = new THREE.MeshPhongMaterial({ color: 0x0066aa });
    leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.8, 0.3, 0);
    leftArm.rotation.z = Math.PI / 2;
    rightArm = leftArm.clone();
    rightArm.position.set(0.8, 0.3, 0);
    dog.add(leftArm);
    dog.add(rightArm);
    // Legs – cylinders under the body.  Assign to outer variables so
    // they can be animated.  Legs are oriented vertically by default.
    const legGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 16);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x0066aa });
    leftLeg = new THREE.Mesh(legGeom, legMat);
    leftLeg.position.set(-0.4, -0.8, 0);
    rightLeg = leftLeg.clone();
    rightLeg.position.set(0.4, -0.8, 0);
    dog.add(leftLeg);
    dog.add(rightLeg);
    // Tail – cylinder pivoting at the base.  Assign pivot to the
    // outer scope variable so it can be animated.  The tail mesh
    // itself remains local.
    const tailGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12);
    const tailMat = new THREE.MeshPhongMaterial({ color: 0xf5a623 });
    const tail = new THREE.Mesh(tailGeom, tailMat);
    tailPivot = new THREE.Object3D();
    tailPivot.position.set(0, -0.2, -0.8);
    tail.position.set(0, 0.4, 0);
    tail.rotation.x = Math.PI / 2;
    tailPivot.add(tail);
    dog.add(tailPivot);
    // Helmet – transparent sphere encasing the head
    const helmetGeom = new THREE.SphereGeometry(0.9, 32, 32);
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    const helmet = new THREE.Mesh(helmetGeom, helmetMat);
    helmet.position.set(0, 1.5, 0);
    dog.add(helmet);
    // Animation loop
    // The dog now moves independently across the canvas.  It bounces within
    // a defined region and animates its limbs to simulate walking.  A
    // clock provides delta‑time for smooth motion.  The dog rotates to
    // face its direction of travel and wags its tail.
    const clock = new THREE.Clock();
    const wanderArea = { x: 20, y: 10 };
    const dogVelocity = new THREE.Vector3(
      (Math.random() * 2 - 1) * 4,
      (Math.random() * 2 - 1) * 2,
      0
    );
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      // Update position
      dog.position.x += dogVelocity.x * delta;
      dog.position.y += dogVelocity.y * delta;
      // Reflect at boundaries
      if (dog.position.x > wanderArea.x) { dog.position.x = wanderArea.x; dogVelocity.x *= -1; }
      if (dog.position.x < -wanderArea.x) { dog.position.x = -wanderArea.x; dogVelocity.x *= -1; }
      if (dog.position.y > wanderArea.y) { dog.position.y = wanderArea.y; dogVelocity.y *= -1; }
      if (dog.position.y < -wanderArea.y) { dog.position.y = -wanderArea.y; dogVelocity.y *= -1; }
      // Orientation: face direction of travel plus a small wobble
      const directionAngle = Math.atan2(dogVelocity.x, dogVelocity.y);
      const wobble = Math.sin(clock.elapsedTime * 4) * 0.1;
      dog.rotation.y = directionAngle + wobble;
      // Limb animation for walking
      const walkCycle = clock.elapsedTime * 6;
      const walkAngle = Math.sin(walkCycle) * 0.6;
      leftArm.rotation.z = Math.PI / 2 + walkAngle;
      rightArm.rotation.z = Math.PI / 2 - walkAngle;
      leftLeg.rotation.z = -walkAngle;
      rightLeg.rotation.z = walkAngle;
      // Wag tail
      tailPivot.rotation.z = Math.sin(clock.elapsedTime * 6) * 0.6;
      renderer.render(scene, camera);
    }
    animate();
    // Resize handler keeps aspect ratio correct
    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
  }
})();