document.addEventListener('DOMContentLoaded', () => {
  const jornadaSelect = document.getElementById('jornadaSelect');
  const estadoJornada = document.getElementById('estadoJornada');
  const ganadoresJornada = document.getElementById('ganadoresJornada');
  const tablaBody = document.querySelector('#tablaJornada tbody');
  const mensajeTabla = document.getElementById('mensajeTabla');

  function limpiarResultado() {
    tablaBody.innerHTML = '';
    estadoJornada.innerHTML = '';
    ganadoresJornada.innerHTML = '';
    mensajeTabla.textContent = '';
  }

  function crearCelda(texto) {
    const celda = document.createElement('td');
    celda.textContent = texto;
    return celda;
  }

  function mostrarTabla(data) {
    limpiarResultado();

    const estado = document.createElement('div');
    estado.className = data.finalizada ? 'status-complete' : 'status-pending';
    estado.textContent = data.finalizada
      ? `Jornada finalizada · ${data.partidosTotales} resultados oficiales registrados`
      : `Jornada pendiente · ${data.partidosConResultado} de ${data.partidosTotales} resultados oficiales`;
    estadoJornada.appendChild(estado);

    if (data.finalizada && data.ganadores.length > 0) {
      const titulo = document.createElement('strong');
      titulo.textContent = data.ganadores.length > 1 ? '🏆 Ganadores (premio compartido)' : '🏆 Ganador';
      const nombres = document.createElement('span');
      nombres.textContent = data.ganadores.join(', ');
      ganadoresJornada.append(titulo, nombres);
    } else if (!data.finalizada) {
      ganadoresJornada.textContent = 'El ganador se confirmará cuando todos los partidos tengan resultado oficial.';
    }

    if (!Array.isArray(data.clasificacion) || data.clasificacion.length === 0) {
      mensajeTabla.textContent = 'No hay jugadores registrados.';
      return;
    }

    data.clasificacion.forEach(fila => {
      const row = document.createElement('tr');
      if (fila.ganador) row.classList.add('jornada-winner-row');

      row.append(
        crearCelda(fila.posicion === 1 ? '🥇 1' : fila.posicion),
        crearCelda(fila.jugador),
        crearCelda(fila.puntos),
        crearCelda(fila.exactos),
        crearCelda(fila.aciertos)
      );
      tablaBody.appendChild(row);
    });
  }

  async function cargarTabla() {
    const jornada = jornadaSelect.value;
    if (!jornada) {
      limpiarResultado();
      return;
    }

    limpiarResultado();
    mensajeTabla.textContent = 'Cargando clasificación...';

    try {
      const response = await fetch(`/api/tabla-jornada/${encodeURIComponent(jornada)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar la tabla');
      mostrarTabla(data);
    } catch (error) {
      limpiarResultado();
      mensajeTabla.textContent = error.message;
    }
  }

  async function iniciar() {
    try {
      const response = await fetch('/api/jornadas');
      const jornadas = await response.json();
      if (!response.ok || !Array.isArray(jornadas)) throw new Error('No se pudieron cargar las jornadas');

      jornadaSelect.innerHTML = '<option value="">Selecciona una jornada</option>';
      jornadas.forEach(jornada => {
        const option = document.createElement('option');
        option.value = jornada.nombre;
        option.textContent = jornada.nombre;
        jornadaSelect.appendChild(option);
      });

      if (jornadas.length > 0) {
        jornadaSelect.value = jornadas[jornadas.length - 1].nombre;
        await cargarTabla();
      } else {
        mensajeTabla.textContent = 'No hay jornadas registradas.';
      }
    } catch (error) {
      jornadaSelect.innerHTML = '<option value="">Sin jornadas disponibles</option>';
      mensajeTabla.textContent = error.message;
    }
  }

  jornadaSelect.addEventListener('change', cargarTabla);
  iniciar();
});
