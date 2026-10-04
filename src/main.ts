import { mount } from 'svelte';
import './app/app.css';
import App from './app/App.svelte';
import { prefs } from './app/prefs.svelte';
import { i18n } from './i18n/locale.svelte';

prefs.init();
document.documentElement.lang = i18n.locale;
mount(App, { target: document.getElementById('app')! });

// Offline support in production builds only; the dev server must never be cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // The app works fine without offline support.
  });
}
