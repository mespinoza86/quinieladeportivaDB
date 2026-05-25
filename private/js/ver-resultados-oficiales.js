document.addEventListener('DOMContentLoaded', () => {
    const jornadaSelect = document.getElementById('jornadaSelect');
    const resultadosOficialesContainer = document.getElementById('resultadosOficialesContainer');
    const searchResultadosOficialesButton = document.getElementById('searchResultadosOficialesButton');

    function logoHTML(url, nombre) {
        if (!url) return '';
        return `<img src="${url}" class="team-logo" alt="${nombre || 'Equipo'}">`;
    }

    function marcador(valor) {
        return valor !== null && valor !== undefined && valor !== '' ? valor : '-';
    }

    fetch('/api/jornadas')
        .then(response => response.json())
        .then(jornadas => {
            jornadaSelect.innerHTML = jornadas
                .map(j => `<option value="${j.nombre}">${j.nombre}</option>`)
                .join('');
        });

    searchResultadosOficialesButton.addEventListener('click', () => {
        const jornada = jornadaSelect.value;

        fetch('/api/resultados-oficiales')
            .then(response => response.json())
            .then(resultadosOficiales => {
                const resultados = resultadosOficiales.find(r => r.nombre === jornada);

                if (resultados && resultados.partidos && resultados.partidos.length) {
                    resultadosOficialesContainer.innerHTML = resultados.partidos.map(partido => `
                        <div class="match-card resultado">
                            <div class="match-teams">
                                <div class="team-side">
                                    ${logoHTML(partido.logoEquipo1, partido.equipo1)}
                                    <strong>${partido.equipo1}</strong>
                                </div>

                                <span class="match-score">
                                    ${marcador(partido.marcador1)} - ${marcador(partido.marcador2)}
                                </span>

                                <div class="team-side">
                                    ${logoHTML(partido.logoEquipo2, partido.equipo2)}
                                    <strong>${partido.equipo2}</strong>
                                </div>
                            </div>

                            <div class="match-meta">
                                <span>${partido.comodin ? 'Comodín' : 'Normal'}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    resultadosOficialesContainer.innerHTML = '<p>No hay resultados oficiales para esta jornada.</p>';
                }
            });
    });
});