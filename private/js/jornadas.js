document.addEventListener('DOMContentLoaded', async () => {
    const equipo1Input = document.getElementById('equipo1Input');
    const equipo2Input = document.getElementById('equipo2Input');
    const comodinCheckbox = document.getElementById('comodinCheckbox');
    const addPartidoButton = document.getElementById('addPartidoButton');
    const finalizarJornadaButton = document.getElementById('finalizarJornadaButton');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const partidosJornadaList = document.getElementById('partidosJornadaList');
    const modificarJornadaSelect = document.getElementById('modificarJornadaSelect');
    const partidosModificarList = document.getElementById('partidosModificarList');
    const eliminarPartidosButton = document.getElementById('eliminarPartidosButton');
    const modificarJornadaControls = document.getElementById('modificarJornadaControls');
    const modificarEquipo1Input = document.getElementById('modificarEquipo1Input');
    const modificarEquipo2Input = document.getElementById('modificarEquipo2Input');
    const agregarPartidoButton = document.getElementById('agregarPartidoButton');
    const modificarComodinCheckbox = document.getElementById('modificarComodinSelect');

    // ⏰ Limitar fecha mínima a hoy (para input date)
    const fechaInputEl = document.getElementById('fechaCierreInput');
    if (fechaInputEl) {
        const today = new Date().toISOString().split('T')[0];
        fechaInputEl.setAttribute('min', today);
    }

    let currentPartidos = [];
    // Map<string, {partidos: Partido[], fechaCierre: Date|null}>
    let jornadas = new Map();
    let jornadaActualParaModificar = '';
    let equipos = [];

    /* ==================== Helpers de compatibilidad ==================== */

    // Normaliza /api/jornadas (pares u objetos) a Map(nombre -> {partidos, fechaCierre})
    function normalizarListadoJornadas(data) {
        const map = new Map();
        if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[0])) {
                // Formato viejo: [[nombre, partidos], ...]
                data.forEach(([nombre, partidos]) => {
                    map.set(nombre, { partidos: partidos || [], fechaCierre: null });
                });
            } else if (data.length > 0 && typeof data[0] === 'object') {
                // Formato nuevo: [{ nombre, partidos, fechaCierre }, ...]
                data.forEach(j => {
                    map.set(j.nombre, { partidos: j.partidos || [], fechaCierre: j.fechaCierre || null });
                });
            }
        }
        return map;
    }

    // Normaliza /api/jornadas/:nombre (array u objeto)
    function extraerPartidosDeDetalle(data) {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.partidos)) return data.partidos;
        return [];
    }

    /* ==================== Cargar equipos ==================== */
    async function cargarEquipos() {
        try {
            const response = await fetch('/api/equipos');
            equipos = await response.json();
        } catch (error) {
            console.error("Error al cargar los equipos:", error);
        }
    }

    /* ==================== Autocompletar ==================== */
    function autocompleteEquipo(inputElement, suggestionsId) {
        const suggestionsContainer = document.getElementById(suggestionsId);
        if (!suggestionsContainer) return; // por si el id no existe
        const query = inputElement.value.toLowerCase();

        const filteredEquipos = equipos.filter(equipo =>
            equipo.toLowerCase().includes(query)
        );

        suggestionsContainer.innerHTML = "";
        if (query && filteredEquipos.length > 0) {
            suggestionsContainer.style.display = "block";
            filteredEquipos.forEach(equipo => {
                const suggestion = document.createElement("div");
                suggestion.classList.add("autocomplete-suggestion");
                suggestion.textContent = equipo;
                suggestion.onclick = () => {
                    inputElement.value = equipo;
                    suggestionsContainer.style.display = "none";
                };
                suggestionsContainer.appendChild(suggestion);
            });
        } else {
            suggestionsContainer.style.display = "none";
        }
    }

    /* ==================== Equipos: alta rápida ==================== */
    async function agregarNuevoEquipo(nuevoEquipo) {
        if (nuevoEquipo && !equipos.includes(nuevoEquipo)) {
            equipos.push(nuevoEquipo);
            try {
                await fetch('/actualizar-equipos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ equipos })
                });
            } catch (error) {
                console.error("Error al guardar el equipo en la base de datos:", error);
            }
        }
    }

    /* ==================== Jornadas ==================== */
    function loadJornadas() {
        fetch('/api/jornadas')
            .then(response => response.json())
            .then(data => {
                // 🎯 Acepta ambos formatos
                jornadas = normalizarListadoJornadas(data);
                updateJornadaSelect();
                // No llames updateJornadaPartidos si no hay selección
            })
            .catch(err => {
                console.error('Error cargando jornadas:', err);
                jornadas = new Map();
                updateJornadaSelect();
            });
    }

    function updatePartidosList() {
        const ul = document.getElementById('partidosList');
        ul.innerHTML = '';
        currentPartidos.forEach((partido, index) => {
            const li = document.createElement('li');

            const eq1 = document.createElement('input');
            eq1.type = 'text';
            eq1.value = partido.equipo1;
            eq1.addEventListener('input', () => {
                currentPartidos[index].equipo1 = eq1.value;
            });

            const eq2 = document.createElement('input');
            eq2.type = 'text';
            eq2.value = partido.equipo2;
            eq2.addEventListener('input', () => {
                currentPartidos[index].equipo2 = eq2.value;
            });

            const comodinCB = document.createElement('input');
            comodinCB.type = 'checkbox';
            comodinCB.checked = partido.comodin;
            comodinCB.addEventListener('change', () => {
                currentPartidos[index].comodin = comodinCB.checked;
            });

            const vsLabel = document.createElement('span');
            vsLabel.textContent = ' vs ';

            li.appendChild(eq1);
            li.appendChild(vsLabel);
            li.appendChild(eq2);

            const comodinLabel = document.createElement('label');
            comodinLabel.textContent = 'Comodín';
            li.appendChild(comodinLabel);
            li.appendChild(comodinCB);

            ul.appendChild(li);
        });
    }

    function updateJornadaSelect() {
        jornadaSelect.innerHTML = '<option value="">Selecciona una jornada</option>';
        modificarJornadaSelect.innerHTML = '<option value="">Selecciona una jornada</option>';

        jornadas.forEach((info, nombre) => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            jornadaSelect.appendChild(option);

            const optionCopy = option.cloneNode(true);
            modificarJornadaSelect.appendChild(optionCopy);
        });
    }

    function updateJornadaPartidos() {
        const selectedJornada = jornadaSelect.value;
        if (!selectedJornada) {
            partidosJornadaList.innerHTML = '';
            return; // ⛔️ evita /undefined
        }

        fetch(`/api/jornadas/${encodeURIComponent(selectedJornada)}`)
            .then(response => {
                if (!response.ok) throw new Error('No se pudo cargar la jornada');
                return response.json();
            })
            .then(data => {
                const partidos = extraerPartidosDeDetalle(data);
                partidosJornadaList.innerHTML = '';
                partidos.forEach(partido => {
                    const li = document.createElement('li');
                    li.textContent = `${partido.equipo1} vs ${partido.equipo2}`;
                    if (partido.comodin) {
                        li.textContent += ' (Comodín)';
                    }
                    partidosJornadaList.appendChild(li);
                });
            })
            .catch(err => {
                console.error('Error mostrando partidos de la jornada:', err);
                partidosJornadaList.innerHTML = '';
            });
    }

