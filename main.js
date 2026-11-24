window.__app = true;
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ───────────── theme ───────────── */
const themeBtn = $('#themeToggle');
const listeners = new Set();
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  $('meta[name="theme-color"]').content = next === 'dark' ? '#030712' : '#f6f8fc';
  listeners.forEach((fn) => fn(next));
});

/* ───────────── nav: scrolled state, progress, active link, mobile menu ───────────── */
const nav = $('#nav');
const progress = $('#progress');
let scrollY = 0;
const onScroll = () => {
  scrollY = window.scrollY;
  nav.classList.toggle('scrolled', scrollY > 20);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const links = $$('.nav-links a');
const sectionObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
$$('main section[id]').forEach((s) => sectionObs.observe(s));

const menuBtn = $('#menuBtn');
const navLinks = $('#navLinks');
const setMenu = (open) => {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* ───────────── reveal on scroll (with sibling stagger) ───────────── */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
$$('.reveal').forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
  revealObs.observe(el);
});

/* ───────────── typewriter roles ───────────── */
const roles = ['Backstage Platform Engineer', 'Open Source Contributor', 'Full‑stack Web Developer', 'Internal Developer Portal Builder'];
const typed = $('#typed');
if (!reduceMotion) {
  let r = 0, i = roles[0].length, deleting = true;
  const tick = () => {
    const word = roles[r];
    i += deleting ? -1 : 1;
    typed.textContent = word.slice(0, i);
    let delay = deleting ? 35 : 70;
    if (!deleting && i === word.length) { deleting = true; delay = 1900; }
    else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2200);
}

/* ───────────── count up ───────────── */
const countObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      countObs.unobserve(el);
      if (reduceMotion) { el.textContent = end + suffix; return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },
  { threshold: 0.6 }
);
$$('[data-count]').forEach((el) => countObs.observe(el));

/* ───────────── filters ───────────── */
const tabs = $$('.filters button');
tabs.forEach((btn) =>
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    const f = btn.dataset.filter;
    $$('.work').forEach((w) => { w.hidden = f !== 'all' && !w.dataset.cat.split(' ').includes(f); });
  })
);

/* ───────────── pointer effects: spotlight, card glow, tilt, magnetic ───────────── */
const mouse = { x: 0, y: 0 }; // normalised -1..1 for the 3D scene
if (finePointer && !reduceMotion) {
  const spot = $('#spot');
  addEventListener('pointermove', (e) => {
    spot.style.left = e.clientX + 'px';
    spot.style.top = e.clientY + 'px';
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  $$('.glow').forEach((el) =>
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y', `${e.clientY - r.top}px`);
    })
  );

  $$('[data-tilt]').forEach((el) => {
    const max = el.classList.contains('photo-card') ? 12 : 6;
    const target = el.classList.contains('photo-card') ? document.querySelector('.hero') : el;
    target.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / (target === el ? r.width / 2 : innerWidth / 2);
      const py = (e.clientY - (r.top + r.height / 2)) / (target === el ? r.height / 2 : innerHeight / 2);
      el.style.setProperty('--ry', `${Math.max(-1, Math.min(1, px)) * max}deg`);
      el.style.setProperty('--rx', `${Math.max(-1, Math.min(1, -py)) * max}deg`);
    });
    target.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
      el.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });
}

$('#year').textContent = new Date().getFullYear();

/* ───────────── Three.js scene ───────────── */
initScene().catch((err) => console.warn('3D scene disabled:', err));

