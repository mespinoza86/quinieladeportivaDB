document.addEventListener('DOMContentLoaded', () => {
    const jornadaSelect = document.getElementById('jornadaSelect');
    const resultadosOficialesContainer = document.getElementById('resultadosOficialesContainer');
    const searchResultadosOficialesButton = document.getElementById('searchResultadosOficialesButton');

    // Cargar jornadas en el combo box
    fetch('/api/jornadas')
        .then(response => response.json())
        .then(jornadas => {
            // Suponiendo que jornadas = [{ nombre: "Jornada 1" }, ...]
            jornadaSelect.innerHTML = jornadas.map(j => `<option value="${j.nombre}">${j.nombre}</option>`).join('');
        });

    searchResultadosOficialesButton.addEventListener('click', () => {
        const jornada = jornadaSelect.value;
        fetch(`/api/resultados-oficiales`)
            .then(response => response.json())
            .then(resultadosOficiales => {
                // Suponiendo que resultadosOficiales = [{ nombre: "Jornada 1", partidos: [...] }, ...]
                const resultados = resultadosOficiales.find(r => r.nombre === jornada);
                if (resultados && resultados.partidos) {
                    resultadosOficialesContainer.innerHTML = resultados.partidos.map(partido => `
                        <div class="resultado">
                            <span>${partido.equipo1} ${partido.marcador1} - ${partido.equipo2} ${partido.marcador2}</span>
                        </div>
                    `).join('');
                } else {
                    resultadosOficialesContainer.innerHTML = '<p>No hay resultados oficiales para esta jornada.</p>';
                }
            });
    });
});
