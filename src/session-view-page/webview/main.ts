import { mount } from 'svelte';
import App from './App.svelte';
import './styles.css';

console.log('[BCC Webview] main.ts loaded');

const target = document.getElementById('root');
console.log('[BCC Webview] target element:', target);

if (target) {
  console.log('[BCC Webview] Mounting Svelte app...');
  mount(App, { target });
  console.log('[BCC Webview] Svelte app mounted');
}
