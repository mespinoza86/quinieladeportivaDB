document.addEventListener('DOMContentLoaded', async () => {
  const card = document.getElementById('liveMatchesCard');
  const container = document.getElementById('liveMatchesContainer');

  if (!card || !container) return;

  function marcador(valor) {
    return valor !== null && valor !== undefined && valor !== '' ? valor : '-';
  }

  function estaEnVivo(partido) {
    return partido.estado === 'LIVE' && partido.minuto;
  }

  function liveBadge(minuto) {
    return `
      <span class="status-pill status-live">
        <span class="live-dot"></span>
        ${minuto}'
      </span>
    `;
  }

  try {
    const res = await fetch('/api/resultados-oficiales');
    const jornadas = await res.json();

    const partidosLive = [];

    jornadas.forEach(jornada => {
      (jornada.partidos || []).forEach(partido => {
        if (estaEnVivo(partido)) {
          partidosLive.push({
            jornada: jornada.nombre,
            ...partido
          });
        }
      });
    });

    if (partidosLive.length === 0) {
      card.style.display = 'none';
      return;
    }

    container.innerHTML = partidosLive.map(partido => `
      <div class="live-match-row">
        <div class="live-match-main">
          <strong>${partido.equipo1}</strong>
          <span class="live-score">
            ${marcador(partido.marcador1)} - ${marcador(partido.marcador2)}
          </span>
          <strong>${partido.equipo2}</strong>
        </div>

        <div class="live-match-meta">
          ${liveBadge(partido.minuto)}
          <span>${partido.jornada}</span>
        </div>
      </div>
    `).join('');

    card.style.display = 'block';

  } catch (error) {
    console.error('Error cargando partidos en vivo:', error);
    card.style.display = 'none';
  }
});