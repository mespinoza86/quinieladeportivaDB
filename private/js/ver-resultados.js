document.addEventListener('DOMContentLoaded', () => {
    const jugadorSelect = document.getElementById('jugadorSelect');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const searchResultadosButton = document.getElementById('searchResultadosButton');
    const resultadosContainer = document.getElementById('resultadosContainer');

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
                    data.forEach(([nombre]) => {
                        const option = document.createElement('option');
                        option.value = nombre; // Usa el nombre de la jornada directamente
                        option.textContent = nombre; // Muestra el nombre de la jornada
                        jornadaSelect.appendChild(option);
                    });
                } else {
                    console.error('Formato inesperado de datos de jornadas:', data);
                }
            })
            .catch(error => console.error('Error al cargar jornadas:', error));
    }

    // Función para buscar resultados
    searchResultadosButton.addEventListener('click', () => {
        const jugador = jugadorSelect.value;
        const jornada = jornadaSelect.value;
    
        if (jugador && jornada) {
            fetch(`/api/resultados-con-equipos/${jugador}/${jornada}`)
                .then(response => {
                    if (!response.ok) throw new Error('No se pudo obtener resultados');
                    return response.json();
                })
                .then(partidos => {
                    resultadosContainer.innerHTML = '';

                    if (partidos.length === 0) {
                        resultadosContainer.textContent = 'El jugador no ha pronosticado esta jornada.';
                        return;
                    }

                    partidos.forEach(partido => {
                        const partidoDiv = document.createElement('div');
                        partidoDiv.classList.add('resultado');
                        partidoDiv.textContent = `${partido.equipo1} ${partido.marcador1} - ${partido.marcador2} ${partido.equipo2}`;
                        resultadosContainer.appendChild(partidoDiv);
                    });
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