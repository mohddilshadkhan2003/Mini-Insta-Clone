const API_BASE = 'http://localhost:5000';
const root = document.getElementById('app');
const state = {
  token: localStorage.getItem('token') || '',
  user: null,
  posts: [],
  suggestions: [],
  query: '',
  results: { users: [], posts: [] },
  message: '',
  messageType: 'error',
  loading: false,
  page: 'feed'
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function readUserFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

function showMessage(message, type = 'error') {
  state.message = message;
  state.messageType = type;
  render();
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || 'Unexpected server response' }; }
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function saveSession(token) {
  state.token = token;
  state.user = readUserFromToken(token);
  localStorage.setItem('token', token);
  state.message = '';
}

function formatTime(date) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('/') ? `${API_BASE}${path}` : path;
}

function renderAuth() {
  const signup = state.page === 'signup';
  root.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-mark" aria-hidden="true">◎</div>
        <h1>Mini Insta Clone</h1>
        <p class="muted">A little place to share your moments.</p>
        ${state.message ? `<p class="notice ${state.messageType}" role="alert">${escapeHtml(state.message)}</p>` : ''}
        <form id="auth-form">
          ${signup ? `<label>Username<input name="username" minlength="3" required autocomplete="username" placeholder="Choose a username"></label>` : ''}
          <label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
          <label>Password<input name="password" type="password" minlength="6" required autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="At least 6 characters"></label>
          <button class="button primary full" type="submit">${signup ? 'Create account' : 'Log in'}</button>
        </form>
        <p class="auth-switch">${signup ? 'Already have an account?' : 'New to Mini Insta?'} <button class="text-button" data-action="auth-toggle">${signup ? 'Log in' : 'Sign up'}</button></p>
      </section>
    </main>`;
}

function renderPost(post) {
  const image = imageUrl(post.image_url);
  const comments = (post.recentComments || []).map((comment) => `
    <p class="comment"><strong>${escapeHtml(comment.username)}</strong> ${escapeHtml(comment.comment)}</p>`).join('');
  return `
    <article class="post-card">
      <header class="post-header">
        <div class="avatar">${escapeHtml((post.username || '?').charAt(0).toUpperCase())}</div>
        <strong>${escapeHtml(post.username || 'user')}</strong>
      </header>
      <img class="post-image" src="${escapeHtml(image)}" alt="${escapeHtml(post.caption || 'Shared photo')}" loading="lazy">
      <div class="post-content">
        <div class="post-actions">
          <button class="icon-button ${post.isLiked ? 'is-liked' : ''}" data-action="like" data-id="${Number(post.id)}" aria-label="${post.isLiked ? 'Unlike' : 'Like'} post">${post.isLiked ? '♥' : '♡'}</button>
          <span class="muted">${Number(post.likesCount) || 0} likes</span>
        </div>
        <p class="caption"><strong>${escapeHtml(post.username || 'user')}</strong> ${escapeHtml(post.caption || '')}</p>
        ${comments}
        <time class="muted small">${escapeHtml(formatTime(post.created_at))}</time>
      </div>
    </article>`;
}

function renderSidebar() {
  const suggestions = state.suggestions.length
    ? state.suggestions.map((user) => `<li><div class="avatar small-avatar">${escapeHtml((user.username || '?').charAt(0).toUpperCase())}</div><div class="suggestion-name"><strong>${escapeHtml(user.username)}</strong><small>${Number(user.followerCount) || 0} followers</small></div><button class="text-button" data-action="follow" data-id="${Number(user.id)}">Follow</button></li>`).join('')
    : '<li class="muted">No suggestions yet.</li>';
  return `<aside class="sidebar"><div class="account-card"><div class="avatar">${escapeHtml((state.user?.username || '?').charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(state.user?.username || '')}</strong><small class="muted">Your account</small></div></div><section class="suggestions"><h2>Suggestions for you</h2><ul>${suggestions}</ul></section></aside>`;
}

function renderSearch() {
  if (!state.query.trim()) return '';
  const users = state.results.users || [];
  const posts = state.results.posts || [];
  return `<section class="search-results"><h2>Search results</h2><h3>People</h3>${users.length ? users.map((user) => `<div class="result-row"><strong>${escapeHtml(user.username)}</strong><button class="text-button" data-action="follow" data-id="${Number(user.id)}">Follow</button></div>`).join('') : '<p class="muted">No people found.</p>'}<h3>Posts</h3>${posts.length ? posts.map((post) => `<div class="result-row"><span><strong>${escapeHtml(post.username)}</strong> ${escapeHtml(post.caption || '')}</span></div>`).join('') : '<p class="muted">No posts found.</p>'}</section>`;
}

function renderApp() {
  root.innerHTML = `
    <header class="topbar"><div class="topbar-inner">
      <a class="wordmark" href="#feed" data-action="home">Mini Insta</a>
      <input id="search-input" class="search-input" type="search" placeholder="Search people and posts" value="${escapeHtml(state.query)}" aria-label="Search people and posts">
      <div class="topbar-actions"><button class="button secondary" data-action="logout">Log out</button></div>
    </div></header>
    <main class="layout">
      <section class="feed-column">
        ${state.message ? `<p class="notice ${state.messageType}" role="status">${escapeHtml(state.message)}</p>` : ''}
        <section class="composer"><h1>Share a moment</h1><form id="post-form"><label class="file-label">Choose an image<input name="image" type="file" accept="image/*" required></label><label class="visually-hidden" for="caption-input">Caption</label><textarea id="caption-input" name="caption" maxlength="2200" placeholder="Write a caption..."></textarea><button class="button primary" type="submit">Share post</button></form></section>
        ${renderSearch()}
        <div id="feed">${state.loading ? '<p class="empty-state">Loading your feed…</p>' : state.posts.length ? state.posts.map(renderPost).join('') : '<section class="empty-state"><h2>Your feed is quiet</h2><p>Follow someone to see their posts here, or create a post of your own.</p></section>'}</div>
      </section>
      ${renderSidebar()}
    </main>`;
}

function render() {
  if (!state.token || !state.user) renderAuth();
  else renderApp();
}

async function loadDashboard() {
  if (!state.token) return;
  state.loading = true;
  render();
  try {
    const [feed, suggestionData] = await Promise.all([
      api('/api/feed?page=1'),
      api('/api/explore/suggestions')
    ]);
    state.posts = feed.posts || [];
    state.suggestions = suggestionData.suggestions || [];
    state.message = '';
  } catch (error) {
    state.message = error.message;
    state.messageType = 'error';
    if (/token|authorized|authentication/i.test(error.message)) {
      localStorage.removeItem('token');
      state.token = '';
      state.user = null;
    }
  } finally {
    state.loading = false;
    render();
  }
}

async function submitAuth(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const mode = state.page === 'signup' ? 'signup' : 'login';
  try {
    const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) });
    saveSession(result.token);
    await loadDashboard();
  } catch (error) {
    showMessage(error.message);
  }
}

async function createPost(form) {
  const data = new FormData(form);
  try {
    await api('/api/posts', { method: 'POST', body: data });
    state.message = 'Your post was shared.';
    state.messageType = 'success';
    form.reset();
    await loadDashboard();
  } catch (error) {
    showMessage(error.message);
  }
}

async function toggleLike(id) {
  const post = state.posts.find((item) => Number(item.id) === id);
  if (!post) return;
  try {
    await api(`/api/posts/${id}/${post.isLiked ? 'unlike' : 'like'}`, { method: 'POST' });
    post.isLiked = !post.isLiked;
    post.likesCount = Math.max(0, Number(post.likesCount || 0) + (post.isLiked ? 1 : -1));
    render();
  } catch (error) { showMessage(error.message); }
}

async function followUser(id) {
  try {
    await api(`/api/users/${id}/follow`, { method: 'POST' });
    state.suggestions = state.suggestions.filter((user) => Number(user.id) !== id);
    state.message = 'You are now following this user.';
    state.messageType = 'success';
    await loadDashboard();
  } catch (error) { showMessage(error.message); }
}

let searchTimer;
async function search(query) {
  state.query = query;
  if (!query.trim()) {
    state.results = { users: [], posts: [] };
    render();
    return;
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    try {
      state.results = await api(`/api/explore/search?q=${encodeURIComponent(query)}`);
      render();
      const input = document.getElementById('search-input');
      input?.focus();
      if (input) input.setSelectionRange(query.length, query.length);
    } catch (error) { showMessage(error.message); }
  }, 250);
}

root.addEventListener('submit', (event) => {
  if (event.target.id === 'auth-form') {
    event.preventDefault();
    submitAuth(event.target);
  } else if (event.target.id === 'post-form') {
    event.preventDefault();
    createPost(event.target);
  }
});

root.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'auth-toggle') {
    state.page = state.page === 'signup' ? 'login' : 'signup';
    state.message = '';
    render();
  } else if (action === 'logout') {
    localStorage.removeItem('token');
    state.token = '';
    state.user = null;
    state.posts = [];
    state.page = 'login';
    state.message = 'You have been logged out.';
    render();
  } else if (action === 'like') {
    toggleLike(Number(button.dataset.id));
  } else if (action === 'follow') {
    followUser(Number(button.dataset.id));
  } else if (action === 'home') {
    event.preventDefault();
    state.query = '';
    state.results = { users: [], posts: [] };
    loadDashboard();
  }
});

root.addEventListener('input', (event) => {
  if (event.target.id === 'search-input') search(event.target.value);
});

(function start() {
  state.user = readUserFromToken(state.token);
  if (!state.user) {
    localStorage.removeItem('token');
    state.token = '';
  }
  render();
  if (state.user) loadDashboard();
})();
