import { mount } from 'svelte';
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist-mono/latin-400.css';
import './style.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
