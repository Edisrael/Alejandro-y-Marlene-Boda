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
