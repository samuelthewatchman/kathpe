// ---------- Dark mode ----------
function applyTheme() {
  const saved = localStorage.getItem('kathTheme') || 'light';
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('kathTheme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('kathTheme', 'dark');
  }
  updateToggleButtonLabel();
}

function updateToggleButtonLabel() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
}

// Apply saved theme immediately (before page paints, to avoid flash)
applyTheme();

// ---------- Build the nav bar extras (theme toggle + active link) ----------
document.addEventListener('DOMContentLoaded', function () {
  const nav = document.querySelector('nav');
  if (nav) {
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.type = 'button';
    btn.addEventListener('click', toggleTheme);
    nav.appendChild(btn);
    updateToggleButtonLabel();
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});
// ---------- Search / filter topics ----------
document.getElementById('topicSearch')?.addEventListener('input', function (e) {
  const query = e.target.value.trim().toLowerCase();
  const cards = document.querySelectorAll('#topicsGrid .card');

  cards.forEach(card => {
    const name = card.getAttribute('data-name') || '';
    const visible = name.includes(query);
    card.style.display = visible ? '' : 'none';
  });
});
// ---------- Text-to-speech ----------
let currentUtterance = null;

function speakPage() {
  const btn = document.querySelector('.speak-btn');
  const contentBox = document.querySelector('.content-box');
  if (!contentBox) return;

  // If already speaking, stop it (acts as a toggle)
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btn) {
      btn.textContent = '🔊 Read this page aloud';
      btn.classList.remove('speaking');
    }
    return;
  }

  // Grab the visible text of the content box, skip the button itself
  const clone = contentBox.cloneNode(true);
  clone.querySelectorAll('.speak-btn').forEach(el => el.remove());
  const text = clone.innerText;

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;

  currentUtterance.onend = () => {
    if (btn) {
      btn.textContent = '🔊 Read this page aloud';
      btn.classList.remove('speaking');
    }
  };

  if (btn) {
    btn.textContent = '⏹️ Stop reading';
    btn.classList.add('speaking');
  }

  window.speechSynthesis.speak(currentUtterance);
}
// ---------- Smooth fade transition between pages ----------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');

    // Skip external links, WhatsApp, mailto, anchors, and new-tab links
    if (
      !href ||
      href.startsWith('http') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      link.target === '_blank'
    ) {
      return;
    }

    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = href;
      }, 250); // matches the CSS transition time
    });
  });
});
// ---------- Smooth eased scrolling ----------
(function () {
  let targetY = window.scrollY;
  let currentY = window.scrollY;
  let ticking = false;
  const ease = 0.2; // lower = smoother/slower, higher = snappier

  function smoothScrollLoop() {
    currentY += (targetY - currentY) * ease;

    if (Math.abs(targetY - currentY) < 0.5) {
      currentY = targetY;
      ticking = false;
    } else {
      requestAnimationFrame(smoothScrollLoop);
    }

    window.scrollTo(0, currentY);
  }

  window.addEventListener('wheel', function (e) {
    // Let normal scrolling happen inside scrollable inner elements (like the feedback iframe)
    if (e.target.closest('iframe')) return;

    e.preventDefault();
    targetY += e.deltaY;

    // Clamp to page bounds
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    targetY = Math.max(0, Math.min(targetY, maxY));

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(smoothScrollLoop);
    }
  }, { passive: false });

  // Keep targetY in sync if user scrolls via keyboard, scrollbar drag, etc.
  window.addEventListener('scroll', function () {
    if (!ticking) {
      targetY = window.scrollY;
      currentY = window.scrollY;
    }
  });
})();