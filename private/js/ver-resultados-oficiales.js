document.addEventListener('DOMContentLoaded', () => {
    const jornadaSelect = document.getElementById('jornadaSelect');
    const resultadosOficialesContainer = document.getElementById('resultadosOficialesContainer');
    const searchResultadosOficialesButton = document.getElementById('searchResultadosOficialesButton');

    // Cargar jornadas en el combo box
    fetch('/api/jornadas')
        .then(response => response.json())
        .then(jornadas => {
            jornadaSelect.innerHTML = jornadas.map(([nombre]) => `<option value="${nombre}">${nombre}</option>`).join('');
        });

    searchResultadosOficialesButton.addEventListener('click', () => {
        const jornada = jornadaSelect.value;
        fetch(`/api/resultados-oficiales`)
            .then(response => response.json())
            .then(resultadosOficiales => {
                const resultados = resultadosOficiales.find(([nombre]) => nombre === jornada);
                if (resultados) {
                    resultadosOficialesContainer.innerHTML = resultados[1].map(partido => `
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