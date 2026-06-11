// ===== AUTH CONFIG — fill in your values =====
const SUPABASE_URL = 'https://wmohjzwzpekyxypbkbld.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kcWb_3EavCxLf_i1MpTGxA_VVcu5ZiX';
// ===== SUPABASE INIT =====
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTH =====
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }
}

function showApp(user) {
  const overlay = document.getElementById('loginOverlay');
  overlay.classList.add('hidden');
  setTimeout(() => { overlay.style.display = 'none'; }, 500);
  document.body.classList.remove('login-open');

  const navUser = document.getElementById('navUser');
  navUser.classList.add('visible');

  const avatar = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  if (avatar) document.getElementById('navAvatar').src = avatar;
  if (name) document.getElementById('navName').textContent = name;
}

function showLogin() {
  const overlay = document.getElementById('loginOverlay');
  overlay.style.display = 'flex';
  overlay.classList.remove('hidden');
  document.getElementById('navUser').classList.remove('visible');
  document.body.classList.add('login-open');
  renderGoogleButton();
}

const GOOGLE_CLIENT_ID = '683725996658-q73u4p19v91b63lck2osfoq5hlvf872a.apps.googleusercontent.com';
let googleButtonRendered = false;
function renderGoogleButton() {
  if (googleButtonRendered || typeof google === 'undefined') return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  });
  google.accounts.id.renderButton(document.getElementById('google-signin-btn'), {
    theme: 'filled_black',
    size: 'large',
    width: 280,
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
  });
  googleButtonRendered = true;
}

async function handleGoogleCredential(response) {
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  const { data, error } = await supabaseClient.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  });
  if (error) {
    errorEl.textContent = 'Помилка входу. Спробуйте ще раз.';
    console.error('Auth error:', error);
    return;
  }
  showApp(data.user);
}

async function signOut() {
  await supabaseClient.auth.signOut();
  if (typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
  showLogin();
}

checkAuth();

// ===== PARTICLES =====
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 10,
    size: Math.random() * 3 + 1,
    speedY: Math.random() * 1.5 + 0.5,
    speedX: (Math.random() - 0.5) * 0.8,
    opacity: Math.random() * 0.6 + 0.2,
    color: Math.random() > 0.5 ? '#FF4713' : '#ff6b35',
    life: 1,
    decay: Math.random() * 0.003 + 0.001,
  };
}

for (let i = 0; i < 60; i++) {
  const p = createParticle();
  p.y = Math.random() * canvas.height;
  particles.push(p);
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    p.y -= p.speedY;
    p.x += p.speedX;
    p.life -= p.decay;

    ctx.save();
    ctx.globalAlpha = p.life * p.opacity;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (p.life <= 0 || p.y < -10) {
      particles[i] = createParticle();
    }
  });

  if (Math.random() < 0.3) particles.push(createParticle());
  if (particles.length > 120) particles.splice(0, 1);

  requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== COUNTDOWN =====
const targetDate = new Date('2026-07-18T00:00:00');

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    document.getElementById('countdown').innerHTML = '<p class="accent" style="font-size:24px;font-weight:900;letter-spacing:4px;">ПОДІЯ ВІДБУВАЄТЬСЯ ЗАРАЗ!</p>';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
  document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);


// ===== PUZZLE GAME =====
const GRID = 4;
const TOTAL = GRID * GRID;

// Emoji grid for the puzzle (Burning Man themed)
const EMOJIS = ['🔥','🎪','🌵','🌑','⚡','🎭','🏕️','🌊','🎆','🌙','🔮','💀','🎸','🌋','🦅','★'];

let tiles = [];
let moveCount = 0;
let timerInterval = null;
let timeLeft = 300;
let puzzleStarted = false;
let puzzleDisabled = false;
let emptyIndex = TOTAL - 1;

function initPuzzle() {
  moveCount = 0;
  timeLeft = 180;
  puzzleStarted = false;
  puzzleDisabled = false;
  document.getElementById('moveCount').textContent = '0';
  document.getElementById('timerDisplay').textContent = '3:00';
  clearInterval(timerInterval);

  tiles = Array.from({ length: TOTAL }, (_, i) => i);
  do {
    tiles = tiles.sort(() => Math.random() - 0.5);
  } while (!isSolvable(tiles));

  emptyIndex = tiles.indexOf(TOTAL - 1);
  renderPuzzle();
  buildPreview();
}

function showPuzzleCompleted() {
  clearInterval(timerInterval);

  const won = localStorage.getItem('bm_puzzle_done');
  const msg = won
    ? "You've already completed<br/>this puzzle.<br/>See you at the burn! 🔥"
    : "Time's up. Game over.<br/>You cannot play anymore.<br/>See you at the festival! 🎪";

  const board = document.getElementById('puzzleBoard');
  board.style.display = 'flex';
  board.style.alignItems = 'center';
  board.style.justifyContent = 'center';
  board.innerHTML = `<p style="text-align:center;color:#FF4713;font-size:18px;font-weight:700;padding:40px 20px;line-height:1.8;">${msg}</p>`;

  document.getElementById('timerDisplay').textContent = '—';
  document.getElementById('moveCount').textContent = '—';
  const shuffleBtn = document.querySelector('.puzzle-info .btn--outline');
  if (shuffleBtn) shuffleBtn.style.display = 'none';
}

