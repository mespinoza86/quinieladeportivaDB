document.addEventListener('DOMContentLoaded', () => {
    const jugadorSelect = document.getElementById('jugadorSelect');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const searchResultadosButtonpuntos = document.getElementById('searchResultadosButtonpuntos');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const puntosContainer = document.getElementById('puntosContainer');
    const totalPuntosContainer = document.getElementById('totalPuntosContainer');

    // Cargar jugadores
    function loadJugadores() {
        fetch('/api/jugadores')
            .then(response => response.json())
            .then(jugadores => {
                if (Array.isArray(jugadores)) {
                    jugadorSelect.innerHTML = '<option value="">Selecciona un jugador</option>';
                    jugadores.forEach(jugador => {
                        const option = document.createElement('option');
                        option.value = jugador;
                        option.textContent = jugador;
                        jugadorSelect.appendChild(option);
                    });
                } else {
                    console.error('Formato inesperado de datos de jugadores:', jugadores);
                }
            })
            .catch(error => console.error('Error al cargar jugadores:', error));
    }

    // Cargar jornadas
    function loadJornadas() {
        fetch('/api/jornadas')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    jornadaSelect.innerHTML = '<option value="">Selecciona una jornada</option>';
                    data.forEach(jornada => {
                        const option = document.createElement('option');
                        option.value = jornada.nombre;
                        option.textContent = jornada.nombre;
                        jornadaSelect.appendChild(option);
                    });
                } else {
                    console.error('Formato inesperado de datos de jornadas:', data);
                }
            })
            .catch(error => console.error('Error al cargar jornadas:', error));
    }

    // Validar marcador: no null/undefined, no string vacío и numérico válido
    function isValidScore(v) {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        // Number('') -> 0 pero ya lo hemos filtrado; convertimos y comprobamos finito
        const n = Number(v);
        return Number.isFinite(n);
    }

    // Calcular puntos: NO puntuar si falta cualquier marcador (oficial o pronosticado)
    function calcularPuntos(pronostico, resultadoOficial) {
        // protección por si alguno es undefined/null
        if (!pronostico || !resultadoOficial) return 0;

        const m1p = pronostico.marcador1;
        const m2p = pronostico.marcador2;
        const m1o = resultadoOficial.marcador1;
        const m2o = resultadoOficial.marcador2;
        const comodin = Boolean(resultadoOficial.comodin);

        // Si falta cualquiera de los 4 valores, no puntuar
        if (!isValidScore(m1p) || !isValidScore(m2p) || !isValidScore(m1o) || !isValidScore(m2o)) {
            return 0;
        }

        // Convertir a número ya que están validados
        const n1p = Number(m1p);
        const n2p = Number(m2p);
        const n1o = Number(m1o);
        const n2o = Number(m2o);

        let puntos = 0;

        // mismo ganador / empate
        const ganadorPron = n1p > n2p ? 1 : n1p < n2p ? -1 : 0;
        const ganadorOfi  = n1o > n2o ? 1 : n1o < n2o ? -1 : 0;

        if (ganadorPron === ganadorOfi) {
            puntos += comodin ? 4 : 3;
        }

        // marcador exacto
        if (n1p === n1o && n2p === n2o) {
            puntos += comodin ? 3 : 2;
        }

        return puntos;
    }

    // Buscar resultados y calcular puntos
    searchResultadosButtonpuntos.addEventListener('click', () => {
        const jugador = jugadorSelect.value;
        const jornada = jornadaSelect.value;

        if (!jugador || !jornada) {
            resultadosContainer.textContent = 'Por favor, seleccione un jugador y una jornada.';
            return;
        }

        fetch(`/api/resultados-con-equipos/${encodeURIComponent(jugador)}/${encodeURIComponent(jornada)}`)
            .then(response => {
                if (!response.ok) throw new Error('No se pudo obtener pronósticos del jugador');
                return response.json();
            })
            .then(partidos => {
                resultadosContainer.innerHTML = '';
                puntosContainer.innerHTML = '';
                totalPuntosContainer.innerHTML = '';

                if (!Array.isArray(partidos) || partidos.length === 0) {
                    resultadosContainer.textContent = 'El jugador no ha pronosticado esta jornada.';
                    return;
                }

                // obtener resultados oficiales para la jornada
                fetch('/api/resultados-oficiales')
                    .then(r => {
                        if (!r.ok) throw new Error('No se pudo obtener resultados oficiales');
                        return r.json();
                    })
                    .then(resultadosOficiales => {
                        const resultadoOficial = (Array.isArray(resultadosOficiales))
                            ? resultadosOficiales.find(j => j.nombre === jornada)
                            : null;
                        const partidosOficiales = resultadoOficial ? resultadoOficial.partidos : [];

                        let totalPuntos = 0;

                        partidos.forEach(partidoPronosticado => {
                            const partidoDiv = document.createElement('div');
                            partidoDiv.classList.add('resultado');

                            const resultadoOficialCorrespondiente = partidosOficiales.find(partido =>
                                partido.equipo1 === partidoPronosticado.equipo1 &&
                                partido.equipo2 === partidoPronosticado.equipo2
                            );

                            const puntos = calcularPuntos(partidoPronosticado, resultadoOficialCorrespondiente);
                            totalPuntos += puntos;

                            const oficialTexto = resultadoOficialCorrespondiente && isValidScore(resultadoOficialCorrespondiente.marcador1) && isValidScore(resultadoOficialCorrespondiente.marcador2)
                                ? `${resultadoOficialCorrespondiente.marcador1}-${resultadoOficialCorrespondiente.marcador2}`
                                : 'N/A';

                            partidoDiv.innerHTML = `
                                ${partidoPronosticado.equipo1} ${partidoPronosticado.marcador1} - ${partidoPronosticado.marcador2} ${partidoPronosticado.equipo2}
                                | Oficial: ${oficialTexto}
                                | Puntos: ${puntos}
                            `;
                            resultadosContainer.appendChild(partidoDiv);
                        });

                        totalPuntosContainer.innerHTML = `<h3>Total de Puntos Obtenidos: ${totalPuntos}</h3>`;
                    })
                    .catch(error => {
                        // Si falla obtener oficiales, mostramos pronósticos y Puntos = 0 (Oficial: N/A)
                        console.error('Error al obtener resultados oficiales:', error);
                        let totalPuntos = 0;
                        partidos.forEach(partidoPronosticado => {
                            const partidoDiv = document.createElement('div');
                            partidoDiv.classList.add('resultado');
                            partidoDiv.innerHTML = `
                                ${partidoPronosticado.equipo1} ${partidoPronosticado.marcador1} - ${partidoPronosticado.marcador2} ${partidoPronosticado.equipo2}
                                | Oficial: N/A
                                | Puntos: 0
                            `;
                            resultadosContainer.appendChild(partidoDiv);
                        });
                        totalPuntosContainer.innerHTML = `<h3>Total de Puntos Obtenidos: ${totalPuntos}</h3>`;
                    });
            })
            .catch(error => {
                console.error('Error al buscar resultados:', error);
                resultadosContainer.textContent = 'Error al obtener resultados.';
            });
    });

    loadJugadores();
    loadJornadas();
});
