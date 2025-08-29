document.addEventListener('DOMContentLoaded', () => { 
    // Cargar las jornadas cuando la página se carga
    loadJornadas();

    // Botón de llenar jornada
    const llenarJornadaButton = document.getElementById('llenarJornadaButton');
    llenarJornadaButton.addEventListener('click', () => {
        const jornadaSelect = document.getElementById('jornadaSelect');
        const selectedIndex = jornadaSelect.selectedIndex;
        if (selectedIndex >= 0) {
            // Guardamos el nombre de la jornada
            const jornadaSeleccionada = jornadaSelect.options[selectedIndex].textContent;
            localStorage.setItem('jornadaSeleccionada', jornadaSeleccionada);
            window.location.href = 'llenar_jornada_user.html';
        }
    });
});

function loadJornadas() {
    fetch('/api/jornadas')
        .then(response => response.json())
        .then(data => {
            const jornadaSelect = document.getElementById('jornadaSelect');
            const partidosJornadaList = document.getElementById('partidosJornadaList');

            // Limpiar select y lista de partidos
            jornadaSelect.innerHTML = '';
            partidosJornadaList.innerHTML = '';

            data.forEach((jornada, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = jornada.nombre; // ahora es un objeto
                jornadaSelect.appendChild(option);
            });

            // Mostrar partidos de la primera jornada por defecto
            if (data.length > 0) {
                mostrarPartidosDeJornada(data[0].partidos, data[0].fechaCierre);
            }

            jornadaSelect.addEventListener('change', () => {
                const selectedIndex = jornadaSelect.selectedIndex;
                if (selectedIndex >= 0) {
                    mostrarPartidosDeJornada(data[selectedIndex].partidos, data[selectedIndex].fechaCierre);
                }
            });
        })
        .catch(error => console.error('Error al cargar las jornadas:', error));
}

function mostrarPartidosDeJornada(partidos, fechaCierre) {
    const partidosJornadaList = document.getElementById('partidosJornadaList');
    partidosJornadaList.innerHTML = ''; 

    // Mostrar fecha de cierre si existe
    if (fechaCierre) {
        const fecha = new Date(fechaCierre);
        const liFecha = document.createElement('li');
        liFecha.textContent = `Fecha de cierre: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        partidosJornadaList.appendChild(liFecha);
    }

    // Mostrar partidos
    partidos.forEach(partido => {
        const li = document.createElement('li');
        li.textContent = `${partido.equipo1} vs ${partido.equipo2}` + (partido.comodin ? ' (Comodín)' : '');
        partidosJornadaList.appendChild(li);
    });
}

