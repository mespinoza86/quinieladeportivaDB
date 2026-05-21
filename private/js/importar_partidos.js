document.addEventListener('DOMContentLoaded', () => {
    const buscarButton = document.getElementById('buscarPartidosButton');
    const crearButton = document.getElementById('crearJornadaButton');

    const fechaInput = document.getElementById('fechaInput');
    const torneoSelect = document.getElementById('torneoSelect');

    const customLeagueBox = document.getElementById('customLeagueBox');
    const customLeagueNameInput = document.getElementById('customLeagueNameInput');

    const partidosContainer = document.getElementById('partidosContainer');
    const estadoBusqueda = document.getElementById('estadoBusqueda');

    const nombreJornadaInput = document.getElementById('nombreJornadaInput');
    const fechaCierreInput = document.getElementById('fechaCierreInput');

    let partidosDisponibles = [];
    let partidosPreliminares = [];

    torneoSelect.addEventListener('change', () => {
        customLeagueBox.style.display =
            torneoSelect.value === 'custom' ? 'block' : 'none';
    });

    function normalizarTexto(texto) {
        return (texto || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function mostrarEstado(mensaje) {
        estadoBusqueda.style.display = 'block';
        estadoBusqueda.textContent = mensaje;
    }

    buscarButton.addEventListener('click', async () => {
        const fecha = fechaInput.value;

        if (!fecha) {
            alert('Selecciona una fecha');
            return;
        }

        let filtroLiga = torneoSelect.value;

        if (torneoSelect.value === 'custom') {
            filtroLiga = customLeagueNameInput.value.trim();

            if (!filtroLiga) {
                alert('Escribe el texto del torneo que quieres buscar');
                return;
            }
        }

        partidosDisponibles = [];
        partidosContainer.innerHTML = '';
        mostrarEstado('Buscando partidos...');

        try {
            const url = `/api/football/fixtures?date=${encodeURIComponent(fecha)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                mostrarEstado(data.error || 'Error buscando partidos');
                return;
            }

            let partidos = Array.isArray(data) ? data : [];

            if (filtroLiga) {
                const filtro = normalizarTexto(filtroLiga);

                partidos = partidos.filter(partido => {
                    const liga = normalizarTexto(partido.liga);
                    const pais = normalizarTexto(partido.pais);
                    const combinado = `${liga} ${pais}`;

                    return combinado.includes(filtro);
                });
            }

            partidosDisponibles = partidos;

            if (!partidosDisponibles.length) {
                mostrarEstado('No se encontraron partidos para ese torneo en esa fecha.');
                renderizarPartidos();
                return;
            }

            mostrarEstado(`Se encontraron ${partidosDisponibles.length} partidos.`);
            renderizarPartidos();

        } catch (error) {
            console.error('Error buscando partidos:', error);
            mostrarEstado('Error obteniendo partidos.');
        }
    });

    function renderizarPartidos() {
        partidosContainer.innerHTML = '';

        const acciones = document.createElement('div');
        acciones.className = 'button-stack';
        acciones.innerHTML = `
            <button id="agregarPreliminaresButton" type="button">
                Agregar seleccionados a la jornada
            </button>
        `;
        partidosContainer.appendChild(acciones);

        partidosDisponibles.forEach((partido, index) => {
            const yaAgregado = partidosPreliminares.some(
                p => p.apiFixtureId === partido.apiFixtureId
            );

            const card = document.createElement('div');
            card.className = 'match-card';

            const fechaLocal = partido.fecha
                ? new Date(partido.fecha).toLocaleString('es-CR', {
                    timeZone: 'America/Costa_Rica',
                    dateStyle: 'short',
                    timeStyle: 'short'
                })
                : 'Sin fecha';

            const marcador1 = partido.marcador1 ?? '-';
            const marcador2 = partido.marcador2 ?? '-';

            card.innerHTML = `
                <div class="match-header">
                    <label class="checkbox-card">
                        <input
                            type="checkbox"
                            class="partidoCheckbox"
                            data-index="${index}"
                            ${yaAgregado ? 'disabled' : ''}
                        />
                        <span>${yaAgregado ? 'Ya agregado' : 'Seleccionar'}</span>
                    </label>
                </div>

                <div class="match-teams">
                    <strong>${partido.equipo1}</strong>
                    <span class="vs">vs</span>
                    <strong>${partido.equipo2}</strong>
                </div>

                <div class="match-score">
                    ${marcador1} - ${marcador2}
                </div>

                <div class="match-meta">
                    <span>${partido.liga || 'Liga'}</span>
                    <span>${partido.pais || ''}</span>
                    <span>Estado: ${partido.estado || 'N/A'}</span>
                    <span>${fechaLocal}</span>
                </div>

                <label class="checkbox-card">
                    <input
                        type="checkbox"
                        class="comodinCheckbox"
                        data-index="${index}"
                        ${yaAgregado ? 'disabled' : ''}
                    />
                    <span>Comodín</span>
                </label>
            `;

            partidosContainer.appendChild(card);
        });

        document
            .getElementById('agregarPreliminaresButton')
            .addEventListener('click', agregarSeleccionadosAPreliminar);
    }

    function agregarSeleccionadosAPreliminar() {
        const checkboxes = document.querySelectorAll('.partidoCheckbox');
        let agregados = 0;

        checkboxes.forEach(cb => {
            if (!cb.checked) return;

            const index = Number(cb.dataset.index);
            const partido = partidosDisponibles[index];

            const existe = partidosPreliminares.some(
                p => p.apiFixtureId === partido.apiFixtureId
            );

            if (existe) return;

            const comodinCheckbox = document.querySelector(
                `.comodinCheckbox[data-index="${index}"]`
            );

            partidosPreliminares.push({
                equipo1: partido.equipo1,
                equipo2: partido.equipo2,
                comodin: comodinCheckbox ? comodinCheckbox.checked : false,
                apiFixtureId: partido.apiFixtureId,
                apiLeagueId: partido.apiLeagueId,
                fecha: partido.fecha,
                estado: partido.estado,
                liga: partido.liga,
                pais: partido.pais
            });

            agregados++;
        });

        if (agregados === 0) {
            alert('No seleccionaste partidos nuevos.');
            return;
        }

        alert(`${agregados} partido(s) agregado(s) a la jornada preliminar.`);
        renderizarPartidos();
        renderizarPreliminares();
    }

    function renderizarPreliminares() {
        let preliminarContainer = document.getElementById('partidosPreliminaresContainer');

        if (!preliminarContainer) {
            preliminarContainer = document.createElement('div');
            preliminarContainer.id = 'partidosPreliminaresContainer';
            preliminarContainer.className = 'matches-container';

            crearButton.parentElement.insertBefore(preliminarContainer, crearButton);
        }

        if (!partidosPreliminares.length) {
            preliminarContainer.innerHTML = `
                <div class="info-card">
                    No hay partidos agregados todavía.
                </div>
            `;
            return;
        }

        preliminarContainer.innerHTML = `
            <h3>Partidos agregados a la jornada (${partidosPreliminares.length})</h3>
        `;

        partidosPreliminares.forEach((partido, index) => {
            const card = document.createElement('div');
            card.className = 'match-card';

            const fechaLocal = partido.fecha
                ? new Date(partido.fecha).toLocaleString('es-CR', {
                    timeZone: 'America/Costa_Rica',
                    dateStyle: 'short',
                    timeStyle: 'short'
                })
                : 'Sin fecha';

            card.innerHTML = `
                <div class="match-teams">
                    <strong>${partido.equipo1}</strong>
                    <span class="vs">vs</span>
                    <strong>${partido.equipo2}</strong>
                </div>

                <div class="match-meta">
                    <span>${partido.liga || ''}</span>
                    <span>${partido.pais || ''}</span>
                    <span>${fechaLocal}</span>
                    <span>${partido.comodin ? 'Comodín' : 'Normal'}</span>
                </div>

                <button
                    type="button"
                    class="danger-button"
                    data-remove-index="${index}"
                >
                    Quitar
                </button>
            `;

            preliminarContainer.appendChild(card);
        });

        preliminarContainer
            .querySelectorAll('[data-remove-index]')
            .forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = Number(btn.dataset.removeIndex);
                    partidosPreliminares.splice(index, 1);
                    renderizarPreliminares();
                    renderizarPartidos();
                });
            });
    }

    crearButton.addEventListener('click', async () => {
        const nombre = nombreJornadaInput.value.trim();

        if (!nombre) {
            alert('Debes escribir el nombre de la jornada');
            return;
        }

        if (!partidosPreliminares.length) {
            alert('Primero agrega partidos a la jornada preliminar.');
            return;
        }

        try {
            const response = await fetch('/api/jornadas/importar-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    fechaCierre: fechaCierreInput.value || null,
                    partidos: partidosPreliminares
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Error creando jornada');
                return;
            }

            alert('Jornada creada correctamente');
            window.location.href = 'ver_jornadas.html';

        } catch (error) {
            console.error('Error creando jornada:', error);
            alert('Error creando jornada');
        }
    });

    renderizarPreliminares();
});