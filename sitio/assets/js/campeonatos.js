import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,addDoc,updateDoc,deleteDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const firebaseConfig={apiKey:'AIzaSyCoKEKqgzYSiCGd-FoFdH6p_5PbDWil8zo',authDomain:'cronos-racing.firebaseapp.com',projectId:'cronos-racing',storageBucket:'cronos-racing.firebasestorage.app',messagingSenderId:'282283581966',appId:'1:282283581966:web:e70b06ab7e7a0a8686925f',measurementId:'G-TFBDNZZ0C3'};
const app=initializeApp(firebaseConfig), auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let champs=[],isAdmin=false,user=null;
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const ms=s=>{if(!/^\d{1,3}:[0-5]\d\.\d{3}$/.test(String(s||'')))return NaN;const [m,part]=s.split(':'),[sec,milli]=part.split('.');return +m*60000 + +sec*1000 + +milli};
const showMs=n=>`${String(Math.floor(n/60000)).padStart(2,'0')}:${String(Math.floor(n%60000/1000)).padStart(2,'0')}.${String(n%1000).padStart(3,'0')}`;
const statusLabel={proximo:'Próximo',en_curso:'En curso',finalizado:'Finalizado'};
const message=(txt,id='adminMsg')=>{const el=$(id);if(el)el.textContent=txt};
if(new URLSearchParams(location.search).get('app')==='1')document.body.classList.add('app-mode');
// Compatibilidad con los grupos guardados en V16. Cada piloto se muestra una sola vez por ID.
function pilotsOf(track){const seen=new Set(),out=[];const add=p=>{const id=p.id||`legacy:${p.name}`;if(seen.has(id))return;seen.add(id);out.push({...p,id,laps:Array.isArray(p.laps)?p.laps:[]})};
 (track.pilots||[]).forEach(add);(track.groups||[]).forEach(g=>(g.pilots||[]).forEach(add));return out;
}
function best(p){const a=(p.laps||[]).map(ms).filter(Number.isFinite);return a.length?Math.min(...a):Infinity}
function ranked(track){return pilotsOf(track).filter(p=>Number.isFinite(best(p))).sort((a,b)=>best(a)-best(b)||a.name.localeCompare(b.name,'es'))}
function grouped(track){const ordered=ranked(track),groups=[];for(let i=0;i<ordered.length;i+=5)groups.push({name:`Grupo ${groups.length+1}`,pilots:ordered.slice(i,i+5)});return groups}
function groupTable(group,offset){const pilots=group.pilots;
 const max=Math.max(4,...pilots.map(p=>p.laps.length));
 const lines=pilots.map((p,i)=>{const nums=p.laps.map(ms),min=Math.min(...nums),maxVal=Math.max(...nums);
  const cells=Array.from({length:max},(_,k)=>{const t=p.laps[k]||'—',v=ms(t),cl=Number.isFinite(v)?(v===min?'champ-best':v===maxVal?'champ-worst':''):'';return `<td class="${cl}">${esc(t)}</td>`}).join('');
  return `<tr><td>${offset+i+1}</td><td>${esc(p.name)}</td>${cells}<td class="champ-best">${showMs(min)}</td></tr>`}).join('');
 return `<div class="champ-group"><h4>${esc(group.name)} · ${pilots.length}/5 pilotos</h4><div class="champ-scroll"><table class="champ-table"><thead><tr><th>Pos.</th><th>Piloto</th>${Array.from({length:max},(_,i)=>`<th>Vuelta ${i+1}</th>`).join('')}<th>Mejor tiempo</th></tr></thead><tbody>${lines}</tbody></table></div><small class="champ-best">Verde: mejor vuelta</small> · <small class="champ-worst">Rojo: peor vuelta</small></div>`
}
function card(c,detail){const st=statusLabel[c.status]||'Campeonato';return `<article class="champ-card"><span class="champ-pill ${c.status==='finalizado'?'red':'green'}">${esc(st)}</span><span class="champ-pill">${esc(c.game||'Juego por definir')}</span><h3>${esc(c.name)}</h3><p>${esc(c.description||'Información y resultados del campeonato.')}</p><p>📅 ${esc(c.date||'Fecha por definir')}</p>${detail?((c.tracks||[]).length?(c.tracks||[]).map(t=>{const gs=grouped(t),pending=pilotsOf(t).filter(p=>!Number.isFinite(best(p)));return `<details class="champ-track" open><summary>🏁 ${esc(t.name)} · ${gs.length} grupos automáticos · ${ranked(t).length} pilotos clasificados</summary>${gs.length?gs.map((g,i)=>groupTable(g,i*5)).join(''):'<p class="hint">Sin tiempos registrados.</p>'}${pending.length?`<p class="hint">Pendientes de cronometrar: ${pending.map(p=>esc(p.name)).join(', ')}</p>`:''}</details>`}).join(''):'<div class="champ-empty">Pistas y resultados pendientes de publicación.</div>'):''}</article>`}
function render(){const arr=[...champs].sort((a,b)=>(a.date||'').localeCompare(b.date||''));$('upcoming').innerHTML=arr.filter(c=>c.status==='proximo').map(c=>card(c,false)).join('')||'<div class="champ-empty">Próximos campeonatos: aún no hay eventos publicados.</div>';$('results').innerHTML=arr.map(c=>card(c,true)).join('')||'<div class="champ-empty">Aún no hay campeonatos registrados.</div>';renderAdmin()}
onSnapshot(collection(db,'campeonatos'),s=>{champs=s.docs.map(d=>({id:d.id,...d.data()}));message('Campeonatos actualizados','crStatus');render()},e=>message('No se pudieron consultar campeonatos: '+e.message,'crStatus'));
const login=$('loginForm'),logged=$('adminLogged');
login.addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(login);try{await signInWithEmailAndPassword(auth,String(d.get('email')),String(d.get('password')));login.reset()}catch(err){message('No se pudo iniciar sesión: '+err.message)}});
$('logout').addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,async u=>{user=u;isAdmin=false;if(u){try{const a=await getDoc(doc(db,'admins',u.uid));isAdmin=a.exists()&&a.data().enabled===true}catch(e){message('Error verificando acceso: '+e.message)}}login.hidden=isAdmin;logged.hidden=!isAdmin;if(!isAdmin&&u)message('Cuenta sin autorización. Verifica admins/{UID}');else message(isAdmin?'Acceso de administrador autorizado.':'');$('adminEmail').textContent=u?.email||'';renderAdmin()});
function chosen(){return champs.find(c=>c.id===$('editChamp').value)}
// Mantiene la estructura histórica hasta que se actualice una pista; al guardar migra a lista única.
function mutableTrack(t){if(!Array.isArray(t.pilots)){t.pilots=pilotsOf(t);delete t.groups}return t}
async function save(c){if(!isAdmin||!user)throw Error('Acceso no autorizado');const {id,...data}=c;await updateDoc(doc(db,'campeonatos',id),{...data,updatedAt:serverTimestamp()})}
$('newChamp').addEventListener('submit',async e=>{e.preventDefault();if(!isAdmin)return;const d=new FormData(e.target);try{await addDoc(collection(db,'campeonatos'),{name:String(d.get('name')).trim(),game:String(d.get('game')).trim(),date:String(d.get('date')),status:String(d.get('status')),description:String(d.get('description')).trim(),tracks:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});e.target.reset();message('Campeonato creado')}catch(err){message('Error al crear campeonato: '+err.message)}});
const details=$('editDetails');
const formHtml=`<p class="hint">Los pilotos se ordenan por su mejor vuelta y se muestran en tandas de cinco (20 por página). No es necesario crear grupos. Puedes registrar una vuelta nueva por vez; se conserva el historial completo.</p>
<div class="champ-action-row"><button type="button" class="champ-btn muted" data-action="addTrack">+ Pista</button><button type="button" class="champ-btn muted" data-action="editChamp">Editar campeonato</button><button type="button" class="champ-btn muted" data-action="editTrack">Renombrar pista</button><button type="button" class="champ-btn muted" data-action="deleteTrack">Eliminar pista</button><button type="button" class="champ-btn muted" data-action="renamePilot">Renombrar piloto</button><button type="button" class="champ-btn muted" data-action="changeStatus">Cambiar estado</button><button type="button" class="champ-btn muted" data-action="deleteChamp">Eliminar campeonato</button></div>
<form id="pilotRegister" class="admin-form champ-entry-form"><h3>Registrar piloto</h3><label>Pista<select name="track" data-tracks required></select></label><label>Nombre del piloto<input name="pilot" placeholder="Nombre y apellido" required maxlength="80"></label><button class="champ-btn" type="submit">+ Agregar piloto</button></form>
<form id="lapRegister" class="admin-form champ-entry-form"><h3>Registrar una vuelta</h3><label>Pista<select name="track" data-tracks required></select></label><label>Piloto<select name="pilot" id="lapPilot" required></select></label><label>Tiempo de vuelta<input name="lap" placeholder="01:42.350" pattern="[0-9]{1,3}:[0-5][0-9]\\.[0-9]{3}" required></label><button class="champ-btn" type="submit">+ Guardar vuelta</button></form>
<form id="lapManage" class="admin-form champ-entry-form"><h3>Corregir o eliminar vueltas</h3><label>Pista<select name="track" data-tracks required></select></label><label>Piloto<select name="pilot" id="managePilot" required></select></label><label>Vuelta<select name="lapIndex" id="manageLap" required></select></label><label>Nuevo tiempo<input name="lap" placeholder="01:42.350 (opcional)"></label><div class="champ-action-row"><button class="champ-btn muted" type="submit" data-op="edit">Corregir vuelta</button><button class="champ-btn muted" type="submit" data-op="delete">Eliminar vuelta</button><button class="champ-btn muted" type="button" id="deletePilot">Eliminar piloto</button></div></form>`;
let selectedTrackId='',selectedLapPilotId='',selectedManagePilotId='';
function updatePilots(form,selectId,previous){const c=chosen(),track=(c?.tracks||[]).find(t=>t.id===form?.elements.track.value),target=$(selectId);if(!target)return;const ps=track?pilotsOf(track):[];target.innerHTML=ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${p.laps.length} vueltas</option>`).join('');if(ps.some(p=>p.id===previous))target.value=previous;if(selectId==='managePilot')updateLaps()}
function updateLaps(){const f=$('lapManage'),target=$('manageLap');if(!f||!target)return;const c=chosen(),t=(c?.tracks||[]).find(x=>x.id===f.elements.track.value),p=pilotsOf(t||{}).find(x=>x.id===f.elements.pilot.value);target.innerHTML=(p?.laps||[]).map((lap,i)=>`<option value="${i}">Vuelta ${i+1}: ${esc(lap)}</option>`).join('')}
function renderAdmin(){if(!isAdmin)return;const sel=$('editChamp'),current=sel.value;sel.innerHTML=champs.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');if(champs.some(c=>c.id===current))sel.value=current;
 const previousTrack=$('lapRegister')?.elements.track.value||selectedTrackId,oldLap=$('lapRegister')?.elements.pilot.value||selectedLapPilotId,oldManage=$('lapManage')?.elements.pilot.value||selectedManagePilotId;
 details.innerHTML=champs.length?formHtml:'<p>Primero crea un campeonato.</p>';
 const c=chosen(),tracks=c?.tracks||[];details.querySelectorAll('[data-tracks]').forEach(s=>{s.innerHTML=tracks.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');if(tracks.some(t=>t.id===previousTrack))s.value=previousTrack});
 if(tracks.length){updatePilots($('lapRegister'),'lapPilot',oldLap);updatePilots($('lapManage'),'managePilot',oldManage)}else details.insertAdjacentHTML('afterbegin','<p class="champ-empty">Agrega una pista antes de registrar pilotos.</p>');
}
$('editChamp').addEventListener('change',()=>{selectedTrackId='';selectedLapPilotId='';selectedManagePilotId='';renderAdmin()});
details.addEventListener('change',e=>{const f=e.target.closest('form');if(e.target.matches('[data-tracks]')){selectedTrackId=e.target.value;if(f?.id==='lapRegister')updatePilots(f,'lapPilot','');if(f?.id==='lapManage')updatePilots(f,'managePilot','')}if(e.target.id==='managePilot'){selectedManagePilotId=e.target.value;updateLaps()}if(e.target.id==='lapPilot')selectedLapPilotId=e.target.value});
async function modify(fn){const orig=chosen();if(!orig||!isAdmin)throw Error('Selecciona un campeonato e inicia sesión');const c=structuredClone(orig);const msg=fn(c);if(msg===false)return;await save(c);message(msg||'Datos guardados y publicados. Grupos recalculados automáticamente.')}
details.addEventListener('click',async e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;try{
if(action==='addTrack'){const name=prompt('Nombre de la pista (por ejemplo: Guantug)')?.trim();if(!name)return;await modify(c=>{if(c.tracks.some(t=>t.name.localeCompare(name,'es',{sensitivity:'base'})===0))throw Error('La pista ya existe');c.tracks.push({id:uid(),name,pilots:[]});return 'Pista agregada'})}
if(action==='editChamp'){
 const current=chosen(); if(!current)throw Error('Selecciona un campeonato');
 const name=prompt('Nombre del campeonato',current.name)?.trim();if(name===undefined||!name)return;
 const game=prompt('Juego del campeonato',current.game||'')?.trim();if(game===undefined||!game)return;
 const date=prompt('Fecha (AAAA-MM-DD)',current.date||'')?.trim();if(date===undefined)return;
 if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Fecha incorrecta: usa AAAA-MM-DD');
 const description=prompt('Descripción del campeonato',current.description||'');if(description===null)return;
 await modify(c=>{c.name=name;c.game=game;c.date=date;c.description=description.trim();return 'Campeonato actualizado';});
}
if(action==='editTrack'||action==='deleteTrack'){
 const current=chosen();const tracks=current?.tracks||[];if(!tracks.length)throw Error('Agrega una pista primero');
 const names=tracks.map(t=>t.name).join(' / ');
 const oldName=prompt('Nombre de pista a gestionar: '+names,tracks[0].name)?.trim();if(!oldName)return;
 const target=tracks.find(t=>t.name.toLocaleLowerCase('es')===oldName.toLocaleLowerCase('es'));
 if(!target)throw Error('Pista no encontrada');
 if(action==='deleteTrack'){
  if(!confirm('¿Eliminar '+target.name+' y TODOS sus pilotos y vueltas? Esta acción no se puede deshacer.'))return;
  await modify(c=>{c.tracks=c.tracks.filter(t=>t.id!==target.id);return 'Pista eliminada';});
 } else {
  const newName=prompt('Nuevo nombre de la pista',target.name)?.trim();if(!newName)return;
  await modify(c=>{if(c.tracks.some(t=>t.id!==target.id&&t.name.toLocaleLowerCase('es')===newName.toLocaleLowerCase('es')))throw Error('Ya existe una pista con ese nombre');c.tracks.find(t=>t.id===target.id).name=newName;return 'Nombre de pista actualizado';});
 }
}
if(action==='renamePilot'){
 const current=chosen();const tracks=current?.tracks||[];if(!tracks.length)throw Error('No hay pistas');
 const trackName=prompt('Nombre de pista: '+tracks.map(t=>t.name).join(' / '),tracks[0].name)?.trim();if(!trackName)return;
 const t=tracks.find(t=>t.name.toLocaleLowerCase('es')===trackName.toLocaleLowerCase('es'));if(!t)throw Error('Pista no encontrada');
 const ps=pilotsOf(t);if(!ps.length)throw Error('No hay pilotos');
 const oldName=prompt('Piloto a renombrar: '+ps.map(p=>p.name).join(' / '),ps[0].name)?.trim();if(!oldName)return;
 const p=ps.find(p=>p.name.toLocaleLowerCase('es')===oldName.toLocaleLowerCase('es'));if(!p)throw Error('Piloto no encontrado');
 const newName=prompt('Nombre corregido del piloto',p.name)?.trim();if(!newName)return;
 await modify(c=>{const x=c.tracks.find(x=>x.id===t.id);mutableTrack(x);if(x.pilots.some(q=>q.id!==p.id&&q.name.toLocaleLowerCase('es')===newName.toLocaleLowerCase('es')))throw Error('Ya existe otro piloto con ese nombre');x.pilots.find(q=>q.id===p.id).name=newName;return 'Nombre del piloto actualizado';});
}
if(action==='changeStatus'){const status=prompt('Estado: proximo, en_curso, finalizado',chosen()?.status||'proximo')?.trim();if(!status)return;if(!statusLabel[status])throw Error('Estado no válido');await modify(c=>{c.status=status;return 'Estado actualizado'})}
if(action==='deleteChamp'){if(!confirm('¿Eliminar permanentemente este campeonato y todos sus pilotos y vueltas?'))return;const c=chosen();await deleteDoc(doc(db,'campeonatos',c.id));message('Campeonato eliminado')}
}catch(err){message('No se guardó: '+err.message)}});
details.addEventListener('submit',async e=>{const f=e.target;if(!['pilotRegister','lapRegister','lapManage'].includes(f.id))return;e.preventDefault();const d=new FormData(f),trackId=String(d.get('track'));try{
 if(f.id==='pilotRegister'){const name=String(d.get('pilot')||'').trim();if(!name)throw Error('Indica el nombre');await modify(c=>{const t=c.tracks.find(t=>t.id===trackId);if(!t)throw Error('Pista no encontrada');mutableTrack(t);if(t.pilots.some(p=>p.name.localeCompare(name,'es',{sensitivity:'base'})===0))throw Error('Este piloto ya está inscrito en la pista');t.pilots.push({id:uid(),name,laps:[]});return 'Piloto registrado. Ahora registra una vuelta cada vez que corresponda.'})}
 if(f.id==='lapRegister'){const pilotId=String(d.get('pilot')),lap=String(d.get('lap')||'').trim();if(!Number.isFinite(ms(lap)))throw Error('Usa formato MM:SS.mmm, ejemplo 01:42.350');await modify(c=>{const t=c.tracks.find(t=>t.id===trackId);if(!t)throw Error('Pista no encontrada');mutableTrack(t);const p=t.pilots.find(p=>p.id===pilotId);if(!p)throw Error('Piloto no encontrado');p.laps.push(lap);return `${p.name}: vuelta ${p.laps.length} guardada. Clasificación actualizada.`})}
 if(f.id==='lapManage'){const pilotId=String(d.get('pilot')),index=Number(d.get('lapIndex')),op=e.submitter?.dataset.op||'edit',lap=String(d.get('lap')||'').trim();if(op==='edit'&&!Number.isFinite(ms(lap)))throw Error('Ingresa un nuevo tiempo válido');if(op==='delete'&&!confirm('¿Eliminar esta vuelta?'))return;await modify(c=>{const t=c.tracks.find(t=>t.id===trackId);if(!t)throw Error('Pista no encontrada');mutableTrack(t);const p=t.pilots.find(p=>p.id===pilotId);if(!p||!p.laps[index])throw Error('Vuelta no encontrada');if(op==='delete')p.laps.splice(index,1);else p.laps[index]=lap;return 'Vuelta actualizada y ranking recalculado'})}
 }catch(err){message('No se guardó: '+err.message)}});
details.addEventListener('click',async e=>{if(e.target.id!=='deletePilot')return;const f=$('lapManage'),trackId=f?.elements.track.value,pilotId=f?.elements.pilot.value;if(!pilotId||!confirm('¿Eliminar este piloto y todas sus vueltas?'))return;try{await modify(c=>{const t=c.tracks.find(t=>t.id===trackId);mutableTrack(t);t.pilots=t.pilots.filter(p=>p.id!==pilotId);return 'Piloto eliminado'})}catch(err){message('No se guardó: '+err.message)}});
function handleHash(){const h=location.hash.slice(1);if(['admin','resultados','proximos'].includes(h))$(h)?.scrollIntoView()};window.addEventListener('hashchange',handleHash);setTimeout(handleHash,400);

// CRONOS RACING V18: tandas visuales de cinco, 20 pilotos por pagina.
// Anadir al FINAL de sitio/assets/js/campeonatos.js; no borra datos existentes.
const paginasV18 = new Map();
card = function(c, detail) {
  const st = statusLabel[c.status] || 'Campeonato';
  const pistas = (c.tracks || []).map(t => {
    const pilotos = ranked(t);
    const tiempoLider = pilotos.length ? best(pilotos[0]) : Infinity;
    const pendientes = pilotsOf(t).filter(p => !Number.isFinite(best(p)));
    const key = `${c.id}:${t.id}`;
    const total = Math.max(1, Math.ceil(pilotos.length / 20));
    const pagina = Math.min(Math.max(0, paginasV18.get(key) || 0), total - 1);
    paginasV18.set(key, pagina);
    const inicio = pagina * 20;
    const visibles = pilotos.slice(inicio, inicio + 20);
    const tandas = [];
    for (let k = 0; k < visibles.length; k += 5) {
      const cinco = visibles.slice(k, k + 5);
      const desde = inicio + k + 1;
      const hasta = desde + cinco.length - 1;
      const columnas = Math.max(4, ...cinco.map(p => (p.laps || []).length));
      const filas = cinco.map((p, i) => {
        const tiempos = (p.laps || []).map(ms);
        const validos = tiempos.filter(Number.isFinite);
        const minimo = Math.min(...validos), maximo = Math.max(...validos);
        const celdas = Array.from({length: columnas}, (_, j) => {
          const valor = (p.laps || [])[j] || '—';
          const num = ms(valor);
          const clase = Number.isFinite(num) ? (num === minimo ? 'champ-best' : num === maximo ? 'champ-worst' : '') : '';
          return `<td class="${clase}">${esc(valor)}</td>`;
        }).join('');
        return `<tr><td>${desde + i}</td><td>${esc(p.name)}</td>${celdas}
<td class="champ-best">${Number.isFinite(minimo) ? showMs(minimo) : '—'}</td>
<td class="cr-gap">${desde + i === 1
  ? '<strong class="champ-best">LÍDER</strong>'
  : `+${((minimo - tiempoLider) / 1000).toFixed(3)}`
}</td></tr>`;
      }).join('');
      tandas.push(`<section class="cr-tanda"><h4>Tanda ${Math.floor((desde - 1) / 5) + 1} <span>· posiciones ${desde}–${hasta}</span></h4><div class="champ-scroll"><table class="champ-table"><thead><tr><th>Pos.</th><th>Piloto</th>${Array.from({length:columnas},(_,j)=>`<th>Vuelta ${j+1}</th>`).join('')}<th>Mejor tiempo</th><th>Dif. líder</th></tr></thead><tbody>${filas}</tbody></table></div></section>`);
    }
    const controles = total > 1 ? `<nav class="cr-pages" aria-label="Paginas de pilotos"><button type="button" data-cr-page="-1" data-cr-key="${esc(key)}" ${pagina===0?'disabled':''} aria-label="Ver 20 pilotos anteriores">❮</button><span>Posiciones ${inicio + 1}–${Math.min(inicio+20,pilotos.length)} de ${pilotos.length} · Página ${pagina+1}/${total}</span><button type="button" data-cr-page="1" data-cr-key="${esc(key)}" ${pagina===total-1?'disabled':''} aria-label="Ver siguientes 20 pilotos">❯</button></nav>` : '';
    return `<details class="champ-track" open><summary>🏁 ${esc(t.name)} · ${pilotos.length} pilotos con tiempo</summary>${tandas.join('') || '<p class="hint">Aún no hay tiempos registrados.</p>'}${controles}${pendientes.length?`<p class="hint">Pilotos pendientes de cronometrar: ${pendientes.map(p=>esc(p.name)).join(', ')}</p>`:''}<p class="hint"><span class="champ-best">Verde: mejor vuelta</span> · <span class="champ-worst">Rojo: peor vuelta</span></p></details>`;
  }).join('');
  return `<article class="champ-card"><span class="champ-pill ${c.status==='finalizado'?'red':'green'}">${esc(st)}</span><span class="champ-pill">${esc(c.game||'Juego por definir')}</span><h3>${esc(c.name)}</h3><p>${esc(c.description||'Información y resultados del campeonato.')}</p><p>📅 ${esc(c.date||'Fecha por definir')}</p>${detail?(pistas||'<div class="champ-empty">Pistas y resultados pendientes de publicación.</div>'):''}</article>`;
};
$('results').addEventListener('click', event => {
  const boton = event.target.closest('button[data-cr-page]');
  if (!boton || boton.disabled) return;
  const key = boton.dataset.crKey;
  const avance = Number(boton.dataset.crPage);
  paginasV18.set(key, (paginasV18.get(key) || 0) + avance);
  const scrollAnterior = window.scrollY;
  render();
  window.scrollTo({top:scrollAnterior,behavior:'instant'});
});
render();

