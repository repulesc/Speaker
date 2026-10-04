import { mount } from 'svelte';
import App from './app/App.svelte';
import './app/tokens.css';

mount(App, { target: document.getElementById('app')! });
