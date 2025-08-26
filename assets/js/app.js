// Why: รวม logic UI แบบ build-less และโค้ดอ่านง่าย
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Mobile nav toggle
  const navToggle = $('#navToggle');
  const siteNav = $('#siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const open = siteNav.style.display === 'flex';
      siteNav.style.display = open ? 'none' : 'flex';
      navToggle.setAttribute('aria-expanded', String(!open));
    });
  }

  // Smooth scroll + active link highlight
  $$('#siteNav a').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  });
  const sections = ['#profile', '#services', '#knowledge', '#contact'];
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = `#${en.target.id}`;
          $$('#siteNav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 }
  );
  sections.forEach((id) => {
    const el = document.querySelector(id);
    if (el) obs.observe(el);
  });

  // Footer year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(y);

  // Knowledge posts: render from /data/posts.json
  async function loadPosts() {
    const list = document.getElementById('postList');
    const empty = document.getElementById('postEmpty');
    if (!list || !empty) return;

    try {
      const res = await fetch('/data/posts.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('โหลดข้อมูลบทความไม่สำเร็จ');
      const posts = await res.json();
      state.posts = posts;
      renderPosts(posts);
    } catch (err) {
      // Why: ถ้าโหลดไม่สำเร็จให้มี fallback แสดงตัวอย่าง
      const fallback = [
        {
          id: 'sample-acc',
          title: 'ภาษีเงินได้บุคคลธรรมดา: จุดที่มักพลาด',
          tags: ['บัญชี', 'ภาษี'],
          excerpt: 'สรุปประเด็นสำคัญที่ควรตรวจสอบก่อนยื่นแบบ...',
          url: '#',
          date: '2025-01-10'
        },
        {
          id: 'sample-it',
          title: 'เลือกโปรแกรมบัญชีอย่างไรให้เหมาะกับกิจการ',
          tags: ['ไอที', 'บัญชี'],
          excerpt: 'แนวทางเลือกซอฟต์แวร์บัญชีสำหรับ SME พร้อม checklist...',
          url: '#',
          date: '2025-02-02'
        }
      ];
      state.posts = fallback;
      renderPosts(fallback);
      console.warn(err);
    }
  }

  const state = { posts: [] };
  function postCard(p) {
    const tagStr = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join(' ');
    return `
      <article class="card">
        <h3>${p.title}</h3>
        <p class="muted" style="margin-top:-.4rem">${new Date(p.date).toLocaleDateString('th-TH')}</p>
        <p>${p.excerpt}</p>
        <div>${tagStr}</div>
        ${p.url && p.url !== '#' ? `<p><a class="btn btn-secondary" href="${p.url}" target="_blank" rel="noopener">อ่านต่อ</a></p>` : ''}
      </article>
    `;
  }
  function renderPosts(items) {
    const list = document.getElementById('postList');
    const empty = document.getElementById('postEmpty');
    if (!list || !empty) return;
    list.innerHTML = items.map(postCard).join('');
    empty.hidden = items.length > 0;
  }

  // Search filter
  const search = document.getElementById('postSearch');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      const filtered = state.posts.filter((p) =>
        p.title.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
      renderPosts(filtered);
    });
  }

  // Contact form: validate + mailto fallback
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();

      // Basic validation
      const errs = {};
      if (!name) errs.name = 'กรุณากรอกชื่อ';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = 'อีเมลไม่ถูกต้อง';
      if (!message) errs.message = 'กรุณาพิมพ์ข้อความ';

      $$('.error').forEach((el) => (el.textContent = ''));
      Object.entries(errs).forEach(([k, v]) => {
        const el = document.querySelector(`.error[data-for="${k}"]`);
        if (el) el.textContent = v;
      });
      if (Object.keys(errs).length) return;

      // mailto fallback
      const subject = encodeURIComponent('ติดต่อจากเว็บไซต์ developerjear.online');
      const body = encodeURIComponent(`จาก: ${name} <${email}>\n\n${message}`);
      window.location.href = `mailto:somsak.jear@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  loadPosts();
})();