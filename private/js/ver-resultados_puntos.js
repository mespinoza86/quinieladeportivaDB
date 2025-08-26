document.addEventListener('DOMContentLoaded', () => {
    const jugadorSelect = document.getElementById('jugadorSelect');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const searchResultadosButtonpuntos = document.getElementById('searchResultadosButtonpuntos');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const puntosContainer = document.getElementById('puntosContainer');
    const totalPuntosContainer = document.getElementById('totalPuntosContainer');

    // Función para cargar jugadores
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

    // Función para cargar jornadas
    function loadJornadas() {
        fetch('/api/jornadas')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    jornadaSelect.innerHTML = '<option value="">Selecciona una jornada</option>';
                    data.forEach(jornada => {
                        const option = document.createElement('option');
                        option.value = jornada.nombre;   // ahora usamos la propiedad del objeto
                        option.textContent = jornada.nombre;
                        jornadaSelect.appendChild(option);
                    });
                } else {
                    console.error('Formato inesperado de datos de jornadas:', data);
                }
            })
            .catch(error => console.error('Error al cargar jornadas:', error));
    }

    // Función para validar si un valor es nulo o está en blanco
    function esValido(valor) {
        if (typeof valor === 'string') {
            return valor.trim() !== '';
        }
        return valor !== null && valor !== undefined;
    }    

    // Función para calcular los puntos
// Función para calcular los puntos
function calcularPuntos(pronostico, resultadoOficial) {
    let puntos = 0;

    // Convertimos a números siempre
    const marcador1Pronosticado = Number(pronostico.marcador1);
    const marcador2Pronosticado = Number(pronostico.marcador2);
    const marcador1Oficial = Number(resultadoOficial.marcador1);
    const marcador2Oficial = Number(resultadoOficial.marcador2);
    const comodin = resultadoOficial.comodin;

    if (esValido(marcador1Pronosticado) && esValido(marcador2Pronosticado) &&
        esValido(marcador1Oficial) && esValido(marcador2Oficial)) {

        // Verificar el resultado (quién gana / empate)
        const mismoGanador =
            (marcador1Pronosticado > marcador2Pronosticado && marcador1Oficial > marcador2Oficial) ||
            (marcador1Pronosticado < marcador2Pronosticado && marcador1Oficial < marcador2Oficial) ||
            (marcador1Pronosticado === marcador2Pronosticado && marcador1Oficial === marcador2Oficial);

        if (mismoGanador) {
            puntos += comodin ? 4 : 3; // acertó ganador/empate
        }

        // Verificar marcador exacto
        if (marcador1Pronosticado === marcador1Oficial && marcador2Pronosticado === marcador2Oficial) {
            puntos += comodin ? 3 : 2;
        }
    }

    return puntos;
}



    // Función para buscar resultados
    searchResultadosButtonpuntos.addEventListener('click', () => {
        const jugador = jugadorSelect.value;
        const jornada = jornadaSelect.value;

        if (jugador && jornada) {
            fetch(`/api/resultados-con-equipos/${jugador}/${jornada}`)
                .then(response => response.json())
                .then(partidos => {
                    if (Array.isArray(partidos) && partidos.length > 0) {
                        resultadosContainer.innerHTML = '';
                        puntosContainer.innerHTML = '';
                        totalPuntosContainer.innerHTML = '';

                        fetch('/api/resultados-oficiales')
                            .then(response => response.json())
                            .then(resultadosOficiales => {
                                // ahora resultadosOficiales es un array de objetos { nombre, partidos }
                                const resultadoOficial = resultadosOficiales.find(j => j.nombre === jornada);
                                const partidosOficiales = resultadoOficial ? resultadoOficial.partidos : [];

                                let totalPuntos = 0;
                                partidos.forEach(partidoPronosticado => {
                                    const partidoDiv = document.createElement('div');
                                    partidoDiv.classList.add('resultado');                                

                                    const resultadoOficialCorrespondiente = partidosOficiales.find(partido =>
                                        partido.equipo1 === partidoPronosticado.equipo1 &&
                                        partido.equipo2 === partidoPronosticado.equipo2
                                    );

                                    const puntos = resultadoOficialCorrespondiente ? calcularPuntos(partidoPronosticado, resultadoOficialCorrespondiente) : 0;
                                    totalPuntos += puntos;

                                    partidoDiv.innerHTML = `
                                                ${partidoPronosticado.equipo1} ${partidoPronosticado.marcador1} - ${partidoPronosticado.marcador2} ${partidoPronosticado.equipo2}
                                                | Oficial: ${resultadoOficialCorrespondiente ? resultadoOficialCorrespondiente.marcador1 + '-' + resultadoOficialCorrespondiente.marcador2 : 'N/A'}
                                                | Puntos: ${puntos}
                                    `;

                                    resultadosContainer.appendChild(partidoDiv);
                                });

                                totalPuntosContainer.innerHTML = `<h3>Total de Puntos Obtenidos: ${totalPuntos}</h3>`;
                            })
                            .catch(error => {
                                console.error('Error al obtener resultados oficiales:', error);

                                let totalPuntos = 0;
                                partidos.forEach(partidoPronosticado => {
                                    const partidoDiv = document.createElement('div');
                                    partidoDiv.classList.add('resultado');
                                    const puntos = 0;
                                    totalPuntos += puntos;

                                    partidoDiv.innerHTML = `
                                            ${partidoPronosticado.equipo1} ${partidoPronosticado.marcador1} - ${partidoPronosticado.marcador2} ${partidoPronosticado.equipo2}
                                            | Oficial: ${resultadoOficialCorrespondiente ? resultadoOficialCorrespondiente.marcador1 + '-' + resultadoOficialCorrespondiente.marcador2 : 'N/A'}
                                            | Puntos: ${puntos}
                                    `;


                                    resultadosContainer.appendChild(partidoDiv);
                                });

                                totalPuntosContainer.innerHTML = `<h3>Total de Puntos Obtenidos: ${totalPuntos}</h3>`;
                            });
                    } else {
                        resultadosContainer.textContent = 'El jugador no ha pronosticado esta jornada.';
                    }
                })
                .catch(error => {
                    console.error('Error al buscar resultados:', error);
                    resultadosContainer.textContent = 'Error al obtener resultados.';
                });
        } else {
            resultadosContainer.textContent = 'Por favor, seleccione un jugador y una jornada.';
        }
    });

    loadJugadores();
    loadJornadas();
});
