  const { jsPDF } = window.jspdf;

  const jornadaSelect = document.getElementById('jornadaSelect');
  const generarPdfBtn = document.getElementById('generarPdfBtn');

  function limpiarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[^\w\s]/gi, '')        // quita símbolos raros
      .replace(/\s+/g, ' ')            // elimina espacios múltiples
      .trim();
  }

async function cargarJornadas() {
  const res = await fetch('/api/jornadas');
  const jornadas = await res.json();
  jornadaSelect.innerHTML = '';
  jornadas.forEach(j => {
    // Suponiendo que j = { nombre: "Jornada 1" }
    const jornadaNombre = j.nombre; 
    const opt = document.createElement('option');
    opt.value = jornadaNombre;
    opt.textContent = jornadaNombre;
    jornadaSelect.appendChild(opt);
  });
}

  async function cargarJugadores() {
    const res = await fetch('/api/jugadores');
    return await res.json();
  }

  async function cargarResultados() {
    const res = await fetch('/api/resultados');
    return await res.json();
  }

  async function cargarResultadosOficiales() {
    const res = await fetch('/api/resultados-oficiales');
    return await res.json();
  }

  // Función para determinar resultado (ganó, perdió, empató)
  function determinarResultado(marcador1, marcador2) {
    if (marcador1 > marcador2) return 'gano';
    if (marcador1 < marcador2) return 'perdio';
    return 'empato';
  }

  // Lógica EXACTA para calcular puntos, como en tu endpoint
  function calcularPuntosPronosticados(pronosticado, oficial) {
    if (
      !pronosticado || !oficial ||
      pronosticado.marcador1 === "" || pronosticado.marcador2 === "" ||
      oficial.marcador1 === "" || oficial.marcador2 === "" ||
      pronosticado.marcador1 == null || pronosticado.marcador2 == null ||
      oficial.marcador1 == null || oficial.marcador2 == null
    ) return 0;

    const marcador1Oficial = parseInt(oficial.marcador1);
    const marcador2Oficial = parseInt(oficial.marcador2);
    const marcador1Pronostico = parseInt(pronosticado.marcador1);
    const marcador2Pronostico = parseInt(pronosticado.marcador2);
    const comodin = oficial.comodin || false;

    const resultadoOficialEquipo1 = determinarResultado(marcador1Oficial, marcador2Oficial);
    const resultadoPronosticoEquipo1 = determinarResultado(marcador1Pronostico, marcador2Pronostico);

    let puntosJornada = 0;

    if (resultadoOficialEquipo1 === resultadoPronosticoEquipo1 &&
        marcador1Pronostico !== "" && marcador2Pronostico !== "" &&
        marcador1Pronostico !== null && marcador2Pronostico !== null) {
      if (marcador1Oficial !== "" && marcador2Oficial !== "" &&
          marcador1Oficial !== null && marcador2Oficial !== null &&
          comodin === false) {
        puntosJornada += 3; // 3 puntos por acertar resultado (ganó, empató, perdió)
      }
    }

    if (resultadoOficialEquipo1 === resultadoPronosticoEquipo1 &&
        marcador1Pronostico !== "" && marcador2Pronostico !== "" &&
        marcador1Pronostico !== null && marcador2Pronostico !== null) {
      if (marcador1Oficial !== "" && marcador2Oficial !== "" &&
          marcador1Oficial !== null && marcador2Oficial !== null &&
          comodin === true) {
        puntosJornada += 4; // 4 puntos por acertar resultado en comodín
      }
    }

    if (marcador1Oficial === marcador1Pronostico &&
        marcador2Oficial === marcador2Pronostico &&
        marcador1Pronostico !== "" && marcador2Pronostico !== "" &&
        marcador1Pronostico !== null && marcador2Pronostico !== null) {
      if (marcador1Oficial !== "" && marcador2Oficial !== "" &&
          marcador1Oficial !== null && marcador2Oficial !== null &&
          comodin === false) {
        puntosJornada += 2; // 2 puntos por acertar marcador exacto
      }
    }

    if (marcador1Oficial === marcador1Pronostico &&
        marcador2Oficial === marcador2Pronostico &&
        marcador1Pronostico !== "" && marcador2Pronostico !== "" &&
        marcador1Pronostico !== null && marcador2Pronostico !== null) {
      if (marcador1Oficial !== "" && marcador2Oficial !== "" &&
          marcador1Oficial !== null && marcador2Oficial !== null &&
          comodin === true) {
        puntosJornada += 3; // 3 puntos por acertar marcador exacto en comodín
      }
    }

    return puntosJornada;
  }

  function buscarPartidoPorEquipos(partidos, equipo1, equipo2) {
    return partidos.find(p =>
      (p.equipo1 === equipo1 && p.equipo2 === equipo2) ||
      (p.equipo1 === equipo2 && p.equipo2 === equipo1)
    );
  }

  generarPdfBtn.onclick = async () => {
    const jornadaSeleccionada = jornadaSelect.value;
    if (!jornadaSeleccionada) {
      alert('Selecciona una jornada primero');
      return;
    }

    const jugadores = await cargarJugadores();
    const resultados = await cargarResultados();
    const resultadosOficiales = await cargarResultadosOficiales();

    const jornadaOficial = resultadosOficiales.find(j => j.nombre === jornadaSeleccionada);

    if (!jornadaOficial) {
      alert('No se encontraron resultados oficiales para la jornada');
      return;
    }

    const partidosOficial = jornadaOficial ? jornadaOficial.partidos : null;

    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.text(`Resultados y Pronosticos - ${limpiarTexto(jornadaSeleccionada)}`, 10, 10);

    let y = 20;

    doc.setFontSize(14);
    doc.text('Marcador Oficial:', 10, y);
    y += 8;

    partidosOficial.forEach(p => {
      const texto = `${limpiarTexto(p.equipo1)} ${p.marcador1} - ${p.marcador2} ${limpiarTexto(p.equipo2)}`;
      doc.text(texto, 10, y);
      y += 6;
    });

    y += 10;

    for (const jugador of jugadores) {
      // Nombre jugador en negrita y tamaño 14
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text(`Jugador: ${limpiarTexto(jugador)}`, 10, y);
      y += 4;

      // Línea horizontal debajo del nombre
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 8;

      const clave = `${jugador}_${jornadaSeleccionada}`;
      const resultadoJugador = resultados.find(r => r[0] === clave);
      if (!resultadoJugador) {
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text('No hay pronosticos para esta jornada.', 10, y);
        y += 10;
        continue;
      }

      const partidosPronosticados = resultadoJugador[1];
      let puntosTotales = 0;

      // Encabezados columnas en normal
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text('Partido', 10, y);
      doc.text('Pronostico', 90, y);
      doc.text('Oficial', 125, y);
      doc.text('Pts', 170, y);
      y += 4;

      // Línea horizontal después encabezado
      doc.setLineWidth(0.3);
      doc.line(10, y, 200, y);
      y += 6;

      partidosPronosticados.forEach((pron, index) => {
        const partidoOficial = buscarPartidoPorEquipos(partidosOficial, pron.equipo1, pron.equipo2);
        const puntos = partidoOficial ? calcularPuntosPronosticados(pron, partidoOficial) : 0;
        puntosTotales += puntos;

        const partidoStr = `${limpiarTexto(pron.equipo1)} vs ${limpiarTexto(pron.equipo2)}`;
        const pronosticoStr = `${pron.marcador1} - ${pron.marcador2}`;
        const oficialStr = partidoOficial
          ? `${partidoOficial.marcador1} - ${partidoOficial.marcador2}`
          : 'N/A';

        doc.setFont("times", "normal");
        doc.text(partidoStr, 10, y);
        doc.text(pronosticoStr, 90, y);
        doc.text(oficialStr, 125, y);
        doc.text(String(puntos), 170, y);
        y += 6;

        if (index === partidosPronosticados.length - 1) {
          // Línea horizontal después del último partido
          doc.setLineWidth(0.3);
          doc.line(10, y, 200, y);
          y += 8;
        }

        if (y > 280) {
          doc.addPage();
          doc.setFont("times", "normal");
          y = 10;
        }
      });

      // Línea arriba de puntos totales
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 6;

      // Puntos totales en negrita y tamaño 13
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text(`Puntos totales: ${puntosTotales}`, 10, y);
      y += 8;

      // Línea abajo de puntos totales
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;

      if (y > 280) {
        doc.addPage();
        doc.setFont("times", "normal");
        y = 10;
      }
    }

    doc.save(`Resultados_${limpiarTexto(jornadaSeleccionada)}.pdf`);
  };

  cargarJornadas();