function isSolvable(arr) {
  let inv = 0;
  const flat = arr.filter(x => x !== TOTAL - 1);
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inv++;
    }
  }
  const emptyRow = Math.floor(arr.indexOf(TOTAL - 1) / GRID);
  if (GRID % 2 === 0) {
    return (inv + emptyRow) % 2 === 1;
  }
  return inv % 2 === 0;
}

function renderPuzzle() {
  const board = document.getElementById('puzzleBoard');
  board.innerHTML = '';

  tiles.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile' + (val === TOTAL - 1 ? ' puzzle-tile--empty' : '');

    if (val !== TOTAL - 1) {
      tile.textContent = EMOJIS[val];
      if (val === idx) tile.classList.add('puzzle-tile--correct');
      tile.addEventListener('click', () => moveTile(idx));
    }

    board.appendChild(tile);
  });
}

function buildPreview() {
  const preview = document.getElementById('puzzlePreview');
  preview.innerHTML = '';
  EMOJIS.forEach((emoji, i) => {
    const cell = document.createElement('div');
    cell.className = 'preview-cell';
    cell.textContent = i === TOTAL - 1 ? '' : emoji;
    preview.appendChild(cell);
  });
}

function moveTile(idx) {
  if (puzzleDisabled) return;
  const row = Math.floor(idx / GRID);
  const col = idx % GRID;
  const eRow = Math.floor(emptyIndex / GRID);
  const eCol = emptyIndex % GRID;

  const adjacent =
    (Math.abs(row - eRow) === 1 && col === eCol) ||
    (Math.abs(col - eCol) === 1 && row === eRow);

  if (!adjacent) return;

  if (!puzzleStarted) {
    puzzleStarted = true;
    timerInterval = setInterval(() => {
      timeLeft--;
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      document.getElementById('timerDisplay').textContent = `${m}:${String(s).padStart(2, '0')}`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        puzzleDisabled = true;
        showTimeWasted();
      }
    }, 1000);
  }

  [tiles[idx], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[idx]];
  emptyIndex = idx;
  moveCount++;
  document.getElementById('moveCount').textContent = moveCount;

  renderPuzzle();

  if (isSolved()) {
    clearInterval(timerInterval);
    setTimeout(showPrize, 600);
  }
}

function isSolved() {
  return tiles.every((val, idx) => val === idx);
}

function showPrize() {
  localStorage.setItem('bm_puzzle_done', '1');
  const hash = Math.random().toString(36).substring(2, 7).toUpperCase();
  document.getElementById('winPrizeHash').textContent = hash;
  const elapsed = 180 - timeLeft;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  document.getElementById('winBannerStats').textContent =
    `${moveCount} ходів · ${m}:${String(s).padStart(2, '0')} часу`;

  document.getElementById('winBanner').classList.add('active');
  document.getElementById('winBannerOverlay').classList.add('active');

  const results = JSON.parse(localStorage.getItem('bm_puzzle_results') || '[]');
  results.push({ hash, moves: moveCount, time: elapsed, date: new Date().toISOString() });
  localStorage.setItem('bm_puzzle_results', JSON.stringify(results));
}

function closeWinBanner() {
  document.getElementById('winBanner').classList.remove('active');
  document.getElementById('winBannerOverlay').classList.remove('active');
  showPuzzleCompleted();
}

function showTimeWasted() {
  localStorage.setItem('bm_puzzle_lost', '1');
  const results = JSON.parse(localStorage.getItem('bm_puzzle_results') || '[]');
  results.push({ result: 'lost', moves: moveCount, date: new Date().toISOString() });
  localStorage.setItem('bm_puzzle_results', JSON.stringify(results));

  document.getElementById('timeWastedModal').classList.add('active');
  document.getElementById('timeWastedOverlay').classList.add('active');
}

function closeTimeWasted() {
  document.getElementById('timeWastedModal').classList.remove('active');
  document.getElementById('timeWastedOverlay').classList.remove('active');
  showPuzzleCompleted();
}

// Init puzzle on load — lock to one game per user
initPuzzle();
if (localStorage.getItem('bm_puzzle_done') || localStorage.getItem('bm_puzzle_lost')) {
  showPuzzleCompleted();
}

// ===== DONATE =====
const MONOBANK_URL = 'https://send.monobank.ua/jar/9t9GM4YDfK';

document.getElementById('donateLinkBtn').href = MONOBANK_URL;

function selectAmount(btn, amount) {
  document.querySelectorAll('.donate__btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('donateLinkBtn').href = MONOBANK_URL + '?amount=' + amount;
}


// ===== NAV SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (window.scrollY > 80) {
    nav.style.background = 'rgba(10,10,10,0.97)';
  } else {
    nav.style.background = 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)';
  }
});

// ===== INTERSECTION OBSERVER — animate sections =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.about__card, .donate__card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ===== TEAMS EXPAND =====
function toggleTeam(btn) {
  const ul = btn.previousElementSibling;
  const extras = ul.querySelectorAll('.team-member--extra');
  const isExpanded = btn.getAttribute('data-expanded') === '1';
  extras.forEach(function(li) {
    li.style.setProperty('display', isExpanded ? 'none' : 'block', 'important');
  });
  btn.setAttribute('data-expanded', isExpanded ? '0' : '1');
  btn.textContent = isExpanded ? 'Більше' : 'Менше';
}
