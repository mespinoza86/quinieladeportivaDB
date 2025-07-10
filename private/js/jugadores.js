document.addEventListener('DOMContentLoaded', () => {
    const jugadoresList = document.getElementById('jugadoresList');
    const nombreInput = document.getElementById('nombreInput');
    const addButton = document.getElementById('addJugadorButton');
    const deleteButton = document.getElementById('deleteJugadorButton'); // Añadir referencia al botón de eliminar jugador
    const eliminarJugadorSelect = document.getElementById('eliminarJugadorSelect');

    function loadJugadores() {
        fetch('/api/jugadores')
            .then(response => response.json())
            .then(jugadores => {
                jugadoresList.innerHTML = '';
                jugadores.forEach(jugador => {
                    const li = document.createElement('li');
                    li.textContent = jugador;
                    jugadoresList.appendChild(li);
                });
                updateComboBox(jugadores);
            });
    }

    function updateComboBox(jugadores) {
        eliminarJugadorSelect.innerHTML = '';
        jugadores.forEach(jugador => {
            const option = document.createElement('option');
            option.value = jugador;
            option.textContent = jugador;
            eliminarJugadorSelect.appendChild(option);
        });
    }

    addButton.addEventListener('click', () => {
        const nombre = nombreInput.value.trim();
        if (nombre) {
            fetch('/api/jugadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            })
            .then(response => response.json())
            .then(jugadores => {
                loadJugadores();
                nombreInput.value = '';
            });
        }
    });

    // Añadir el listener para eliminar un jugador
    deleteButton.addEventListener('click', () => {
        const jugadorAEliminar = eliminarJugadorSelect.value;
        if (jugadorAEliminar) {
            fetch(`/api/jugadores/${encodeURIComponent(jugadorAEliminar)}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(jugadores => {
                loadJugadores();
            });
        }
    });

    loadJugadores();
});
