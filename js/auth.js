import { DOM } from './dom.js';

const USERS=[
 {user:'admin',pass:'admin123',role:'admin'},
 {user:'coach',pass:'coach123',role:'coach'}
];

export function initAuth(onSuccess){
 if(localStorage.getItem('session')){
   DOM.loginView.style.display='none';
   DOM.appView.style.display='block';
   onSuccess();
   return;
 }
 DOM.loginForm.addEventListener('submit',e=>{
   e.preventDefault();
   const u=loginUser.value;
   const p=loginPass.value;
   const found=USERS.find(x=>x.user===u && x.pass===p);
   if(!found) return alert('Credenciales inválidas');
   localStorage.setItem('session',JSON.stringify(found));
   location.reload();
 });
}