async function initScene() {
  const canvas = $('#scene');
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const palette = {
    dark: { line: 0x38bdf8, core: 0x1e1b4b, emissive: 0x312e81, ring: 0x8b5cf6, stars: 0x9be7ff, blend: THREE.AdditiveBlending, starOpacity: 0.85 },
    light: { line: 0x0284c7, core: 0xe0e7ff, emissive: 0x000000, ring: 0x7c3aed, stars: 0x6366f1, blend: THREE.NormalBlending, starOpacity: 0.5 },
  };

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const l1 = new THREE.PointLight(0x38bdf8, 60, 30); l1.position.set(5, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(0x8b5cf6, 60, 30); l2.position.set(-6, -3, 4); scene.add(l2);

  const world = new THREE.Group();
  scene.add(world);

  // glassy core + wireframe shell
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({ flatShading: true, metalness: 0.4, roughness: 0.25, transparent: true, opacity: 0.9 })
  );
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.1, 1)),
    new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45 })
  );
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.012, 8, 160), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6 }));
  const ring2 = ring1.clone(); ring2.material = ring1.material.clone(); ring2.scale.setScalar(1.25);
  ring1.rotation.x = Math.PI / 2.3; ring2.rotation.set(Math.PI / 1.8, 0.5, 0);
  const coreGroup = new THREE.Group();
  coreGroup.add(core, shell, ring1, ring2);
  world.add(coreGroup);

  // orbiting cubes ("plugins")
  const cubeColors = [0x38bdf8, 0x8b5cf6, 0x22c55e, 0xf59e0b, 0xec4899];
  const cubes = [];
  for (let i = 0; i < 16; i++) {
    const s = 0.12 + Math.random() * 0.2;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(s, s, s),
      new THREE.MeshStandardMaterial({ color: cubeColors[i % cubeColors.length], metalness: 0.3, roughness: 0.3, emissive: cubeColors[i % cubeColors.length], emissiveIntensity: 0.25 })
    );
    m.userData = { r: 3 + Math.random() * 2.2, speed: 0.08 + Math.random() * 0.18, phase: Math.random() * Math.PI * 2, tilt: (Math.random() - 0.5) * 1.4, spin: Math.random() * 0.02 + 0.005 };
    cubes.push(m);
    coreGroup.add(m);
  }

  // starfield
  const N = innerWidth < 700 ? 900 : 2000;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 6 + Math.random() * 22;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) - 6], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.045, transparent: true, depthWrite: false, sizeAttenuation: true }));
  scene.add(stars);

  const applyTheme = (t) => {
    const p = palette[t];
    core.material.color.set(p.core); core.material.emissive.set(p.emissive);
    shell.material.color.set(p.line);
    ring1.material.color.set(p.ring); ring2.material.color.set(p.line);
    stars.material.color.set(p.stars); stars.material.blending = p.blend; stars.material.opacity = p.starOpacity; stars.material.needsUpdate = true;
  };
  applyTheme(root.dataset.theme);
  listeners.add(applyTheme);

  // layout: core sits behind the hero copy on desktop, centred above on mobile
  const layout = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const mobile = w < 860;
    coreGroup.userData.baseX = mobile ? 0 : 3.3;
    coreGroup.userData.baseY = mobile ? 2.2 : 0;
    coreGroup.scale.setScalar(mobile ? 0.7 : 1.15);
  };
  layout();
  addEventListener('resize', layout);

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  const clock = new THREE.Clock();
  const cam = { x: 0, y: 0 };
  function loop() {
    if (!running) return;
    const t = clock.getElapsedTime();
    const sp = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); // 0..1

    coreGroup.rotation.y = t * 0.15 + sp * Math.PI * 2;
    coreGroup.rotation.x = Math.sin(t * 0.2) * 0.2 + sp * 1.2;
    shell.rotation.y = -t * 0.1;
    core.rotation.z = t * 0.12;
    // drift across the page as you scroll
    coreGroup.position.x = coreGroup.userData.baseX - Math.sin(sp * Math.PI) * 3.3 * (innerWidth < 860 ? 0 : 1);
    coreGroup.position.y = coreGroup.userData.baseY + Math.sin(t * 0.6) * 0.15;
    coreGroup.position.z = -2 - sp * 3;
    // keep the scene subtle once you leave the hero
    canvas.style.opacity = String(1 - Math.min(scrollY / innerHeight, 1) * 0.6);

    cubes.forEach((c) => {
      const d = c.userData;
      const a = d.phase + t * d.speed;
      c.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r * Math.sin(d.tilt), Math.sin(a) * d.r * Math.cos(d.tilt));
      c.rotation.x += d.spin; c.rotation.y += d.spin;
    });
    stars.rotation.y = t * 0.01 + sp * 0.6;

    cam.x += (mouse.x * 0.8 - cam.x) * 0.04;
    cam.y += (-mouse.y * 0.5 - cam.y) * 0.04;
    camera.position.x = cam.x;
    camera.position.y = cam.y;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(loop);
  }
  loop();
}
