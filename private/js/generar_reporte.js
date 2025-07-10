const { jsPDF } = window.jspdf;

async function cargarJornadas() {
  try {
    const res = await fetch('/api/jornadas');
    const data = await res.json();

    const select = document.getElementById('jornadaSelect');
    data.forEach(entry => {
      const nombre = entry[0];
      const option = document.createElement('option');
      option.value = nombre;
      option.textContent = nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar jornadas:', error);
    alert('No se pudieron cargar las jornadas');
  }
}

async function cargarJugadores() {
  const res = await fetch('/api/jugadores');
  return await res.json();
}

async function cargarResultados() {
  const res = await fetch('/api/resultados');
  return await res.json();
}

async function cargarResultadosOficiales(jornada) {
  const res = await fetch(`/api/resultados-oficiales/${encodeURIComponent(jornada)}`);
  if (!res.ok) {
    throw new Error('No se pudieron cargar los resultados oficiales');
  }
  const data = await res.json();
  return data.partidos;
}

function calcularPuntosPronosticados(pronostico, oficial, esComodin) {
  let puntos = 0;

  const p1 = pronostico.marcador1;
  const p2 = pronostico.marcador2;
  const o1 = oficial.marcador1;
  const o2 = oficial.marcador2;

  const resultadoPronostico = p1 === p2 ? 'E' : p1 > p2 ? 'L' : 'V';
  const resultadoOficial = o1 === o2 ? 'E' : o1 > o2 ? 'L' : 'V';

  if (resultadoPronostico === resultadoOficial) {
    puntos += esComodin ? 4 : 3;
  }

  if (p1 === o1 && p2 === o2) {
    puntos += esComodin ? 3 : 2;
  }

  return puntos;
}

document.getElementById('generarPdfBtn').onclick = async () => {
  const jornadaSeleccionada = document.getElementById('jornadaSelect').value;
  if (!jornadaSeleccionada) return alert('Selecciona una jornada');

  const jugadores = await cargarJugadores();
  const resultados = await cargarResultados();
  const oficiales = await cargarResultadosOficiales(jornadaSeleccionada);

  if (!oficiales || oficiales.length === 0) {
    return alert('No hay resultados oficiales para esta jornada');
  }

  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text(`Resultados de la jornada: ${jornadaSeleccionada}`, 10, y);
  y += 15;

  const marginLeft = 10;
  const colWidths = [70, 35, 45, 25];
  const colPositions = [
    marginLeft,
    marginLeft + colWidths[0],
    marginLeft + colWidths[0] + colWidths[1],
    marginLeft + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  let mostrarNotaComodin = false;

  for (const jugador of jugadores) {
    const clave = `${jugador}_${jornadaSeleccionada}`;
    const pronosticos = resultados.find(r => r[0] === clave)?.[1];
    if (!pronosticos) continue;

    let totalPuntos = 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Jugador: ${jugador}`, marginLeft, y);
    y += 6;

    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, marginLeft + colWidths.reduce((a, b) => a + b, 0) + 20, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Partido', colPositions[0], y);
    doc.text('Pronóstico', colPositions[1], y);
    doc.text('Resultado Oficial', colPositions[2], y);
    doc.text('Puntos', colPositions[3], y);
    y += 6;

    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginLeft + colWidths.reduce((a, b) => a + b, 0) + 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');

    for (let i = 0; i < oficiales.length; i++) {
      const oficial = oficiales[i];
      const pronostico = pronosticos[i];
      if (!oficial || !pronostico) continue;
      const esComodin = oficial.comodin === true;
      const puntos = calcularPuntosPronosticados(pronostico, oficial, esComodin);
      totalPuntos += puntos;

      const partido = `${oficial.equipo1} vs ${oficial.equipo2}`;
      const pron = `${pronostico.marcador1}-${pronostico.marcador2}`;
      const resOficial = `${oficial.marcador1}-${oficial.marcador2}`;
      const puntosStr = puntos.toString();

      if (oficial.comodin) {
        doc.setFont('helvetica', 'bold');
        doc.text(partido, colPositions[0], y);
        doc.setFont('helvetica', 'normal');
        mostrarNotaComodin = true;
      } else {
        doc.text(partido, colPositions[0], y);
      }

      doc.text(pron, colPositions[1], y);
      doc.text(resOficial, colPositions[2], y);
      doc.text(puntosStr, colPositions[3], y);

      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    }

    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginLeft + colWidths.reduce((a, b) => a + b, 0) + 20, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Total', colPositions[0], y);
    doc.text(totalPuntos.toString(), colPositions[3], y);
    y += 12;

    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, marginLeft + colWidths.reduce((a, b) => a + b, 0) + 20, y);
    y += 10;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  }

  if (mostrarNotaComodin) {
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('* Los partidos en negrita son los comodines.', marginLeft, y);
  }

  doc.save(`Resultados_${jornadaSeleccionada}.pdf`);
};

window.onload = cargarJornadas;
