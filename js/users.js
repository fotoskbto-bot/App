export function initUsers(){
 const session=JSON.parse(localStorage.getItem('session'));
 if(session.role!=='admin'){
   document.body.innerHTML='<h3 class="text-center mt-5">Acceso restringido</h3>';
 }
}
