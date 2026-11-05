(function () {
  const W = window.WEDDING;
  const $ = s => document.querySelector(s);
  const date = new Date(W.datetime);
  const g = W.groom, b = W.bride;
  const gi = g.charAt(0).toUpperCase(), bi = b.charAt(0).toUpperCase();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const d = date.getDate(), m = date.getMonth(), y = date.getFullYear();

  /* ---------- Fill in text from config.js ---------- */
  const values = {
    groom: g, bride: b, couple: `${g} & ${b}`, initials: `${gi}&${bi}`, initialsAmp: `${gi} & ${bi}`,
    weekday: days[date.getDay()], dayNum: String(d), monthYear: `${months[m]} ${y}`,
    dateTime: W.dateTimeText, muhurtham: W.muhurtham,
    venueName: W.venueName, venueShort: W.venueShort, venueArea: W.venueArea, address: W.address,
    heroQuote: W.heroQuote, story1: W.story1, story2: W.story2,
    footerLine: `With love, gratitude and joy — ${g} & ${b}`,
    footerMeta: `${String(d).padStart(2,"0")} · ${String(m+1).padStart(2,"0")} · ${y} • ${W.venueName}`,
  };
  document.title = `${g} & ${b} — Wedding Invitation`;
  document.querySelectorAll("[data-bind]").forEach(el => { el.textContent = values[el.dataset.bind] ?? ""; });
  document.querySelectorAll("[data-href]").forEach(el => { el.href = W[el.dataset.href]; });
  $("#mapFrame").src = "https://maps.google.com/maps?q=" + encodeURIComponent(W.mapQuery) + "&z=15&output=embed";
  if (W.storyPhoto) {
    const sp = $("#storyPhoto");
    sp.style.backgroundImage = `url('${W.storyPhoto}')`;
    sp.classList.add("has-img");
  }

  /* ---------- Toast, copy address, music ---------- */
  const toast = $("#toast");
  function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
  $("#copyAddr").addEventListener("click", () => {
    navigator.clipboard.writeText(W.address).then(() => showToast("Address copied")).catch(() => showToast(W.address));
  });
  const music = $("#bgMusic"), musicBtn = $("#musicBtn");
  if (W.music) { music.src = W.music; musicBtn.hidden = false; }
  musicBtn.addEventListener("click", () => {
    if (music.paused) { music.play(); musicBtn.classList.add("playing"); }
    else { music.pause(); musicBtn.classList.remove("playing"); }
  });

  /* ---------- Countdown ---------- */
  const pad = n => String(n).padStart(2, "0");
  function tick() {
    const s = Math.floor(Math.max(0, date - new Date()) / 1000);
    $("#cd-days").textContent = pad(Math.floor(s / 86400));
    $("#cd-hours").textContent = pad(Math.floor(s % 86400 / 3600));
    $("#cd-mins").textContent = pad(Math.floor(s % 3600 / 60));
    $("#cd-secs").textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Gallery + lightbox ---------- */
  const gallery = $("#gallery");
  const withImg = [];
  W.gallery.forEach(item => {
    const fig = document.createElement("figure");
    fig.className = "tile";
    if (item.src) {
      const idx = withImg.push(item) - 1;
      fig.innerHTML = `<img src="${item.src}" alt="${item.caption}" loading="lazy" />`;
      fig.querySelector("img").addEventListener("click", () => openLb(idx));
    } else {
      fig.innerHTML = `<div class="ph">${gi} &amp; ${bi}</div>`;
    }
    fig.insertAdjacentHTML("beforeend", `<figcaption>${item.caption}</figcaption>`);
    gallery.appendChild(fig);
  });
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let cur = 0;
  function openLb(i) { cur = i; lbImg.src = withImg[i].src; lbCap.textContent = withImg[i].caption; lb.hidden = false; }
  function step(n) { if (withImg.length) openLb((cur + n + withImg.length) % withImg.length); }
  $("#lbClose").onclick = () => (lb.hidden = true);
  $("#lbPrev").onclick = () => step(-1);
  $("#lbNext").onclick = () => step(1);
  lb.addEventListener("click", e => { if (e.target === lb) lb.hidden = true; });

  /* ---------- Add to calendar (button shows only near the wishes / closing) ---------- */
  (function () {
    const start = new Date(W.datetime), end = new Date(start.getTime() + 4 * 3600 * 1000);
    const fmt = x => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = `Wedding of ${W.groom} & ${W.bride}`;
    const details = `${W.ceremonyNote || "Wedding celebration"}. ${W.parking || ""}`.trim();
    $("#gcalBtn").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(W.address)}`;
  })();
  function startCalendarWatch() {
    const float = $("#calFloat"), seen = new Set();
    const watch = new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target));
      float.classList.toggle("show", seen.size > 0);
    }, { threshold: 0.2 });
    ["#wishes", "#closing"].forEach(s => watch.observe($(s)));
  }

  /* ---------- Scroll-in reveals (only start working once the scroll is open) ---------- */
  let watching = false;
  function startWatchers() {
    if (watching) return;
    watching = true;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    startCalendarWatch();
  }

  /* =========================================================
     UNTYING & THE UNROLL
     ========================================================= */
  const scroll = $("#scroll"), unroll = $("#unroll"), sheet = $("#sheet"), tie = $("#ribbonBtn"), hint = $("#hint");
  let busy = false;


  /* =========================================================
     THE RIBBON — one continuous satin ribbon, drawn on a canvas.
     Tied: wrapped once round the roll and finished in a bow.
     Untied: the bow is released in stages and the ribbon simply falls
     (a chain of points under gravity), fluttering and twisting as it goes.
     ========================================================= */
  function createRibbon() {
    const cv = document.createElement("canvas");
    cv.id = "ribbonCanvas";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const rollEl = $(".roll.top");
    const DS = 3;                                  // spacing between chain points (local units; roll height = 74)
    const WIDTH = 19;                              // ribbon width (local units)
    const K = [100, 38];                           // the knot
    // sections in ribbon order: tail, loop, up the front, behind the roll, back up the front, loop, tail
    const REL = [0, 0, .62, .5, .38, 0, .05];      // when each section lets go (s after the tap)
    const KNOT_REL = .3;
    const ORDER = [3, 2, 4, 0, 6, 1, 5];           // paint order, back to front
    const SH = [84, 12, 30], BASE = [152, 27, 54], HI = [226, 104, 128];   // satin shadow / body / highlight
    let P = [], range = [], held = [], raf = 0, last = 0, tClick = null, running = false, W = 0, H = 0, dpr = 1;

    function bez(a, b, c, d, n) {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        out.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]);
      }
      return out;
    }
    function shade(t) {
      t = Math.max(0, Math.min(1, t));
      const a = t < .5 ? SH : BASE, b = t < .5 ? BASE : HI, f = t < .5 ? t * 2 : (t - .5) * 2;
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
    }
    function build() {
      const mirror = pts => pts.map(p => [200 - p[0], p[1]]);
      // a bow loop: out along the top, a tight turn at the far end, back along the bottom
      const loop = bez(K, [90, 30], [68, 23], [55, 28], 14)
        .concat(bez([55, 28], [40, 29], [40, 52], [55, 52], 12).slice(1))
        .concat(bez([55, 52], [68, 56], [90, 46], K, 14).slice(1));
      const secs = [
        bez(K, [95, 62], [83, 90], [72, 121], 22).reverse(),   // 0 left tail (tip -> knot)
        loop,                                                  // 1 left loop
        [K, [100, 1]],                                         // 2 up the front of the roll
        [[100, 1], [100, 73]],                                 // 3 behind the roll (hidden)
        [[100, 73], K],                                        // 4 back up the front
        mirror(loop),                                          // 5 right loop
        bez(K, [105, 62], [119, 94], [131, 127], 22),          // 6 right tail (knot -> tip)
      ];
      const raw = [];
      secs.forEach((pts, k) => pts.forEach(p => raw.push({ x: p[0], y: p[1], sec: k })));
      const cum = [0];
      for (let i = 1; i < raw.length; i++) cum.push(cum[i-1] + Math.hypot(raw[i].x - raw[i-1].x, raw[i].y - raw[i-1].y));
      const total = cum[cum.length - 1];
      const span = k => [cum[raw.findIndex(q => q.sec === k)], cum[raw.length - 1 - [...raw].reverse().findIndex(q => q.sec === k)]];
      const spans = secs.map((_, k) => span(k));
      P = []; let j = 0;
      for (let L = 0; L <= total; L += DS) {
        while (j < raw.length - 2 && cum[j+1] < L) j++;
        const f = (L - cum[j]) / ((cum[j+1] - cum[j]) || 1), a = raw[j], b = raw[j+1];
        const lx = a.x + (b.x - a.x) * f, ly = a.y + (b.y - a.y) * f, sec = b.sec;
        const bow = sec < 2 || sec > 4, d = Math.hypot(lx - K[0], ly - K[1]);
        // pin: how much of the full width shows (the bow is gathered where it passes through the knot)
        // lit: extra light on the top face of each loop and on the fold at its far end
        const u = (L - spans[sec][0]) / ((spans[sec][1] - spans[sec][0]) || 1);
        const lit = sec === 1 || sec === 5 ? .16 * Math.cos(Math.PI * u) + .2 * Math.exp(-Math.pow((u - .5) / .1, 2)) : 0;
        P.push({ lx, ly, x: 0, y: 0, px: 0, py: 0, sec, hold: bow && d < 7, sim: false, amp: 0, lit, pin: bow ? Math.max(.36, Math.min(1, .36 + .64 * d / 24)) : 1 });
      }
      range = secs.map((_, k) => { const f = P.findIndex(p => p.sec === k); return f < 0 ? null : [f, P.length - 1 - [...P].reverse().findIndex(p => p.sec === k)]; });
      held = P.filter(p => p.hold);
      tClick = null;
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }

    function run(ts) {
      if (!running) return;
      raf = requestAnimationFrame(run);
      if (W !== window.innerWidth || H !== window.innerHeight) resize();
      const dt = Math.min(.033, (ts - last) / 1000 || .016); last = ts;
      const r = rollEl.getBoundingClientRect();
      const s = r.height / 74, cx = r.left + r.width / 2, top = r.top;
      const tt = tClick === null ? -1 : (ts - tClick) / 1000;
      const now = ts / 1000;

      P.forEach(p => {
        if (!p.sim && tt >= (p.hold ? KNOT_REL : REL[p.sec]) && tt >= 0) {            // let go
          p.sim = true; p.px = p.x - (Math.random() - .5) * 60 * s * dt; p.py = p.y;
        }
        if (p.sim) { p.amp = Math.min(1, p.amp + dt / .9); p.pin += (1 - p.pin) * .05; return; }
        let ox = 0;                                                                   // tied: follow the roll; the tails sway a little
        if (p.sec === 0 || p.sec === 6) {
          const w = Math.min(1, Math.hypot(p.lx - K[0], p.ly - K[1]) / 80);
          ox = Math.sin(now * 1.5 + (p.sec ? 2 : 0)) * 3 * s * w * w;
        }
        p.x = cx + (p.lx - 100) * s + ox; p.y = top + p.ly * s;
        p.px = p.x; p.py = p.y;
      });

      // free parts: gravity, air drag and a little flutter, held together as one ribbon
      const sub = 2, h = dt / sub, g = 1150 * s, rest = DS * s;
      for (let k = 0; k < sub; k++) {
        P.forEach((p, i) => {
          if (!p.sim) return;
          const vx = (p.x - p.px) * .984, vy = (p.y - p.py) * .984;
          p.px = p.x; p.py = p.y;
          p.x += vx + Math.sin(now * 2.6 + i * .21) * 700 * s * h * h;
          p.y += vy + g * h * h;
        });
        for (let i = 1; i < P.length - 1; i++) {                                       // a ribbon resists sharp kinks
          const p = P[i];
          if (!p.sim) continue;
          const a = P[i-1], b = P[i+1];
          p.x += ((a.x + b.x) / 2 - p.x) * .2; p.y += ((a.y + b.y) / 2 - p.y) * .2;
        }
        for (let it = 0; it < 12; it++) {
          for (let i = 0; i < P.length - 1; i++) {
            const a = P[i], b = P[i+1];
            if (!a.sim && !b.sim) continue;
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
            if (d === 0) continue;
            const f = (d - rest) / d;
            if (!a.sim) { b.x -= dx * f; b.y -= dy * f; }
            else if (!b.sim) { a.x += dx * f; a.y += dy * f; }
            else { a.x += dx * f * .5; a.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; }
          }
        }
      }
      draw(r, s, tt, now);
      if (tt > 6 || (tt > 1 && P.every(p => p.sim && p.y > H + 80 * s))) end();
    }

    function roundRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    function draw(r, s, tt, now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      const n = P.length, G = new Array(n), EDGE = "rgba(58,4,18,.5)";
      // geometry of the band at every point: its two edges and how the light catches it
      for (let i = 0; i < n; i++) {
        const p = P[i], a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
        let tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty);
        if (len < .01) { tx = b.x - p.x; ty = b.y - p.y; len = Math.hypot(tx, ty) || 1; }
        tx /= len; ty /= len;
        const c = Math.cos(p.amp * 2 * Math.sin(i * .1 + now * 1.8));                // twist while falling
        const hw = WIDTH / 2 * s * p.pin * Math.max(.16, Math.abs(c));
        let t = .26 + .5 * (.5 + .5 * Math.sin(2 * Math.atan2(ty, tx) - .35)) + .04 * Math.sin(i * .45) + p.lit;
        if (!p.sim && (p.sec === 2 || p.sec === 4)) t = .22 + .55 * Math.sin(Math.PI * p.ly / 74);   // follows the curve of the roll
        if (c < 0) t *= .5;                                                          // the reverse side is duller
        G[i] = { lx: p.x - ty * hw, ly: p.y + tx * hw, rx: p.x + ty * hw, ry: p.y - tx * hw, hw, t };
      }
      // a band between two fractions of the width (1 = one edge, -1 = the other)
      const outline = (a, b, f1, f2, ox, oy) => {
        ctx.beginPath();
        for (let i = a; i <= b; i++) ctx.lineTo(P[i].x + (G[i].lx - P[i].x) * f1 + ox, P[i].y + (G[i].ly - P[i].y) * f1 + oy);
        for (let i = b; i >= a; i--) ctx.lineTo(P[i].x + (G[i].lx - P[i].x) * f2 + ox, P[i].y + (G[i].ly - P[i].y) * f2 + oy);
        ctx.closePath();
      };
      const tip = (i, j) => {                                                        // swallow-tail cut at the end of a tail
        const p = P[i], q = P[j], g = G[i];
        let dx = p.x - q.x, dy = p.y - q.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
        const L = g.hw * 1.5;
        ctx.beginPath();
        ctx.moveTo(g.lx, g.ly); ctx.lineTo(g.lx + dx * L, g.ly + dy * L); ctx.lineTo(p.x + dx * L * .15, p.y + dy * L * .15);
        ctx.lineTo(g.rx + dx * L, g.ry + dy * L); ctx.lineTo(g.rx, g.ry);
        ctx.fillStyle = shade(g.t); ctx.fill();
        ctx.strokeStyle = EDGE; ctx.lineWidth = Math.max(.6, .8 * s); ctx.stroke();
      };
      ORDER.forEach(k => {
        if (!range[k]) return;
        const a = Math.max(0, range[k][0] - 1), b = range[k][1];
        ctx.save();
        if (k === 3) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(r.left, r.top, r.width, r.height); ctx.clip("evenodd"); }   // behind the roll
        outline(a, b, 1, -1, 1.4 * s, 2.6 * s); ctx.fillStyle = "rgba(0,0,0,.24)"; ctx.fill();     // soft shadow
        for (let i = a; i < b; i++) {                                                               // satin body
          const g = G[i], h2 = G[i + 1];
          ctx.beginPath(); ctx.moveTo(g.lx, g.ly); ctx.lineTo(h2.lx, h2.ly); ctx.lineTo(h2.rx, h2.ry); ctx.lineTo(g.rx, g.ry); ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle = shade((g.t + h2.t) / 2); ctx.lineWidth = .8; ctx.fill(); ctx.stroke();
        }
        outline(a, b, .78, .22, 0, 0); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill();        // off-centre satin sheen
        ctx.lineWidth = Math.max(.5, .7 * s);
        ctx.strokeStyle = "rgba(255,196,208,.42)";                                                  // one edge catches the light…
        ctx.beginPath(); for (let i = a; i <= b; i++) ctx.lineTo(G[i].lx, G[i].ly); ctx.stroke();
        ctx.strokeStyle = EDGE;                                                                     // …the other falls into shade
        ctx.beginPath(); for (let i = a; i <= b; i++) ctx.lineTo(G[i].rx, G[i].ry); ctx.stroke();
        if (k === 0) tip(0, 1);
        if (k === 6) tip(n - 1, n - 2);
        ctx.restore();
      });
      // the knot — the band that gathers the bow — holds until it is pulled loose
      const kt = tt < 0 ? 0 : (tt - KNOT_REL) / .25;
      if (kt < 1 && held.length) {
        const kx = held.reduce((v, p) => v + p.x, 0) / held.length, ky = held.reduce((v, p) => v + p.y, 0) / held.length;
        const kw = 12.5 * s, kh = 19 * s, x0 = kx - kw / 2, y0 = ky - kh / 2;
        const gr = ctx.createLinearGradient(x0, 0, x0 + kw, 0);
        gr.addColorStop(0, shade(.12)); gr.addColorStop(.35, shade(.82)); gr.addColorStop(.7, shade(.45)); gr.addColorStop(1, shade(.1));
        ctx.globalAlpha = 1 - Math.max(0, kt);
        roundRect(x0 + 1.2 * s, y0 + 2.2 * s, kw, kh, 3.5 * s); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fill();
        roundRect(x0, y0, kw, kh, 3.5 * s); ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = EDGE; ctx.lineWidth = Math.max(.6, .8 * s); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    function start() {
      if (running) return;
      running = true; last = performance.now(); raf = requestAnimationFrame(run);
    }
    function end() { running = false; cancelAnimationFrame(raf); cv.style.display = "none"; }
    return {
      show() { build(); resize(); cv.style.display = "block"; start(); },
      untie() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { end(); return; }
        tClick = performance.now();
      },
    };
  }
  const ribbon = createRibbon();
  ribbon.show();

  function openScroll() {
    if (busy || !scroll.classList.contains("closed")) return;
    busy = true;
    scroll.classList.add("cutting");           // the bow is undone and the ribbon slips off
    ribbon.untie();
    if (navigator.vibrate) navigator.vibrate(30);
    hint.classList.add("gone");
    if (W.music && music.paused) music.play().then(() => musicBtn.classList.add("playing")).catch(() => {});
    setTimeout(() => {
      const h = sheet.offsetHeight;
      document.body.classList.remove("locked");
      scroll.classList.remove("closed");
      unroll.style.height = "0px"; void unroll.offsetHeight;
      unroll.style.height = h + "px";
      const done = () => { unroll.style.height = ""; unroll.classList.add("free"); scroll.classList.remove("cutting"); busy = false; startWatchers(); };
      let finished = false;
      unroll.addEventListener("transitionend", e => { if (e.target === unroll && !finished) { finished = true; done(); } });
      setTimeout(() => { if (!finished) { finished = true; done(); } }, 3600);
    }, 1250);
  }

  function rollUp() {
    if (busy || scroll.classList.contains("closed")) return;
    busy = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const h = unroll.offsetHeight;
      unroll.classList.remove("free");
      unroll.style.height = h + "px"; void unroll.offsetHeight;
      document.body.classList.add("locked");
      scroll.classList.add("closed");
      unroll.style.height = "0px";
      setTimeout(() => {
        scroll.classList.remove("cutting");
        hint.classList.remove("gone");
        ribbon.show();
        busy = false;
      }, 3000);
    }, 700);
  }

  tie.addEventListener("click", openScroll);
  $(".roll.top").addEventListener("click", e => { if (e.target.closest(".tube, .rod")) openScroll(); });
  $("#rollUp").addEventListener("click", rollUp);

  /* ---------- Guest wishes (same backend as the other versions) ---------- */
  const wishList = $("#wishList"), wishModal = $("#wishModal"), wishText = $("#wishText"), wishName = $("#wishName"), wishSend = $("#wishSend");
  const wishDots = $("#wishDots"), wishCarousel = $("#wishCarousel");
  const LOCAL_KEY = "weddingWishes";
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; } };
  let wishData = [], wishIdx = 0, wishTimer = null;

  function showWish(i) {
    const n = wishData.length || 1;
    wishIdx = (i + n) % n;
    wishList.style.transform = `translateX(${-wishIdx * 100}%)`;
    [...wishDots.children].forEach((dot, k) => dot.classList.toggle("on", k === wishIdx));
  }
  function startWishAuto() {
    clearInterval(wishTimer);
    if (wishData.length > 1) wishTimer = setInterval(() => showWish(wishIdx + 1), 5000);
  }
  function renderWishes(list) {
    wishData = list;
    wishList.textContent = ""; wishDots.textContent = "";
    wishCarousel.classList.toggle("single", list.length < 2);
    if (!list.length) {
      const card = document.createElement("blockquote");
      card.className = "wish wish-empty";
      const p = document.createElement("p");
      p.textContent = "Be the first to send your wishes.";
      card.appendChild(p); wishList.appendChild(card);
    }
    list.forEach((w, k) => {
      const card = document.createElement("blockquote");
      card.className = "wish";
      const msg = document.createElement("p"); msg.textContent = w.message;
      const by = document.createElement("cite"); by.textContent = "♡ " + w.name;
      card.append(msg, by); wishList.appendChild(card);
      const dot = document.createElement("button");
      dot.type = "button"; dot.setAttribute("aria-label", "Show wish " + (k + 1));
      dot.addEventListener("click", () => { showWish(k); startWishAuto(); });
      wishDots.appendChild(dot);
    });
    showWish(0); startWishAuto();
  }
  $("#wishPrev").addEventListener("click", () => { showWish(wishIdx - 1); startWishAuto(); });
  $("#wishNext").addEventListener("click", () => { showWish(wishIdx + 1); startWishAuto(); });
  let wx = null;
  wishCarousel.addEventListener("pointerdown", e => { wx = e.clientX; });
  wishCarousel.addEventListener("pointerup", e => {
    if (wx === null) return;
    const dx = e.clientX - wx; wx = null;
    if (Math.abs(dx) > 40) { showWish(wishIdx + (dx < 0 ? 1 : -1)); startWishAuto(); }
  });
  wishCarousel.addEventListener("mouseenter", () => clearInterval(wishTimer));
  wishCarousel.addEventListener("mouseleave", startWishAuto);

  async function loadWishes() {
    if (!W.wishesUrl) return renderWishes(readLocal());
    try {
      const data = await (await fetch(W.wishesUrl)).json();
      renderWishes(Array.isArray(data) ? data : []);
    } catch { renderWishes([]); }
  }
  const openWish = () => { wishModal.hidden = false; wishText.focus(); };
  const closeWish = () => { wishModal.hidden = true; };
  $("#wishOpen").addEventListener("click", openWish);
  $("#wishClose").addEventListener("click", closeWish);
  wishModal.addEventListener("click", e => { if (e.target === wishModal) closeWish(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeWish(); lb.hidden = true; } });

  $("#wishForm").addEventListener("submit", async e => {
    e.preventDefault();
    const wish = { name: wishName.value.trim(), message: wishText.value.trim() };
    if (!wish.name || !wish.message) return;
    wishSend.disabled = true;
    try {
      if (W.wishesUrl) {
        await fetch(W.wishesUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(wish) });
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify([wish, ...readLocal()]));
      }
      renderWishes([wish, ...wishData]);
      wishText.value = ""; wishName.value = "";
      closeWish();
      showToast("Thank you for your wishes!");
    } catch { showToast("Could not send — please try again"); }
    wishSend.disabled = false;
  });
  loadWishes();
  if (W.wishesUrl) setInterval(async () => {
    try {
      const data = await (await fetch(W.wishesUrl)).json();
      if (Array.isArray(data) && JSON.stringify(data) !== JSON.stringify(wishData)) renderWishes(data);
    } catch {}
  }, 30000);
})();
