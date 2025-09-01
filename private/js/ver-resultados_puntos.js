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

    // Función para mostrar modal y capturar contraseña
function pedirPassword() {
    return new Promise((resolve) => {
        const modal = document.getElementById("passwordModal");
        const input = document.getElementById("passwordInput");
        const okBtn = document.getElementById("passwordOk");
        const cancelBtn = document.getElementById("passwordCancel");

        modal.style.display = "flex"; // mostrar modal
        input.value = "";
        input.focus();

        function cerrar(valor) {
            modal.style.display = "none";
            okBtn.removeEventListener("click", aceptar);
            cancelBtn.removeEventListener("click", cancelar);
            resolve(valor);
        }

        function aceptar() {
            cerrar(input.value);
        }

        function cancelar() {
            cerrar(null);
        }

        okBtn.addEventListener("click", aceptar);
        cancelBtn.addEventListener("click", cancelar);

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") aceptar();
        });
    });
}


    // Validar marcador
    function isValidScore(v) {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        const n = Number(v);
        return Number.isFinite(n);
    }

    // Calcular puntos
    function calcularPuntos(pronostico, resultadoOficial) {
        if (!pronostico || !resultadoOficial) return 0;
        const m1p = pronostico.marcador1;
        const m2p = pronostico.marcador2;
        const m1o = resultadoOficial.marcador1;
        const m2o = resultadoOficial.marcador2;
        const comodin = Boolean(resultadoOficial.comodin);

        if (!isValidScore(m1p) || !isValidScore(m2p) || !isValidScore(m1o) || !isValidScore(m2o)) {
            return 0;
        }

        const n1p = Number(m1p);
        const n2p = Number(m2p);
        const n1o = Number(m1o);
        const n2o = Number(m2o);

        let puntos = 0;

        const ganadorPron = n1p > n2p ? 1 : n1p < n2p ? -1 : 0;
        const ganadorOfi = n1o > n2o ? 1 : n1o < n2o ? -1 : 0;
        if (ganadorPron === ganadorOfi) {
            puntos += comodin ? 4 : 3;
        }

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

        // Función para pedir datos al backend
        function fetchResultados(password = "") {
            return fetch(`/api/resultados-seguros/${encodeURIComponent(jugador)}/${encodeURIComponent(jornada)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            }).then(r => r.json());
        }

        // Primer intento SIN contraseña
        fetchResultados().then(data => {
            if (!data.success && data.error === "Contraseña requerida") {
                // Solo pedimos contraseña si el backend lo pide
                return pedirPassword().then(password => {
                if (!password) {
                    resultadosContainer.textContent = "No se ingresó contraseña.";
                return;
            }
        return fetchResultados(password);
});


            }
            return data;
        })
        .then(data => {
            if (!data || !data.success) {
                resultadosContainer.textContent = data?.error || "Error al obtener resultados.";
                return;
            }

            const partidos = data.partidos;
            resultadosContainer.innerHTML = '';
            puntosContainer.innerHTML = '';
            totalPuntosContainer.innerHTML = '';

            if (!Array.isArray(partidos) || partidos.length === 0) {
                resultadosContainer.textContent = 'El jugador no ha pronosticado esta jornada.';
                return;
            }

            // obtener resultados oficiales
            fetch('/api/resultados-oficiales')
                .then(r => r.json())
                .then(resultadosOficiales => {
                    const resultadoOficial = (Array.isArray(resultadosOficiales)) 
                        ? resultadosOficiales.find(j => j.nombre === jornada) 
                        : null;
                    const partidosOficiales = resultadoOficial ? resultadoOficial.partidos : [];

                    let totalPuntos = 0;
                    partidos.forEach(partidoPronosticado => {
                        const partidoDiv = document.createElement('div');
                        partidoDiv.classList.add('resultado');

                        const resultadoOficialCorrespondiente = partidosOficiales.find(
                            partido => partido.equipo1 === partidoPronosticado.equipo1 && partido.equipo2 === partidoPronosticado.equipo2
                        );

                        const puntos = calcularPuntos(partidoPronosticado, resultadoOficialCorrespondiente);
                        totalPuntos += puntos;

                        const oficialTexto = resultadoOficialCorrespondiente && 
                            isValidScore(resultadoOficialCorrespondiente.marcador1) && 
                            isValidScore(resultadoOficialCorrespondiente.marcador2)
                            ? `${resultadoOficialCorrespondiente.marcador1}-${resultadoOficialCorrespondiente.marcador2}`
                            : 'N/A';

                        partidoDiv.innerHTML = `${partidoPronosticado.equipo1} ${partidoPronosticado.marcador1} - ${partidoPronosticado.marcador2} ${partidoPronosticado.equipo2} | Oficial: ${oficialTexto} | Puntos: ${puntos}`;
                        resultadosContainer.appendChild(partidoDiv);
                    });

                    totalPuntosContainer.innerHTML = `<h3>Total de Puntos Obtenidos: ${totalPuntos}</h3>`;
                })
                .catch(error => {
                    console.error('Error al obtener resultados oficiales:', error);
                    resultadosContainer.textContent = 'Error al obtener resultados oficiales.';
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
