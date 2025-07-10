document.addEventListener('DOMContentLoaded', () => {
    
    const jornadaSeleccionada = 6;
    //const jornadaSeleccionada = localStorage.getItem('jornadaSeleccionada');
    
    if (jornadaSeleccionada !== null) {
        loadPartidos(jornadaSeleccionada);
    }

    const copiarTextoButton = document.getElementById('copiarTextoButton');
    copiarTextoButton.addEventListener('click', copiarResultados);
  
   const enviarWhatsappButton = document.getElementById('enviarWhatsappButton');
    enviarWhatsappButton.addEventListener('click', enviarPorWhatsapp);
  
});

function loadPartidos(index) {
    fetch('/get-jornadas')
        .then(response => response.json())
        .then(data => {
            const jornada = data[index];
            const partidos = jornada[1]; // Partidos de la jornada seleccionada
            mostrarPartidos(partidos);
        })
        .catch(error => console.error('Error al cargar los partidos:', error));
}

function mostrarPartidos(partidos) {
    const partidosContainer = document.getElementById('partidosContainer');
    partidosContainer.innerHTML = ''; 

    partidos.forEach((partido, i) => {
        const partidoDiv = document.createElement('div');
        partidoDiv.classList.add('partido-container');
        
        // Verificar si el partido es comodín y aplicar negrita
        const estiloNegrita = partido.comodin ? 'font-weight: bold;' : '';
        
        partidoDiv.innerHTML = `
            <label style="${estiloNegrita}">${partido.equipo1}</label>
            <input type="text" id="resultadoEquipo1_${i}">
            <label style="${estiloNegrita}">vs</label>
            <input type="text" id="resultadoEquipo2_${i}">
            <label style="${estiloNegrita}">${partido.equipo2}</label>
            <label style="display: none;">Comodín: ${partido.comodin ? 'Sí' : 'No'}</label>
        `;
        partidosContainer.appendChild(partidoDiv);
    });
}

function copiarResultados() {
    const nombreJugador = document.getElementById('nombreJugador').value.trim();
    const partidosContainer = document.getElementById('partidosContainer');
    let textoResultado = '';
    let contador = 1;

    textoResultado += `-------------------------------\n`;
    textoResultado += `Nombre: ${nombreJugador || '[Sin nombre]'}\n`;
    textoResultado += `-------------------------------\n`;

    Array.from(partidosContainer.children).forEach((partidoDiv, index) => {
        const equipo1 = partidoDiv.children[0].textContent;
        const resultado1 = document.getElementById(`resultadoEquipo1_${index}`).value || '0';
        const equipo2 = partidoDiv.children[4].textContent;
        const resultado2 = document.getElementById(`resultadoEquipo2_${index}`).value || '0';

        // Verificar si el partido es comodín
        const comodin = partidoDiv.querySelector('label:last-child').textContent.includes('Sí');

        // Aplicar negrita si es comodín
        if(comodin){
            textoResultado += "\n*(Comodin)*";  
        }
      
        const formato = comodin ? '*' : '';
        textoResultado += `\n${contador}. ${formato}${equipo1} ${resultado1}${formato}\n  ${formato}${equipo2} ${resultado2}${formato}\n`;
         
      
        contador++;
    });
    
    navigator.clipboard.writeText(textoResultado).then(() => {
        alert('Texto copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar el texto:', err);
    });
}

function enviarPorWhatsapp() {
    const nombreJugador = document.getElementById('nombreJugador').value.trim();
    const partidosContainer = document.getElementById('partidosContainer');
    let textoResultado = '';
    let contador = 1;

    textoResultado += `-------------------------------\n`;
    textoResultado += `Nombre: ${nombreJugador || '[Sin nombre]'}\n`;
    textoResultado += `-------------------------------\n`;

    Array.from(partidosContainer.children).forEach((partidoDiv, index) => {
        const equipo1 = partidoDiv.children[0].textContent;
        const resultado1 = document.getElementById(`resultadoEquipo1_${index}`).value || '0';
        const equipo2 = partidoDiv.children[4].textContent;
        const resultado2 = document.getElementById(`resultadoEquipo2_${index}`).value || '0';
      //const esComodin = partidoDiv[index].comodin;
        const comodin = partidoDiv.querySelector('label:last-child').textContent.includes('Sí');
        // Aplicar negrita si es comodín
        /*if(comodin){
            textoResultado += "\n*(Comodin)*";  
        } */     
        const formato = comodin ? '*' : '';
        textoResultado += `\n${contador}. ${formato}${equipo1} ${resultado1}${formato}\n  ${formato}${equipo2} ${resultado2}${formato}\n`;
               
        contador++;
    });
    
    const mensajeWhatsapp = encodeURIComponent(textoResultado);
    const whatsappURL = `https://wa.me/?text=${mensajeWhatsapp}`;
    window.open(whatsappURL, '_blank');
}


