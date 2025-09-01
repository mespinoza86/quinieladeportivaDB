document.addEventListener('DOMContentLoaded', async () => {
    const comboJornadas = document.getElementById('comboJornadas');
    const comboJugadores = document.getElementById('comboJugadores');
    const btnCopiar = document.getElementById('btnCopiar');
    const partidosContainer = document.getElementById('partidosContainer');

    // Cargar jornadas
    const jornadasResp = await fetch('/api/jornadas');
    const jornadas = await jornadasResp.json();
    jornadas.forEach(j => {
        const option = document.createElement('option');
        option.value = j.nombre;
        option.textContent = j.nombre;
        comboJornadas.appendChild(option);
    });

    // Cargar jugadores
    const jugadoresResp = await fetch('/api/jugadores');
    const jugadores = await jugadoresResp.json();
    jugadores.forEach(j => {
        const option = document.createElement('option');
        option.value = j;
        option.textContent = j;
        comboJugadores.appendChild(option);
    });

let textoResultado = ''; // Guardar el texto generado para WhatsApp

btnCopiar.addEventListener('click', async () => {
    const jornada = comboJornadas.value;
    const jugador = comboJugadores.value;

    if (!jornada || !jugador) {
        alert('Selecciona jornada y jugador');
        return;
    }

    const resp = await fetch(`/api/resultados-con-equipos/${jugador}/${jornada}`);
    if (!resp.ok) {
        alert('No hay resultados para este jugador en esta jornada');
        return;
    }
    const resultados = await resp.json();

    if (resultados.length === 0) {
        alert('El jugador no tiene resultados en esta jornada');
        return;
    }

    textoResultado = `-------------------------------\n`;
    textoResultado += `Nombre: ${jugador}\n`;
    textoResultado += `Jornada: ${jornada}\n`;
    textoResultado += `-------------------------------\n`;

    resultados.forEach((r, i) => {
        textoResultado += `${i+1}. ${r.equipo1} ${r.marcador1 || 0}\n   ${r.equipo2} ${r.marcador2 || 0}\n`;
    });

    await navigator.clipboard.writeText(textoResultado);
    alert('Texto copiado al portapapeles');
});

btnWhatsapp.addEventListener('click', () => {
    if (!textoResultado) {
        alert('Primero genera el texto copiando los resultados');
        return;
    }
    // Crear link de WhatsApp con el texto
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoResultado)}`;
    window.open(url, '_blank');
});

});
