document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Cargar datos JSON de los archivos resultados.json y resultados-oficiales.json
        const resultadosResponse = await fetch('/api/resultados');
        const resultadosData = await resultadosResponse.json();

        const oficialesResponse = await fetch('/api/resultados-oficiales');
        const oficialesData = await oficialesResponse.json();

        // Rellenar el combobox de jornadas
        const jornadas = [...new Set(resultadosData.map(jugador => jugador[0].split('_')[1]))]; // Extrae las jornadas únicas
        const jornadaSelect = document.getElementById('jornada-select');

        jornadas.forEach(jornada => {
            const option = document.createElement('option');
            option.value = jornada;
            option.textContent = jornada;
            jornadaSelect.appendChild(option);
        });

        // Manejar el evento de clic en el botón "Ver Resultados"
        document.getElementById('ver-resultados-btn').addEventListener('click', function() {
            const selectedJornada = jornadaSelect.value;
            mostrarResultados(selectedJornada, resultadosData, oficialesData);
        });

        // Manejar el evento de clic en el botón "Volver al Inicio" (arriba)
        document.getElementById('volver-btn-top').addEventListener('click', function() {
            window.location.href = '/index.html'; // Asumiendo que index.html está en el root
        });

        // Manejar el evento de clic en el botón "Volver al Inicio" (abajo)
        document.getElementById('volver-btn-bottom').addEventListener('click', function() {
            window.location.href = '/index.html'; // Asumiendo que index.html está en el root
        });

    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
});

async function obtenerPartidosJornada(jornada) {
    // Obtener los partidos de la jornada desde la API para obtener equipos y comodines
    const response = await fetch(`/api/jornadas/${jornada}`);
    if (!response.ok) {
        console.error("No se pudo obtener la información de la jornada");
        return [];
    }
    return await response.json();
}

function mostrarResultados(jornada, resultadosData, oficialesData) {
    // Referencia al cuerpo de la tabla
    const tablaCuerpo = document.querySelector('#tabla-resultados tbody');
    tablaCuerpo.innerHTML = ''; // Limpiar tabla

    // Filtrar resultados por jornada
    const resultadosJornada = resultadosData.filter(jugador => jugador[0].includes(jornada));

    // Obtener resultados oficiales para la jornada
    const resultadoOficialJornada = oficialesData.find(oficial => oficial[0] === jornada);
    const resultadosOficiales = resultadoOficialJornada ? resultadoOficialJornada[1] : [];

    // Obtener partidos de la jornada para asociar equipos
    obtenerPartidosJornada(jornada).then(partidos => {
        // Crear mapa para agrupar por partido (clave "equipo1 vs equipo2")
        const partidosMap = new Map();

        resultadosJornada.forEach(jugadorResultados => {
            const keyJugadorJornada = jugadorResultados[0];
            const nombreJugador = keyJugadorJornada.split('_')[0];
            const pronosticos = jugadorResultados[1]; // Array de pronósticos para la jornada

            pronosticos.forEach((pronostico, index) => {
                const partido = partidos[index]; // Partido de la jornada correspondiente al índice
                if (!partido) return;

                const partidoClave = `${partido.equipo1} vs ${partido.equipo2}`;

                if (!partidosMap.has(partidoClave)) {
                    partidosMap.set(partidoClave, { jugadores: [], partido });
                }

                partidosMap.get(partidoClave).jugadores.push({
                    nombreJugador,
                    marcador1: pronostico.marcador1,
                    marcador2: pronostico.marcador2
                });
            });
        });

        // Mostrar resultados en la tabla
        partidosMap.forEach((data, partidoClave) => {
            // Buscar resultado oficial para este partido
            const partidoOficial = resultadosOficiales.find(p => `${p.equipo1} vs ${p.equipo2}` === partidoClave);
            const resultadoOficialTexto = partidoOficial
                ? `${partidoOficial.equipo1} ${partidoOficial.marcador1} - ${partidoOficial.equipo2} ${partidoOficial.marcador2}`
                : '';

            data.jugadores.forEach((jugador, index) => {
                const fila = document.createElement('tr');

                // Nombre del jugador
                const celdaJugador = document.createElement('td');
                celdaJugador.textContent = jugador.nombreJugador;
                fila.appendChild(celdaJugador);

                // Resultado pronosticado
                const celdaPronosticado = document.createElement('td');
                celdaPronosticado.textContent = `${data.partido.equipo1} ${jugador.marcador1} - ${data.partido.equipo2} ${jugador.marcador2}`;
                fila.appendChild(celdaPronosticado);

                // Resultado oficial (solo en la primera fila del partido)
                const celdaOficial = document.createElement('td');
                celdaOficial.textContent = (index === 0) ? resultadoOficialTexto : "";
                fila.appendChild(celdaOficial);

                // Puntos obtenidos
                const celdaPuntos = document.createElement('td');
                const puntosObtenidos = calcularPuntos(
                    { marcador1: jugador.marcador1, marcador2: jugador.marcador2 },
                    partidoOficial
                );
                celdaPuntos.textContent = puntosObtenidos;
                fila.appendChild(celdaPuntos);

                tablaCuerpo.appendChild(fila);
            });
        });

        // Mostrar botones "Volver al Inicio"
        document.getElementById('volver-btn-bottom').style.display = 'block';
        document.getElementById('volver-btn-top').style.display = 'block';
    });
}

function calcularPuntos(pronostico, partidoOficial) {
    let puntos = 0;

    if (!partidoOficial) return puntos;

    const marcador1Pronosticado = parseInt(pronostico.marcador1, 10);
    const marcador2Pronosticado = parseInt(pronostico.marcador2, 10);
    const marcador1Oficial = parseInt(partidoOficial.marcador1, 10);
    const marcador2Oficial = parseInt(partidoOficial.marcador2, 10);
    const esComodin = partidoOficial.comodin || false;

    if (
        !isNaN(marcador1Pronosticado) && !isNaN(marcador2Pronosticado) &&
        !isNaN(marcador1Oficial) && !isNaN(marcador2Oficial)
    ) {
        if (marcador1Pronosticado === marcador1Oficial && marcador2Pronosticado === marcador2Oficial) {
            puntos += 5;
            if (esComodin) puntos += 2;
        } else {
            // Resultado ganador, empate o perdido coincide
            const resultadoPronosticado = marcador1Pronosticado === marcador2Pronosticado ? 'empate' :
                (marcador1Pronosticado > marcador2Pronosticado ? 'gana1' : 'gana2');
            const resultadoOficial = marcador1Oficial === marcador2Oficial ? 'empate' :
                (marcador1Oficial > marcador2Oficial ? 'gana1' : 'gana2');

            if (resultadoPronosticado === resultadoOficial) {
                puntos += 3;
                if (esComodin) puntos += 1;
            }
        }
    }

    return puntos;
}