/*
function mostrarPartidos(partidos) {
    const partidosContainer = document.getElementById('partidosContainer');
    partidosContainer.innerHTML = ''; 

    partidos.forEach((partido, i) => {
        const partidoDiv = document.createElement('div');
        partidoDiv.classList.add('partido-container');

        partidoDiv.innerHTML = `
            <label>${partido.equipo1}</label>
            <input type="text" id="resultadoEquipo1_${i}">
            <label>vs</label>
            <input type="text" id="resultadoEquipo2_${i}">
            <label>${partido.equipo2}</label>
        `;
        partidosContainer.appendChild(partidoDiv);
    });
}
*/

/*
function copiarResultados() {
    const nombreJugador = document.getElementById('nombreJugador').value.trim();
    const partidosContainer = document.getElementById('partidosContainer');
    let textoResultado = '';
    let contador = 1;
    

    // Agregar el nombre del jugador al principio del texto
    textoResultado += `-------------------------------\n`;
    if (nombreJugador) {
        textoResultado += `Nombre: ${nombreJugador}\n`;
    } else {
        textoResultado += `Nombre: [Sin nombre]\n\n`; // En caso de que no se ingrese nombre
    }
    textoResultado += `-------------------------------\n`;

    // Recorrer los partidos y agregar el formato correspondiente
    Array.from(partidosContainer.children).forEach((partidoDiv, index) => {
        const equipo1 = partidoDiv.children[0].textContent;
        const resultado1 = document.getElementById(`resultadoEquipo1_${index}`).value || '0';
        const equipo2 = partidoDiv.children[4].textContent;
        const resultado2 = document.getElementById(`resultadoEquipo2_${index}`).value || '0';

        textoResultado += `\n${contador}. ${equipo1} ${resultado1} \n  ${equipo2} ${resultado2}\n`;
        contador++;
    });
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(textoResultado).then(() => {
        alert('Texto copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar el texto:', err);
    });
}
*/


/*

// Nueva función: Enviar el resultado por WhatsApp
function enviarPorWhatsapp() {
    const nombreJugador = document.getElementById('nombreJugador').value.trim();
    const partidosContainer = document.getElementById('partidosContainer');
    let textoResultado = '';
    let contador = 1;

    // Construir el mensaje como en copiarResultados
    textoResultado += `-------------------------------\n`;
    if (nombreJugador) {
        textoResultado += `Nombre: ${nombreJugador}\n`;
    } else {
        textoResultado += `Nombre: [Sin nombre]\n\n`;
    }
    textoResultado += `-------------------------------\n`;

    Array.from(partidosContainer.children).forEach((partidoDiv, index) => {
        const equipo1 = partidoDiv.children[0].textContent;
        const resultado1 = document.getElementById(`resultadoEquipo1_${index}`).value || '0';
        const equipo2 = partidoDiv.children[4].textContent;
        const resultado2 = document.getElementById(`resultadoEquipo2_${index}`).value || '0';

        textoResultado += `\n${contador}. ${equipo1} ${resultado1} \n  ${equipo2} ${resultado2}\n`;
        contador++;
    });

   // Formatear el mensaje para WhatsApp y redirigir
    const mensajeWhatsapp = encodeURIComponent(textoResultado);
    const whatsappURL = `https://wa.me/?text=${mensajeWhatsapp}`;
    window.open(whatsappURL, '_blank');
}

*/