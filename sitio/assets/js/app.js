
document.addEventListener('DOMContentLoaded', async () => {

  // Promociones compartidas: se cargan del archivo assets/js/promociones.js.
  // El catálogo está disponible para TODOS los visitantes cuando se publica en GitHub Pages.
  const promoSlider=document.querySelector('[data-featured-slider]');
  if(promoSlider && Array.isArray(window.CRONOS_PROMOCIONES)) {
    const arrow=promoSlider.querySelector('.featured-arrow.prev');
    for(const promo of window.CRONOS_PROMOCIONES.filter(p=>p && p.activa!==false)){
      if(!/^assets\/images\/promociones\/[a-z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(promo.imagen || '')) continue;
      const slide=document.createElement('article');slide.className='featured-slide promo-custom-slide';
      const image=document.createElement('img');image.src=promo.imagen;image.alt=promo.titulo||'Promoción Cronos Racing';image.loading='lazy';slide.appendChild(image);
      const overlay=document.createElement('div');overlay.className='featured-overlay';
      if(promo.titulo){const h=document.createElement('h3');h.textContent=promo.titulo;overlay.appendChild(h);}
      if(promo.descripcion){const p=document.createElement('p');p.textContent=promo.descripcion;overlay.appendChild(p);}
      if(promo.enlace && /^(?:[a-z0-9-]+\.html(?:#[a-z0-9-]+)?|https:\/\/[^\s]+)$/i.test(promo.enlace)){
        const a=document.createElement('a');a.className='btn primary';a.textContent='Ver promoción';a.href=promo.enlace;
        if(a.href.startsWith('https://')){a.rel='noopener noreferrer';a.target='_blank';}
        overlay.appendChild(a);
      }
      if(overlay.children.length)slide.appendChild(overlay);
      promoSlider.insertBefore(slide,arrow);
    }
  }

  const featured = document.querySelector('[data-featured-slider]');
  if(featured){
    const slides = Array.from(featured.querySelectorAll('.featured-slide'));
    const dotsWrap = featured.querySelector('.featured-dots');
    const prev = featured.querySelector('.featured-arrow.prev');
    const next = featured.querySelector('.featured-arrow.next');
    let current = 0;
    let timer = null;

    slides.forEach((_,i)=>{
      const dot = document.createElement('button');
      dot.className = 'featured-dot' + (i===0?' active':'');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Mostrar promoción ${i+1}`);
      dot.addEventListener('click',()=>show(i,true));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function show(index, restart=false){
      current = (index + slides.length) % slides.length;
      slides.forEach((s,i)=>s.classList.toggle('active', i===current));
      dots.forEach((d,i)=>d.classList.toggle('active', i===current));
      if(restart) start();
    }
    function start(){
      if(timer) clearInterval(timer);
      timer = setInterval(()=>show(current+1,false), 20000);
    }
    prev?.addEventListener('click',()=>show(current-1,true));
    next?.addEventListener('click',()=>show(current+1,true));
    featured.addEventListener('mouseenter',()=>{ if(timer) clearInterval(timer); });
    featured.addEventListener('mouseleave',start);
    start();
  }

  // Asistente local de preguntas frecuentes: no es un chat humano en directo.
  const chatMarkup = `<button class="cr-chat-toggle" id="crChatToggle" aria-expanded="false" aria-controls="crChatPanel" type="button">💬 Chat Cronos</button>
  <section class="cr-chat" id="crChatPanel" role="dialog" aria-label="Asistente virtual Cronos Racing" aria-modal="false">
    <div class="cr-chat-head"><div><strong>🏁 Cronos Racing</strong><small>Asistente virtual · respuestas automáticas</small></div><button type="button" class="cr-chat-close" aria-label="Cerrar chat">×</button></div>
    <div class="cr-chat-messages" id="crChatMessages" role="log" aria-live="polite"></div>
    <div class="cr-chat-options"><button type="button" data-chat-topic="precios">Precios</button><button type="button" data-chat-topic="horarios">Horarios</button><button type="button" data-chat-topic="reservas">Reservas</button><button type="button" data-chat-topic="ubicacion">Ubicación</button><button type="button" data-chat-topic="eventos">Eventos</button></div>
    <form class="cr-chat-form" id="crChatForm"><input name="mensaje" aria-label="Escribe tu pregunta" placeholder="Escribe tu pregunta…" maxlength="400" required autocomplete="off"><button type="submit">Enviar</button></form>
    <a class="cr-chat-wa" href="https://wa.me/593998691805?text=Hola%2C%20necesito%20informaci%C3%B3n%20de%20Cronos%20Racing" target="_blank" rel="noopener noreferrer" id="crChatWhatsApp">Continuar por WhatsApp ↗</a>
  </section>`;
  document.body.insertAdjacentHTML('beforeend', chatMarkup);
  const panel=document.getElementById('crChatPanel');
  const toggle=document.getElementById('crChatToggle');
  const feed=document.getElementById('crChatMessages');
  const chatForm=document.getElementById('crChatForm');
  const chatInput=chatForm.elements.mensaje;
  const wa=document.getElementById('crChatWhatsApp');
  const answers={
    diferencias:'PRO: plataforma con movimiento y tres pantallas de 40 pulgadas; MINI: sin movimiento y una pantalla. RC 1/18: automóvil más compacto y económico; RC 1/10: automóvil de mayor tamaño. Ambos RC se manejan a distancia y permiten practicar derrapes.',
    precios:'Simuladores PRO: 10 min $6, 20 min $12, 30 min $18. Simuladores MINI: 10 min $3, 20 min $6, 30 min $9. RC Drift 1/18: 6 min $2, 12 min $3, 25 min $6. RC Drift 1/10: 6 min $3, 12 min $5, 25 min $10. Precios por equipo y sesión.',
    horarios:'🏁 ¡Te esperamos en Cronos Racing! 🏎️ Nuestro horario de atención es de lunes a sábado de 10:00 a 20:30 y domingos de 10:00 a 20:00.',
    reservas:'Puedes preparar tu solicitud en la sección Reservas. La reserva se guarda en tu dispositivo y debe confirmarse con nuestro equipo por WhatsApp; no se confirma automáticamente.',
    ubicacion:'Estamos en Rayoloma, Av. González Suárez, 010107 Cuenca, Ecuador. Encuéntranos dentro de Monay Shopping, nivel 2. ¡Te esperamos en Cronos Racing!',
    eventos:'Organizamos cumpleaños, experiencias para grupos y campeonatos. Visita la sección Eventos o escríbenos por WhatsApp para coordinar.'
  };
  const addMsg=(msg,who='bot')=>{const div=document.createElement('div');div.className='cr-chat-bubble'+(who==='user'?' user':'');div.textContent=msg;feed.appendChild(div);feed.scrollTop=feed.scrollHeight;};
  const reply=text=>{
    const t=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const key= t.includes('diferencia')||t.includes('comparar')||t.includes('cual elegir')?'diferencias':t.includes('precio')||t.includes('cuanto')||t.includes('costo')||t.includes('tarifa')?'precios':t.includes('horario')||t.includes('abren')||t.includes('cierran')?'horarios':t.includes('reserva')||t.includes('turno')?'reservas':t.includes('ubicacion')||t.includes('donde')||t.includes('direccion')||t.includes('queda')||t.includes('llegar')||t.includes('rayoloma')||t.includes('gonzalez')||t.includes('monay')||t.includes('local')?'ubicacion':t.includes('evento')||t.includes('cumple')||t.includes('campeonato')?'eventos':null;
    addMsg(key?answers[key]:'Puedo ayudarte con precios, horarios, reservas, ubicación y eventos. Para una consulta personalizada, continúa por WhatsApp.');
    wa.href='https://wa.me/593998691805?text='+encodeURIComponent('Hola, tengo una consulta para Cronos Racing: '+text);
  };
  addMsg('¡Hola! 🏎️ Soy el asistente virtual de Cronos Racing. ¿En qué puedo ayudarte?');
  const closeChat=()=>{panel.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();};
  toggle.addEventListener('click',()=>{const opened=panel.classList.toggle('open');toggle.setAttribute('aria-expanded',String(opened));if(opened)chatInput.focus();});
  panel.querySelector('.cr-chat-close').addEventListener('click',closeChat);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))closeChat();});
  panel.querySelectorAll('[data-chat-topic]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.chatTopic;addMsg(btn.textContent,'user');addMsg(answers[k]);wa.href='https://wa.me/593998691805?text='+encodeURIComponent('Hola, quisiera información sobre '+btn.textContent+'.');}));
  chatForm.addEventListener('submit',e=>{e.preventDefault();const v=chatInput.value.trim();if(!v)return;addMsg(v,'user');reply(v);chatInput.value='';chatInput.focus();});

  const menu = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if(menu && links){
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-controls','cronos-primary-navigation');
    links.id='cronos-primary-navigation';
    const closeMenu=()=>{ links.classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Abrir menú'); };
    menu.addEventListener('click',()=>{ const open=links.classList.toggle('open'); menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú'); });
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
    document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!links.contains(e.target))closeMenu();});
    window.addEventListener('resize',()=>{if(window.innerWidth>1100)closeMenu();});
  }

  document.querySelectorAll('.faq-q').forEach(btn=>{
    btn.addEventListener('click',()=>btn.closest('.faq-item').classList.toggle('open'));
  });

  const modal = document.querySelector('.modal');
  if(modal){
    const modalImg = modal.querySelector('img');
    document.addEventListener('click',event=>{
      const btn=event.target.closest('[data-lightbox]');
      if(!btn || !modalImg) return;
      modalImg.src = btn.querySelector('img').src;
      modal.classList.add('open');
    });
    modal.querySelector('.modal-close').addEventListener('click',()=>modal.classList.remove('open'));
    modal.addEventListener('click',(e)=>{ if(e.target===modal) modal.classList.remove('open'); });
  }


  // Galería pública: todas las imágenes se cargan del catálogo publicado.
  const galleryGrid=document.getElementById('gallery-grid');
  if(galleryGrid && Array.isArray(window.CRONOS_GALERIA)){
    for(const photo of window.CRONOS_GALERIA){
      if(!photo || !/^assets\/images\/galeria\/[a-z0-9_.-]+\.(jpg|jpeg|png|webp|gif)$/i.test(photo.imagen||''))continue;
      const button=document.createElement('button');button.type='button';button.setAttribute('data-lightbox','');
      const img=document.createElement('img');img.src=photo.imagen;img.alt=photo.descripcion||'Galería Cronos Racing';img.loading='lazy';
      button.appendChild(img);galleryGrid.appendChild(button);
    }
  }

  const form = document.querySelector('#bookingForm');
  if(form){
    const saved = document.querySelector('#savedMessage');
    const equipmentError = document.querySelector('#equipmentError');

    const equipmentTotal = () => {
      const fields = ['cantPro','cantMini','cantRC10','cantRC18'];
      return fields.reduce((sum,name)=>sum + Number(form.elements[name]?.value || 0),0);
    };

    const bookingText = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      return `SOLICITUD DE RESERVA - CRONOS RACING
Nombre: ${data.nombre||''}
Teléfono: ${data.telefono||''}
Fecha: ${data.fecha||''}
Hora: ${data.hora||''}
Tipo de reserva: ${data.tipoReserva||''}
Personas: ${data.personas||''}
Simuladores PRO: ${data.cantPro||0}
Simuladores MINI: ${data.cantMini||0}
RC 1/10: ${data.cantRC10||0}
RC 1/18: ${data.cantRC18||0}
Juego preferido: ${data.juego||''}
Duración: ${data.duracion||''}
Notas: ${data.notas||''}

Monay Shopping - Nivel 2
WhatsApp: 0998691805`;
    };

    form.addEventListener('submit', e=>{
      e.preventDefault();
      if(equipmentTotal()===0 && form.elements['tipoReserva']?.value !== 'Membresía'){
        if(equipmentError){
          equipmentError.textContent='Selecciona al menos 1 simulador o vehículo RC.';
          equipmentError.classList.add('show');
        }
        return;
      }
      equipmentError?.classList.remove('show');
      const data = Object.fromEntries(new FormData(form).entries());
      data.guardado = new Date().toLocaleString();
      localStorage.setItem('cronosReserva', JSON.stringify(data));
      if(saved){
        saved.classList.add('show');
        saved.textContent='Solicitud guardada en este dispositivo. Puedes descargarla o copiarla.';
      }
    });

    const previous = localStorage.getItem('cronosReserva');
    if(previous){
      try{
        const data=JSON.parse(previous);
        Object.entries(data).forEach(([k,v])=>{
          const field=form.elements[k];
          if(field) field.value=v;
        });
      }catch(e){}
    }

    const sendWhatsApp=document.getElementById('sendBookingWhatsapp');
    if(sendWhatsApp){
      sendWhatsApp.addEventListener('click',()=>{
        if(!form.reportValidity())return;
        if(equipmentTotal()===0 && form.elements['tipoReserva']?.value !== 'Membresía'){
          equipmentError.textContent='Selecciona al menos 1 simulador o vehículo RC.';
          equipmentError.classList.add('show');return;
        }
        const url='https://wa.me/593998691805?text='+encodeURIComponent(bookingText());
        window.open(url,'_blank','noopener,noreferrer');
      });
    }
    const downloadBtn = document.querySelector('#downloadBooking');
    if(downloadBtn){
      downloadBtn.addEventListener('click',()=>{
        const txt = bookingText();
        const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href=url;
        a.download='reserva-cronos-racing.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const copyBtn = document.querySelector('#copyBooking');
    if(copyBtn){
      copyBtn.addEventListener('click', async ()=>{
        const txt = bookingText();
        try{
          await navigator.clipboard.writeText(txt);
          copyBtn.textContent='Copiado ✓';
          setTimeout(()=>copyBtn.textContent='Copiar solicitud',1400);
        }catch(e){
          const temp = document.createElement('textarea');
          temp.value = txt;
          document.body.appendChild(temp);
          temp.select();
          try{ document.execCommand('copy'); copyBtn.textContent='Copiado ✓'; }
          catch(err){ alert(txt); }
          temp.remove();
          setTimeout(()=>copyBtn.textContent='Copiar solicitud',1400);
        }
      });
    }
  }

});
