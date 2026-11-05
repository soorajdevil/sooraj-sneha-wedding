(function () {
  const W = window.WEDDING;
  const date = new Date(W.datetime);
  const g = W.groom, b = W.bride;
  const gi = g.charAt(0).toUpperCase(), bi = b.charAt(0).toUpperCase();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const d = date.getDate(), m = date.getMonth(), y = date.getFullYear();

  const values = {
    groom: g,
    bride: b,
    couple: `${g} & ${b}`,
    coupleShort: `${g} & ${b}`,
    initials: `${gi}&${bi}`,
    initialsAmp: `${gi} & ${bi}`,
    initialsHeart: `${gi} ♥ ${bi}`,
    dateDots: `${d} · ${months[m]} · ${y}`,
    weekday: days[date.getDay()],
    dateLong: `${d} ${months[m]} ${y}`,
    dateFull: `${days[date.getDay()]}, ${d} ${months[m]} ${y}`,
    dateTime: W.dateTimeText,
    muhurtham: W.muhurtham,
    venueName: W.venueName,
    venueShort: W.venueShort,
    venueArea: W.venueArea,
    address: W.address,
    parking: W.parking,
    heroQuote: W.heroQuote,
    ceremonyNote: W.ceremonyNote,
    story1: W.story1,
    story2: W.story2,
    footerLine: `With love, gratitude and joy — ${g} & ${b}`,
    footerMeta: `${String(d).padStart(2,"0")} · ${String(m+1).padStart(2,"0")} · ${y} • ${W.venueName}`,
  };

  document.title = `${g} & ${b} — Wedding Invitation`;
  document.querySelectorAll("[data-bind]").forEach(el => { el.textContent = values[el.dataset.bind] ?? ""; });
  document.querySelectorAll("[data-href]").forEach(el => { el.href = W[el.dataset.href]; });
  document.getElementById("mapFrame").src =
    "https://maps.google.com/maps?q=" + encodeURIComponent(W.mapQuery) + "&z=15&output=embed";

  if (W.storyPhoto) {
    const sp = document.getElementById("storyPhoto");
    sp.style.backgroundImage = `url('${W.storyPhoto}')`;
    sp.classList.add("has-img");
  }

  /* ---------- Envelope ---------- */
  const envelope = document.getElementById("envelope");
  const screen = document.getElementById("home");
  const wrap = document.getElementById("envWrap");
  const letter = document.getElementById("letter");
  const music = document.getElementById("bgMusic");
  const musicBtn = document.getElementById("musicBtn");
  if (W.music) { music.src = W.music; musicBtn.hidden = false; }
  if (W.introPhoto) {
    screen.style.setProperty("--intro-photo", `url('${W.introPhoto}')`);
    screen.classList.add("has-img");
  }

  const isOpen = () => envelope.classList.contains("open");
  let closedHeight = 0;
  const fitCard = () => { wrap.style.minHeight = Math.max(closedHeight, letter.offsetHeight) + "px"; };

  function openEnvelope() {
    if (isOpen()) return;
    // Lock the current height first so min-height has a start value to animate from
    closedHeight = wrap.offsetHeight;
    wrap.style.minHeight = closedHeight + "px";
    void wrap.offsetHeight;
    fitCard();
    envelope.classList.add("open");
    screen.classList.add("opened");
    if (W.music) music.play().then(() => musicBtn.classList.add("playing")).catch(() => {});
    document.body.classList.remove("locked");
    document.getElementById("nav").classList.add("show");
  }
  function foldBack() {
    envelope.classList.remove("open");
    screen.classList.remove("opened");
    wrap.style.minHeight = closedHeight + "px";
  }
  screen.addEventListener("click", e => { if (!e.target.closest(".env-letter, .scroll-hint")) openEnvelope(); });
  document.getElementById("foldBack").addEventListener("click", foldBack);
  document.getElementById("scrollHint").addEventListener("click", e => {
    if (!isOpen()) { e.preventDefault(); openEnvelope(); }
  });
  window.addEventListener("resize", () => { if (isOpen()) fitCard(); });

  musicBtn.addEventListener("click", () => {
    if (music.paused) { music.play(); musicBtn.classList.add("playing"); }
    else { music.pause(); musicBtn.classList.remove("playing"); }
  });

  /* ---------- Nav ---------- */
  const links = document.getElementById("navLinks");
  document.getElementById("navToggle").addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

  /* ---------- Countdown ---------- */
  const pad = n => String(n).padStart(2, "0");
  function tick() {
    let diff = Math.max(0, date - new Date());
    const s = Math.floor(diff / 1000);
    document.getElementById("cd-days").textContent = pad(Math.floor(s / 86400));
    document.getElementById("cd-hours").textContent = pad(Math.floor(s % 86400 / 3600));
    document.getElementById("cd-mins").textContent = pad(Math.floor(s % 3600 / 60));
    document.getElementById("cd-secs").textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Gallery + Lightbox ---------- */
  const gallery = document.getElementById("gallery");
  const withImg = [];
  W.gallery.forEach(item => {
    const fig = document.createElement("figure");
    fig.className = "tile";
    if (item.src) {
      const idx = withImg.push(item) - 1;
      fig.innerHTML = `<img src="${item.src}" alt="${item.caption}" loading="lazy" />`;
      fig.addEventListener("click", () => openLb(idx));
    } else {
      fig.innerHTML = `<div class="ph">${gi} &amp; ${bi}</div>`;
    }
    fig.insertAdjacentHTML("beforeend", `<figcaption>${item.caption}</figcaption>`);
    gallery.appendChild(fig);
  });

  const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap");
  let cur = 0;
  function openLb(i) { cur = i; lbImg.src = withImg[i].src; lbCap.textContent = withImg[i].caption; lb.hidden = false; }
  function step(n) { if (withImg.length) openLb((cur + n + withImg.length) % withImg.length); }
  document.getElementById("lbClose").onclick = () => (lb.hidden = true);
  document.getElementById("lbPrev").onclick = () => step(-1);
  document.getElementById("lbNext").onclick = () => step(1);
  lb.addEventListener("click", e => { if (e.target === lb) lb.hidden = true; });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------- Copy address ---------- */
  const toast = document.getElementById("toast");
  function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
  document.getElementById("copyAddr").addEventListener("click", () => {
    navigator.clipboard.writeText(W.address).then(() => showToast("Address copied")).catch(() => showToast(W.address));
  });

  /* ---------- Add to calendar ---------- */
  (function () {
    const start = new Date(W.datetime), end = new Date(start.getTime() + 4 * 3600 * 1000);
    const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = `Wedding of ${W.groom} & ${W.bride}`;
    const details = `${W.ceremonyNote || "Wedding celebration"}. ${W.parking || ""}`.trim();
    document.getElementById("gcalBtn").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(W.address)}`;
    // Show the button only while the wishes section (or the footer below it) is on screen
    const float = document.getElementById("calFloat");
    const visible = new Set();
    const watch = new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? visible.add(en.target) : visible.delete(en.target));
      float.classList.toggle("show", visible.size > 0);
    }, { threshold: 0.2 });
    [document.getElementById("wishes"), document.querySelector(".footer")].forEach(el => el && watch.observe(el));
  })();

  /* ---------- Guest wishes ---------- */
  const wishList = document.getElementById("wishList");
  const wishModal = document.getElementById("wishModal");
  const wishText = document.getElementById("wishText");
  const wishName = document.getElementById("wishName");
  const wishSend = document.getElementById("wishSend");
  const LOCAL_KEY = "weddingWishes";
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; } };

  const wishDots = document.getElementById("wishDots");
  const wishCarousel = document.getElementById("wishCarousel");
  let wishData = [], wishIdx = 0, wishTimer = null;

  function showWish(i) {
    const n = wishData.length || 1;
    wishIdx = (i + n) % n;
    wishList.style.transform = `translateX(${-wishIdx * 100}%)`;
    [...wishDots.children].forEach((d, k) => d.classList.toggle("on", k === wishIdx));
  }
  function startWishAuto() {
    clearInterval(wishTimer);
    if (wishData.length > 1) wishTimer = setInterval(() => showWish(wishIdx + 1), 5000);
  }

  function renderWishes(list) {
    wishData = list;
    wishList.textContent = "";
    wishDots.textContent = "";
    wishCarousel.classList.toggle("single", list.length < 2);
    if (!list.length) {
      const card = document.createElement("blockquote");
      card.className = "wish wish-empty";
      const p = document.createElement("p");
      p.textContent = "Be the first to send your wishes.";
      card.appendChild(p);
      wishList.appendChild(card);
    }
    list.forEach((w, k) => {
      const card = document.createElement("blockquote");
      card.className = "wish";
      const msg = document.createElement("p");
      msg.textContent = w.message;
      const by = document.createElement("cite");
      by.textContent = "♡ " + w.name;
      card.append(msg, by);
      wishList.appendChild(card);
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show wish " + (k + 1));
      dot.addEventListener("click", () => { showWish(k); startWishAuto(); });
      wishDots.appendChild(dot);
    });
    showWish(0);
    startWishAuto();
  }

  document.getElementById("wishPrev").addEventListener("click", () => { showWish(wishIdx - 1); startWishAuto(); });
  document.getElementById("wishNext").addEventListener("click", () => { showWish(wishIdx + 1); startWishAuto(); });
  let swipeX = null;
  wishCarousel.addEventListener("pointerdown", e => { swipeX = e.clientX; });
  wishCarousel.addEventListener("pointerup", e => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX; swipeX = null;
    if (Math.abs(dx) > 40) { showWish(wishIdx + (dx < 0 ? 1 : -1)); startWishAuto(); }
  });
  wishCarousel.addEventListener("mouseenter", () => clearInterval(wishTimer));
  wishCarousel.addEventListener("mouseleave", startWishAuto);

  async function loadWishes() {
    if (!W.wishesUrl) return renderWishes(readLocal());
    try {
      const res = await fetch(W.wishesUrl);
      const data = await res.json();
      renderWishes(Array.isArray(data) ? data : []);
    } catch { renderWishes([]); }
  }

  const openWish = () => { wishModal.hidden = false; wishText.focus(); };
  const closeWish = () => { wishModal.hidden = true; };
  document.getElementById("wishOpen").addEventListener("click", openWish);
  document.getElementById("wishClose").addEventListener("click", closeWish);
  wishModal.addEventListener("click", e => { if (e.target === wishModal) closeWish(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !wishModal.hidden) closeWish(); });

  document.getElementById("wishForm").addEventListener("submit", async e => {
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
  // Pick up wishes sent by other guests without a page reload
  if (W.wishesUrl) setInterval(async () => {
    try {
      const data = await (await fetch(W.wishesUrl)).json();
      if (Array.isArray(data) && JSON.stringify(data) !== JSON.stringify(wishData)) renderWishes(data);
    } catch {}
  }, 30000);

  /* ---------- Nav colour follows the section underneath ---------- */
  const navEl = document.getElementById("nav");
  function syncNavTone() {
    const y = navEl.offsetHeight + 2;
    const under = document.elementFromPoint(window.innerWidth / 2, y);
    const sec = under && under.closest("section, footer");
    let tone = "";
    if (sec) {
      if (sec.id === "home") tone = "on-dark";
      else if (sec.tagName === "FOOTER") tone = "on-footer";
      else if (getComputedStyle(sec).backgroundColor === "rgb(255, 255, 255)") tone = "on-white";
    }
    navEl.classList.remove("on-dark", "on-white", "on-footer");
    if (tone) navEl.classList.add(tone);
  }
  window.addEventListener("scroll", syncNavTone, { passive: true });
  window.addEventListener("resize", syncNavTone);
  syncNavTone();

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
})();
