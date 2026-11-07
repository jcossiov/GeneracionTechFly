// src/storage.js
const KEY = 'skystrike_scores_v1';
const SETTINGS_KEY = 'skystrike_settings_v1';

export function loadScores() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch (e) { return []; }
}

export function saveScore(entry) {
  const arr = loadScores();
  arr.push(entry);
  arr.sort((a,b) => b.score - a.score);
  const trimmed = arr.slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearScores() {
  localStorage.removeItem(KEY);
}

const BINDINGS_KEY = 'skystrike_bindings_v1';

export function loadBindings() {
  try { return JSON.parse(localStorage.getItem(BINDINGS_KEY) || 'null'); }
  catch (e) { return null; }
}

export function saveBindings(b) {
  localStorage.setItem(BINDINGS_KEY, JSON.stringify(b));
}
const NAME_KEY = 'skystrike_playername_v1';

export function loadPlayerName() {
  try { return localStorage.getItem(NAME_KEY) || ''; }
  catch (e) { return ''; }
}

export function savePlayerName(name) {
  localStorage.setItem(NAME_KEY, name);
}
export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch (e) { return {}; }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
