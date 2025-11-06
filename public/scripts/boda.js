// Scroll con precisión (sin saltos, incluso en iPhone)
const buttons = document.querySelectorAll('button[data-target]');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.target;
    const target = id === 'inicio'
      ? document.querySelector('section#inicio')
      : document.getElementById(id);
    if (!target) return;

    const y = Math.max(0, Math.round(target.offsetTop));

    // Primer scroll suave
    window.scrollTo({ top: y - 1, behavior: 'smooth' });

    // Reajuste fino tras cambio de UI (Safari/iPhone)
    setTimeout(() => {
      const y2 = Math.max(0, Math.round(target.offsetTop));
      const maxTop = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.min(y2, maxTop), behavior: 'auto' });
    }, 400);
  });
});

// Animaciones con reset
const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
      else entry.target.classList.remove('in-view');
    });
  },
  { threshold: 0.3 }
);
sections.forEach(sec => observer.observe(sec));

// Formulario de confirmación
document.getElementById("form")?.addEventListener("submit", async function(e){
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  try{
    const resp = await fetch(
      "https://script.google.com/macros/s/AKfycbzT1297LEFoW1XDyzybzGyYj6tXFiRCzLg64t9b6Q0OUHLY9auHjP_ufpJjSrOxZ_SVjQ/exec?nombre=" 
      + encodeURIComponent(nombre)
    );
    const text = await resp.text();
    document.getElementById("respuesta").innerText = text;
  }catch(err){
    document.getElementById("respuesta").innerText = "Error al enviar. Intenta de nuevo.";
    console.error(err);
  }
});








// ==== Typewriter reutilizable (multi-instancia, reactivable por sección) ====
(function(){
  function prepareTyper(el){
    // Lee opciones
    const raw   = (el.getAttribute('data-text') ?? el.textContent ?? '').trim();
    const speed = parseInt(el.getAttribute('data-typer-speed') || '100', 10);
    const delay = parseInt(el.getAttribute('data-typer-delay') || '0', 10);
    const loop  = (el.getAttribute('data-typer-loop') || 'false').toLowerCase() === 'true';

    // Estructura interna por elemento
    if (!el._typer){
      const htmlText = raw.replace(/\n/g, "<br>");
      el.innerHTML = `
        <span class="ghost" aria-hidden="true">${htmlText}</span>
        <span class="typed"></span>
      `;
      el._typer = {
        raw, speed, delay, loop,
        typed: el.querySelector('.typed'),
        i: 0, timer: null, running: false
      };
    } else {
      // Actualiza opciones si cambian atributos
      Object.assign(el._typer, { raw, speed, delay, loop });
    }
  }

  function startTyper(el){
    const st = el._typer;
    if (!st || st.running) return;
    st.running = true;

    const frame = () => {
      // Si el elemento ya no es visible o se pidió parar, no seguimos
      if (!st.running) return;

      const visible = st.raw.slice(0, st.i).replace(/\n/g, "<br>");
      st.typed.innerHTML = visible + `<span class="typer-cursor">_</span>`;

      if (st.i < st.raw.length){
        st.i++;
        st.timer = setTimeout(frame, st.speed);
      } else {
        if (st.loop){
          st.timer = setTimeout(() => { st.i = 0; frame(); }, 1200);
        } else {
          st.typed.innerHTML = visible; // quita cursor al terminar
          st.running = false;
        }
      }
    };

    // Respeta el delay al entrar en vista
    st.timer = setTimeout(frame, st.delay);
  }

  function stopTyper(el, {reset=false} = {}){
    const st = el._typer;
    if (!st) return;
    if (st.timer){ clearTimeout(st.timer); st.timer = null; }
    st.running = false;
    if (reset){
      st.i = 0;
      st.typed.innerHTML = ""; // limpiamos lo escrito para que al regresar vuelva a empezar
    }
  }

  // Observer que dispara la animación cuando el elemento está prácticamente centrado.
  // threshold alto para sincronizar con el snap de sección.
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (!el._typer) prepareTyper(el);

      if (entry.isIntersecting && entry.intersectionRatio >= 0.95){
        // Entra en vista: reinicia desde cero y arranca
        stopTyper(el, {reset:true});
        startTyper(el);
      } else {
        // Sale de vista: detén y deja listo para reactivar al volver
        stopTyper(el, {reset:true});
      }
    });
  }, {
    root: null,
    threshold: [0.0, 0.5, 0.95],
    rootMargin: '0px 0px 0px 0px'
  });

  // Auto-descubrir y observar todos los [data-typer]
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-typer]').forEach(el => {
      if (!el.hasAttribute('data-text')) {
        el.setAttribute('data-text', (el.textContent || '').trim());
      }
      prepareTyper(el);
      io.observe(el); // importante: NO desobservamos, así se re-activa al regresar
    });
  });
})();








// ==== MODAL MAPA CON PIN (Leaflet + OSM, sin API key) ====

// Cargador dinámico de librerías
function loadJS(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); });}
function loadCSS(href){ return new Promise((res,rej)=>{ const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; l.onload=res; l.onerror=rej; document.head.appendChild(l); });}

async function ensureLeaflet(){
  if (window.L && L.map) return;
  await loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  await loadJS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
}

// Geocodificar dirección → coords (Nominatim)
async function geocodeAddress(address){
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const resp = await fetch(url, { headers: { 'Accept':'application/json' }});
  if (!resp.ok) throw new Error('Geocoding failed');
  const data = await resp.json();
  if (!data || !data.length) throw new Error('No results');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-ubicacion');
  if (!btn) return;

  const address = btn.dataset.address || '';
  const label   = btn.dataset.label || 'Ubicación';
  let lat = btn.dataset.lat ? parseFloat(btn.dataset.lat) : null;
  let lng = btn.dataset.lng ? parseFloat(btn.dataset.lng) : null;

  try{
    // 1) Obtener coords si solo hay address
    if ((!lat || !lng) && address){
      const pt = await geocodeAddress(address);
      lat = pt.lat; lng = pt.lng;
    }

    // 2) Abrir modal SweetAlert2 con contenedor para Leaflet
    if (typeof Swal === 'undefined') { 
      alert('Mapa: faltó SweetAlert2'); 
      return; 
    }
    await Swal.fire({
      title: label,
      html: `
        <div id="swal-map" style="
          width:100%;
          max-width:800px;
          aspect-ratio: 16/9;
          margin:0 auto;
          border-radius:12px;
          overflow:hidden;
        "></div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 'min(95vw, 860px)',
      didOpen: async () => {
        // 3) Cargar Leaflet si hace falta e inicializar mapa con pin
        await ensureLeaflet();

        const mapEl = document.getElementById('swal-map');
        const map = L.map(mapEl, { zoomControl: true });

        // Capa base OSM
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Si hay coords válidas, centra y agrega marker
        if (typeof lat === 'number' && typeof lng === 'number'){
          const center = [lat, lng];
          map.setView(center, 15);
          L.marker(center).addTo(map).bindPopup(label).openPopup();
        } else if (address){
          // Fallback: si no hubo coords, haz un fit al mundo (sin marker)
          map.setView([0,0], 1);
        }

        // Arreglo de tamaño al animar modal
        setTimeout(()=> map.invalidateSize(), 100);
      },
      background: '#fff',
      backdrop: 'rgba(0,0,0,0.6)'
    });

  } catch(err){
    console.error('Mapa modal error:', err);
    // Fallback muy básico
    if (address){
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank','noopener,noreferrer');
    } else {
      alert('No fue posible mostrar el mapa.');
    }
  }
});
