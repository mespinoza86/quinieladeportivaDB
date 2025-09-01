let textoResultado = ''; // Guardar el texto para copiar y WhatsApp

// Cargar jornadas en el combobox
async function cargarJornadas() {
    const combo = document.getElementById('comboJornadas');
    try {
        const res = await fetch('/api/jornadas');
        const jornadas = await res.json();
        jornadas.forEach(j => {
            const option = document.createElement('option');
            option.value = j.nombre;
            option.textContent = j.nombre;
            combo.appendChild(option);
        });
    } catch (err) {
        console.error('Error cargando jornadas:', err);
    }
}

// Copiar resultados de todos los jugadores de la jornada seleccionada
async function copiarResultados() {
    const jornadaSeleccionada = document.getElementById('comboJornadas').value;
    if (!jornadaSeleccionada) return alert('Selecciona una jornada');

    try {
        const jugadoresRes = await fetch('/api/jugadores');
        const jugadores = await jugadoresRes.json();

        textoResultado = '';

        for (const jugador of jugadores) {
            const resJugador = await fetch(`/api/resultados-con-equipos/${encodeURIComponent(jugador)}/${encodeURIComponent(jornadaSeleccionada)}`);
            if (resJugador.status === 404) continue;

            const pronosticos = await resJugador.json();
            if (pronosticos.length === 0) continue;

            textoResultado += `-------------------------------\n`;
            textoResultado += `Nombre: ${jugador}\n`;
            textoResultado += `-------------------------------\n`;

            pronosticos.forEach((p, i) => {
                textoResultado += `${i + 1}. ${p.equipo1} ${p.marcador1 || '0'}\n`;
                textoResultado += `   ${p.equipo2} ${p.marcador2 || '0'}\n`;
            });

            textoResultado += `\n`;
        }

        if (!textoResultado) textoResultado = 'No hay resultados disponibles para esta jornada.';

        await navigator.clipboard.writeText(textoResultado);
        document.getElementById('resultados').textContent = textoResultado;

        alert('Resultados copiados al portapapeles');

    } catch (err) {
        console.error('Error copiando resultados:', err);
        alert('Error al copiar resultados');
    }
}

// Enviar resultados por WhatsApp
function enviarWhatsApp() {
    if (!textoResultado) {
        alert('Primero genera los resultados copiándolos');
        return;
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoResultado)}`;
    window.open(url, '_blank');
}

// Inicialización
document.getElementById('btnCopiar').addEventListener('click', copiarResultados);
document.getElementById('btnWhatsapp').addEventListener('click', enviarWhatsApp);
cargarJornadas();

