// LectoVoz — lector accesible con Web Speech API
(function(){
  const $ = id => document.getElementById(id);
  const texto = $('texto'), vocesSel = $('voces'), vel = $('velocidad'),
    vol = $('volumen'), estado = $('estado'), barra = $('barra'),
    contador = $('contador');

  const synth = window.speechSynthesis;
  if(!synth){
    estado.textContent = 'Tu navegador no soporta lectura en voz alta. Usa Chrome, Edge o Firefox.';
    return;
  }
  let voces = [], hablando = false;

  function cargarVoces(){
    voces = synth.getVoices().filter(v => v.lang.startsWith('es')) .concat(synth.getVoices().filter(v => !v.lang.startsWith('es')));
    vocesSel.innerHTML = '';
    voces.forEach((v,i)=>{
      const o = document.createElement('option');
      o.value = i; o.textContent = v.name + ' (' + v.lang + ')';
      vocesSel.appendChild(o);
    });
    // Preferir voz en español
    const idx = voces.findIndex(v=>v.lang.startsWith('es'));
    if(idx>=0) vocesSel.value = idx;
  }
  cargarVoces();
  if(synth.onvoiceschanged !== undefined) synth.onvoiceschanged = cargarVoces;

  function contar(){
    const t = texto.value.trim();
    const palabras = t ? t.split(/\s+/).length : 0;
    contador.textContent = palabras + ' palabras · ' + texto.value.length + ' caracteres';
  }
  texto.addEventListener('input', contar); contar();

  $('vel-valor').textContent = vel.value;
  $('vol-valor').textContent = Math.round(vol.value*100)+'%';
  vel.addEventListener('input', ()=> $('vel-valor').textContent = vel.value);
  vol.addEventListener('input', ()=> $('vol-valor').textContent = Math.round(vol.value*100)+'%');

  function hablar(str){
    if(!str || !str.trim()){ estado.textContent = 'No hay texto para leer. Escribe algo primero.'; texto.focus(); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(str);
    const v = voces[parseInt(vocesSel.value||'0',10)];
    if(v) u.voice = v;
    u.lang = (v && v.lang) || 'es-ES';
    u.rate = parseFloat(vel.value); u.volume = parseFloat(vol.value);
    u.onstart = ()=>{ hablando=true; estado.textContent='🔊 Leyendo… pulsa Detener para parar.'; barra.style.width='15%'; };
    u.onboundary = e => {
      if(e.charIndex && str.length){ barra.style.width = Math.min(100, Math.round(e.charIndex/str.length*100))+'%'; }
    };
    u.onend = ()=>{ hablando=false; estado.textContent='✅ Lectura terminada.'; barra.style.width='100%'; setTimeout(()=>barra.style.width='0%',1500); };
    u.onerror = ()=>{ estado.textContent='⚠️ Error al leer. Intenta de nuevo.'; };
    synth.speak(u);
  }

  $('btn-leer').addEventListener('click', ()=>hablar(texto.value));
  $('btn-pausar').addEventListener('click', ()=>{
    if(synth.speaking && !synth.paused){ synth.pause(); estado.textContent='⏸ Pausado. Pulsa Continuar.'; }
  });
  $('btn-reanudar').addEventListener('click', ()=>{
    if(synth.paused){ synth.resume(); estado.textContent='🔊 Continuando lectura…'; }
  });
  $('btn-detener').addEventListener('click', ()=>{ synth.cancel(); hablando=false; estado.textContent='⏹ Detenido.'; barra.style.width='0%'; });
  $('btn-seleccion').addEventListener('click', ()=>{
    const s = window.getSelection().toString();
    if(s) hablar(s); else { estado.textContent='Selecciona primero un texto de la página.'; }
  });

  // Ejemplos
  const ejemplos = {
    noticia:'La tecnología de lectura en voz alta permite a millones de personas con discapacidad visual acceder a libros, noticias y documentos de forma autónoma.',
    cuento:'Había una vez una voz que vivía en una cajita. Cuando alguien escribía palabras, la voz despertaba y las cantaba para que nadie se quedara sin historias.',
    instrucciones:'Para usar LectoVoz: primero, escribe tu texto. Segundo, elige tu voz favorita. Tercero, pulsa el botón grande LEER. Puedes pausar con Alt más P y detener con Alt más S.'
  };
  document.querySelectorAll('.btn-ejemplo').forEach(b=>{
    b.addEventListener('click', ()=>{
      texto.value = ejemplos[b.dataset.ejemplo] || '';
      contar(); hablar(texto.value);
    });
  });

  // Archivo .txt
  $('archivo').addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return;
    $('nombre-archivo').textContent = 'Archivo: '+f.name;
    const r = new FileReader();
    r.onload = ()=>{ texto.value = r.result; contar(); hablar(texto.value); };
    r.readAsText(f);
  });

  // Ayuda por voz
  $('btn-ayuda-voz').addEventListener('click', ()=>{
    hablar('Bienvenido a Lecto Voz. Pega tu texto en el cuadro grande y pulsa el botón Leer en voz alta. Puedes cambiar la velocidad y la voz. Usa la tecla Tab para moverte y Alt más L para leer.');
  });

  // Accesibilidad visual
  let fs = 1.25;
  function aplicarFS(){ document.documentElement.style.setProperty('--fs', fs+'rem'); document.body.style.fontSize = fs+'rem'; }
  $('btn-font-mas').addEventListener('click', ()=>{ fs=Math.min(2.2,fs+0.15); aplicarFS(); });
  $('btn-font-menos').addEventListener('click', ()=>{ fs=Math.max(0.9,fs-0.15); aplicarFS(); });
  function toggle(id, clase){
    $(id).addEventListener('click', ()=>{
      const on = document.body.classList.toggle(clase);
      $(id).setAttribute('aria-pressed', on ? 'true':'false');
    });
  }
  toggle('btn-contraste','alto-contraste');
  toggle('btn-invertir','invertir');
  toggle('btn-enlaces','resaltar-enlaces');
  toggle('btn-movimiento','sin-movimiento');
  $('btn-reset').addEventListener('click', ()=>{
    document.body.className=''; fs=1.25; aplicarFS();
    document.querySelectorAll('[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed','false'));
  });

  // Atajos Alt+L, Alt+P, Alt+S, Alt++, Alt+-
  document.addEventListener('keydown', e=>{
    if(!e.altKey) return;
    const k = e.key.toLowerCase();
    if(k==='l'){ e.preventDefault(); hablar(texto.value); }
    else if(k==='p'){ e.preventDefault(); synth.paused ? synth.resume() : synth.pause(); }
    else if(k==='s'){ e.preventDefault(); synth.cancel(); estado.textContent='⏹ Detenido.'; }
    else if(k==='+'||k==='='){ e.preventDefault(); fs=Math.min(2.2,fs+0.15); aplicarFS(); }
    else if(k==='-'||k==='_'){ e.preventDefault(); fs=Math.max(0.9,fs-0.15); aplicarFS(); }
  });
})();
