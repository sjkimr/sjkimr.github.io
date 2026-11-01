/* Sungjun Kim — portfolio interactions */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ── nav: scrolled state + active section ── */
  const nav = document.querySelector('.nav');
  const links = [...document.querySelectorAll('.nav__links a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    const y = window.scrollY + window.innerHeight * 0.35;
    let cur = null;
    for (const s of sections) if (s.offsetTop <= y) cur = s;
    links.forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === '#' + cur.id));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── reveal on scroll ── */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ── spotlight position on research cards ── */
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ── demo video: play only while visible ── */
  const vio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
    }
  }, { threshold: 0.25 });
  document.querySelectorAll('video[loop]').forEach(v => vio.observe(v));

  /* ── hero point cloud: a drifting depth-scan terrain ── */
  const canvas = document.getElementById('cloud');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, dpr = 1;
  const N = 2000;
  const pts = new Float32Array(N * 3); // x, z, phase
  const ZN = 0.35, ZF = 4.2;
  for (let i = 0; i < N; i++) {
    pts[i * 3] = (Math.random() * 2 - 1) * 3.2;
    pts[i * 3 + 1] = ZN + Math.random() * (ZF - ZN);
    pts[i * 3 + 2] = Math.random() * Math.PI * 2;
  }
  let mx = 0, my = 0, smx = 0, smy = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let t = 0, last = performance.now(), visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); frame(); } });
  const hio = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; if (visible) { last = performance.now(); frame(); } });
  hio.observe(canvas);

  const accent = [255, 106, 61];
  function frame() {
    if (!visible) return;
    const now = performance.now(); const dt = Math.min((now - last) / 1000, 0.05); last = now;
    t += dt;
    smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;

    ctx.clearRect(0, 0, W, H);
    const f = Math.min(W, H) * 0.9;           // focal length
    const cx = W * 0.5 + smx * 18, cy = H * 0.62 + smy * 10;
    const camY = 0.55;                          // camera height above terrain

    for (let i = 0; i < N; i++) {
      let x = pts[i * 3], z = pts[i * 3 + 1] - dt * 0.22, ph = pts[i * 3 + 2];
      if (z < ZN) { z += ZF - ZN; x = (Math.random() * 2 - 1) * 3.2; pts[i * 3] = x; }
      pts[i * 3 + 1] = z;
      // terrain: gentle rolling waves + a faint ridge
      const y = camY
        - 0.16 * Math.sin(x * 1.3 + t * 0.6 + ph * 0.1)
        - 0.10 * Math.cos(z * 1.1 - t * 0.5)
        - 0.06 * Math.sin((x + z) * 2.1 + t);
      const inv = 1 / z;
      const sx = cx + (x + smx * 0.15) * inv * f;
      const sy = cy + (y + smy * 0.05) * inv * f * 0.9;
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const depth = 1 - (z - ZN) / (ZF - ZN);  // 1 near, 0 far
      const a = Math.pow(depth, 1.4) * 0.95 + 0.06;
      const r = 0.6 + depth * 1.9;
      const hot = Math.sin(ph) > 0.93;         // a few accent points
      ctx.fillStyle = hot
        ? `rgba(${accent[0]},${accent[1]},${accent[2]},${Math.min(1, a * 1.3)})`
        : `rgba(230,230,226,${a * 0.8})`;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
