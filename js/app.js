import { cacheDOM } from './dom.js';
import { initAuth } from './auth.js';
import { initUsers } from './users.js';

document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  initAuth(() => {
    initUsers();
  });
});
