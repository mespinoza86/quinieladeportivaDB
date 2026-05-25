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

    function parseFiltroTorneo(valor) {
        const filtro = {};

        if (!valor || valor === 'custom') {
            return filtro;
        }

        valor.split(';').forEach(parte => {
            const [key, value] = parte.split('=');

            if (key && value) {
                filtro[key.trim()] = value.trim();
            }
        });

        return filtro;
    }

    function esLigaNoPermitida(liga) {
        const texto = normalizarTexto(liga);
    
        const palabrasBloqueadas = [
            'u20',
            'u21',
            'u23',
            'sub 20',
            'sub 21',
            'sub 23',
            'reserves',
            'reserve',
            'femenil',
            'women',
            'womens',
            'femenina',
            'feminine',
            'juvenil',
            'youth'
        ];

        return palabrasBloqueadas.some(palabra =>
            texto.includes(normalizarTexto(palabra))
        );
    }

    function partidoCoincideConFiltro(partido, filtro) {
        const liga = normalizarTexto(partido.liga);
        const pais = normalizarTexto(partido.pais);

        if (esLigaNoPermitida(partido.liga)) {
            return false;
        }

        if (filtro.country && pais !== normalizarTexto(filtro.country)) {
            return false;
        }

        if (filtro.league_exact) {
            const ligaEsperada = normalizarTexto(filtro.league_exact);
        
            if (
                liga !== ligaEsperada &&
                !liga.includes(ligaEsperada)
            ) {
                return false;
            }
        }


        if (filtro.league_contains && !liga.includes(normalizarTexto(filtro.league_contains))) {
            return false;
        }

        if (filtro.league_any) {
            const opciones = filtro.league_any
                .split('|')
                .map(opcion => normalizarTexto(opcion));

            const coincideAlguna = opciones.some(opcion =>
                liga.includes(opcion)
            );

            if (!coincideAlguna) {
                return false;
            }
        }


        if (filtro.text) {
            const texto = normalizarTexto(filtro.text);
            return `${liga} ${pais}`.includes(texto);
        }

        return true;
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
                let filtroTorneo;

                if (torneoSelect.value === 'custom') {
                    filtroTorneo = {
                        text: filtroLiga
                    };
                } else {
                    filtroTorneo = parseFiltroTorneo(filtroLiga);
                }

                partidos = partidos.filter(partido =>
                    partidoCoincideConFiltro(partido, filtroTorneo)
                );
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
  <div class="team-side">
    ${partido.logoEquipo1 ? `<img src="${partido.logoEquipo1}" class="team-logo" alt="${partido.equipo1}">` : ''}
    <strong>${partido.equipo1}</strong>
  </div>

  <span class="vs">vs</span>

  <div class="team-side">
    ${partido.logoEquipo2 ? `<img src="${partido.logoEquipo2}" class="team-logo" alt="${partido.equipo2}">` : ''}
    <strong>${partido.equipo2}</strong>
  </div>
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
                logoEquipo1: partido.logoEquipo1 || '',
                logoEquipo2: partido.logoEquipo2 || '',                
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
                    <input
                        type="text"
                        class="equipo-preliminar-input"
                        data-index="${index}"
                        data-campo="equipo1"
                        value="${partido.equipo1 || ''}"
                    />

                    <span class="vs">vs</span>

                    <input
                        type="text"
                        class="equipo-preliminar-input"
                        data-index="${index}"
                        data-campo="equipo2"
                        value="${partido.equipo2 || ''}"
                    />
                </div>

                <div class="match-meta">
                    <span>${partido.liga || ''}</span>
                    <span>${partido.pais || ''}</span>
                    <span>${fechaLocal}</span>
                </div>

                <label class="field-label" style="margin-top:10px;">
                    Comodín
                </label>

                <select class="comodin-preliminar-select" data-index="${index}">
                    <option value="false" ${!partido.comodin ? 'selected' : ''}>
                        No
                    </option>
                    <option value="true" ${partido.comodin ? 'selected' : ''}>
                        Sí
                    </option>
                </select>

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
            .querySelectorAll('.equipo-preliminar-input')
            .forEach(input => {
                input.addEventListener('input', () => {
                    const index = Number(input.dataset.index);
                    const campo = input.dataset.campo;

                    partidosPreliminares[index][campo] = input.value.trim();
                });
            });

        preliminarContainer
            .querySelectorAll('.comodin-preliminar-select')
            .forEach(select => {
                select.addEventListener('change', () => {
                    const index = Number(select.dataset.index);
                    partidosPreliminares[index].comodin = select.value === 'true';
                });
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