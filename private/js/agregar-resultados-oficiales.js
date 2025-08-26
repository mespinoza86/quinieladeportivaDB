document.addEventListener('DOMContentLoaded', () => {
    const jornadaSelect = document.getElementById('jornadaSelect');
    const partidosContainer = document.getElementById('partidosContainer');
    const addResultadosOficialesButton = document.getElementById('addResultadosOficialesButton');
    const saveResultadosOficialesButton = document.getElementById('saveResultadosOficialesButton');

    // Cargar jornadas en el combo box
    fetch('/api/jornadas')
        .then(response => response.json())
        .then(jornadas => {            
            jornadaSelect.innerHTML = jornadas.map(jornada => `<option value="${jornada.nombre}">${jornada.nombre}</option>`).join('');
        });

    addResultadosOficialesButton.addEventListener('click', () => {
        const jornada = jornadaSelect.value;
        fetch(`/api/resultados-oficiales/${jornada}`)
            .then(response => response.json())
            .then(data => {
                const partidos = data.partidos;
                partidosContainer.innerHTML = partidos.map((partido, index) => `
                    <div class="partido" data-comodin="${partido.comodin}">
                        <span>${partido.equipo1} vs ${partido.equipo2}</span>
                            <input type="number" data-index="${index}" placeholder="Marcador ${partido.equipo1}" value="${partido.marcador1 ?? ''}" />
                            <input type="number" data-index="${index}" placeholder="Marcador ${partido.equipo2}" value="${partido.marcador2 ?? ''}" />
                        
                    </div>
                `).join('');
            });
    });

    saveResultadosOficialesButton.addEventListener('click', () => {
        const jornada = jornadaSelect.value;
        const resultados = Array.from(partidosContainer.querySelectorAll('.partido')).map(partido => {
        const inputs = partido.querySelectorAll('input');
        return {
            equipo1: inputs[0].placeholder.replace('Marcador ', ''),
            marcador1: inputs[0].value === '' ? null : Number(inputs[0].value),
            equipo2: inputs[1].placeholder.replace('Marcador ', ''),
            marcador2: inputs[1].value === '' ? null : Number(inputs[1].value),
            comodin: partido.dataset.comodin === 'true'
        };
    });

    fetch('/api/resultados-oficiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jornada, resultados })
    })
    .then(response => response.json())
    .then(data => {
        alert('Resultados oficiales guardados');
    });
});

    
});
