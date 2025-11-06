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








// ==== MODAL CON MAPA GOOGLE (CON PIN) ====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-ubicacion");
  if (!btn) return;

  const lat = btn.dataset.lat || "";
  const lng = btn.dataset.lng || "";
  const label = btn.dataset.label || "Ubicación";
  const address = btn.dataset.address || "";

  // Si hay coordenadas, usamos el formato con marcador
  let mapaEmbed = "";
  if (lat && lng) {
    mapaEmbed = `https://www.google.com/maps?q=${lat},${lng}&hl=es&z=16&output=embed`;
  } else if (address) {
    mapaEmbed = `https://www.google.com/maps?q=${encodeURIComponent(address)}&hl=es&z=16&output=embed`;
  } else {
    Swal.fire("Sin ubicación", "Falta dirección o coordenadas.", "info");
    return;
  }

  Swal.fire({
    title: label,
    html: `
      <div style="
        width:100%;
        max-width:700px;
        aspect-ratio:16/9;
        margin:auto;
        border-radius:15px;
        overflow:hidden;
        box-shadow:0 0 10px rgba(0,0,0,0.2);
      ">
        <iframe
          src="${mapaEmbed}"
          width="100%"
          height="100%"
          style="border:0;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `,
    showCloseButton: true,
    showConfirmButton: false,
    width: "min(95vw, 800px)",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.6)",
  });
});