function updateModificarJornadaPartidos() {
    const selectedJornada = modificarJornadaSelect.value;
    if (!selectedJornada) {
        partidosModificarList.innerHTML = '';
        return; // ⛔️ evita /undefined
    }

    fetch(`/api/jornadas/${encodeURIComponent(selectedJornada)}`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar la jornada');
            return response.json();
        })
        .then(data => {
            const partidos = extraerPartidosDeDetalle(data);
            partidosModificarList.innerHTML = '';
            partidos.forEach((partido, index) => {
                const li = document.createElement('li');

                // === Línea 1: Checkbox para modificar comodín ===
                const comodinCB = document.createElement('input');
                comodinCB.type = 'checkbox';
                comodinCB.id = `comodinCheckbox_${index}`;
                comodinCB.dataset.index = index;
                comodinCB.checked = !!partido.comodin;

                const comodinLabel = document.createElement('label');
                comodinLabel.textContent = partido.comodin ? 'Quitar de comodín' : 'Agregar como comodín';
                comodinLabel.htmlFor = `comodinCheckbox_${index}`;
                comodinCB.addEventListener('change', handleComodinChange);

                const comodinLine = document.createElement('div');
                comodinLine.appendChild(comodinCB);
                comodinLine.appendChild(comodinLabel);
                li.appendChild(comodinLine);

                // === Línea 2: Partido editable + botón actualizar ===
                const partidoLine = document.createElement('div');

                const equipo1Input = document.createElement('input');
                equipo1Input.type = 'text';
                equipo1Input.value = partido.equipo1;

                const vsLabel = document.createElement('span');
                vsLabel.textContent = ' vs ';

                const equipo2Input = document.createElement('input');
                equipo2Input.type = 'text';
                equipo2Input.value = partido.equipo2;

                const actualizarBtn = document.createElement('button');
                actualizarBtn.textContent = 'Actualizar equipos';
                actualizarBtn.addEventListener('click', () => {
                    const nuevoEq1 = equipo1Input.value.trim();
                    const nuevoEq2 = equipo2Input.value.trim();

                    if (!nuevoEq1 || !nuevoEq2) {
                        alert("Los nombres de equipos no pueden estar vacíos.");
                        return;
                    }

                    const confirmar = confirm(
                        `¿Está seguro que quiere cambiar de "${partido.equipo1} vs ${partido.equipo2}" a "${nuevoEq1} vs ${nuevoEq2}"?`
                    );

                    if (!confirmar) return;

                    // Actualizar en el servidor
                    fetch(`/api/jornadas/${encodeURIComponent(selectedJornada)}`)
                        .then(res => res.json())
                        .then(data => {
                            const partidos = extraerPartidosDeDetalle(data);
                            if (!partidos[index]) return;

                            partidos[index].equipo1 = nuevoEq1;
                            partidos[index].equipo2 = nuevoEq2;

                            return fetch('/api/jornadas', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ nombre: selectedJornada, partidos })
                            });
                        })
                        .then(() => {
                            updateJornadaPartidos();
                            updateModificarJornadaPartidos();
                        })
                        .catch(err => console.error('Error actualizando equipos:', err));
                });

                partidoLine.appendChild(equipo1Input);
                partidoLine.appendChild(vsLabel);
                partidoLine.appendChild(equipo2Input);
                partidoLine.appendChild(actualizarBtn);
                li.appendChild(partidoLine);

                // === Línea 3: Checkbox para eliminar ===
                const eliminarCB = document.createElement('input');
                eliminarCB.type = 'checkbox';
                eliminarCB.id = `eliminarCheckbox_${index}`;
                eliminarCB.dataset.index = index;

                const eliminarLabel = document.createElement('label');
                eliminarLabel.textContent = 'Selecciona para eliminar';
                eliminarLabel.htmlFor = `eliminarCheckbox_${index}`;

                const eliminarLine = document.createElement('div');
                eliminarLine.appendChild(eliminarCB);
                eliminarLine.appendChild(eliminarLabel);
                li.appendChild(eliminarLine);

                partidosModificarList.appendChild(li);
            });
        })
        .catch(err => {
            console.error('Error mostrando partidos para modificar:', err);
            partidosModificarList.innerHTML = '';
        });
}


    function handleComodinChange(event) {
        const index = Number(event.target.dataset.index);
        const isChecked = event.target.checked;

        const message = isChecked ?
            '¿Está seguro que quiere mover este partido a comodín?' :
            '¿Está seguro que quiere cambiar este partido a que no sea comodín?';

        if (!confirm(message)) {
            event.target.checked = !isChecked;
            return;
        }

        const selectedJornada = modificarJornadaSelect.value;
        if (!selectedJornada) return;

        fetch(`/api/jornadas/${encodeURIComponent(selectedJornada)}`)
            .then(response => response.json())
            .then(data => {
                const partidos = extraerPartidosDeDetalle(data);
                if (!partidos[index]) return;
                partidos[index].comodin = isChecked;

                return fetch('/api/jornadas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: selectedJornada, partidos })
                });
            })
            .then(() => {
                updateJornadaPartidos();
                updateModificarJornadaPartidos();
            })
            .catch(err => console.error('Error actualizando comodín:', err));
    }

    addPartidoButton.addEventListener('click', async () => {
        const equipo1 = equipo1Input.value.trim();
        const equipo2 = equipo2Input.value.trim();
        const comodin = comodinCheckbox.checked;

        if (equipo1 && equipo2) {
            await agregarNuevoEquipo(equipo1);
            await agregarNuevoEquipo(equipo2);

            currentPartidos.push({ equipo1, equipo2, comodin });
            updatePartidosList();
            equipo1Input.value = '';
            equipo2Input.value = '';
            comodinCheckbox.checked = false;
        }
    });

    finalizarJornadaButton.addEventListener('click', () => {
        if (currentPartidos.length === 0) {
            alert('No hay partidos para agregar a la jornada.');
            return;
        }

        const nombreJornada = prompt('Ingrese el nombre de la jornada:');
        const fechaInput = document.getElementById('fechaCierreInput')?.value;
        const horaInput = document.getElementById('horaCierreInput')?.value;

        if (!nombreJornada) return alert('Debe ingresar un nombre de jornada');
        if (!fechaInput || !horaInput) return alert('Debe seleccionar fecha y hora de cierre');

        const fechaCierre = new Date(`${fechaInput}T${horaInput}:00`);
        if (fechaCierre <= new Date()) {
            return alert('La fecha de cierre debe ser futura');
        }

        if (!jornadas.has(nombreJornada)) {
            jornadas.set(nombreJornada, { partidos: [...currentPartidos], fechaCierre });

            fetch('/api/jornadas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreJornada, partidos: currentPartidos, fechaCierre })
            })
            .then(() => {
                currentPartidos = [];
                updatePartidosList();
                loadJornadas();
            })
            .catch(err => console.error('Error guardando jornada:', err));
        }
    });

    jornadaSelect.addEventListener('change', updateJornadaPartidos);

    modificarJornadaSelect.addEventListener('change', () => {
        jornadaActualParaModificar = modificarJornadaSelect.value;
        modificarJornadaControls.style.display = jornadaActualParaModificar ? 'block' : 'none';
        updateModificarJornadaPartidos();
    });

    agregarPartidoButton.addEventListener('click', () => {
        const equipo1 = modificarEquipo1Input.value.trim();
        const equipo2 = modificarEquipo2Input.value.trim();
        const comodin = modificarComodinCheckbox.checked;

        if (!(equipo1 && equipo2 && jornadaActualParaModificar)) return;

        fetch(`/api/jornadas/${encodeURIComponent(jornadaActualParaModificar)}`)
            .then(response => response.json())
            .then(data => {
                const partidos = extraerPartidosDeDetalle(data);
                partidos.push({ equipo1, equipo2, comodin });
                return fetch('/api/jornadas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: jornadaActualParaModificar, partidos })
                });
            })
            .then(() => {
                updateJornadaPartidos();
                updateModificarJornadaPartidos();
                modificarEquipo1Input.value = '';
                modificarEquipo2Input.value = '';
                modificarComodinCheckbox.checked = false;
            })
            .catch(err => console.error('Error agregando partido:', err));
    });

    eliminarPartidosButton.addEventListener('click', () => {
        const selectedIndices = Array.from(
            document.querySelectorAll('#partidosModificarList input[type="checkbox"]:checked')
        ).map(cb => cb.dataset.index);

        if (selectedIndices.length === 0 || !jornadaActualParaModificar) return;

        fetch(`/api/jornadas/${encodeURIComponent(jornadaActualParaModificar)}`)
            .then(response => response.json())
            .then(data => {
                const partidos = extraerPartidosDeDetalle(data);
                const updatedPartidos = partidos.filter((_, index) => !selectedIndices.includes(index.toString()));

                return fetch('/api/jornadas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: jornadaActualParaModificar, partidos: updatedPartidos })
                });
            })
            .then(() => {
                updateJornadaPartidos();
                updateModificarJornadaPartidos();
            })
            .catch(err => console.error('Error eliminando partidos:', err));
    });

    // Cargar equipos y jornadas al iniciar
    await cargarEquipos();
    loadJornadas();

    // Autocompletado (usa IDs "suggestions1" y "suggestions2")
    equipo1Input.addEventListener('input', () => autocompleteEquipo(equipo1Input, 'suggestions1'));
    equipo2Input.addEventListener('input', () => autocompleteEquipo(equipo2Input, 'suggestions2'));
});
