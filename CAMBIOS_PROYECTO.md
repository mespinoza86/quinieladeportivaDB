# Registro de cambios de la Quiniela Deportiva

Este archivo documenta los cambios realizados al proyecto a partir del 6 de agosto de 2026. Debe actualizarse con cada nueva intervención.

## 2026-08-06 — Diagnóstico de conexión a MongoDB Atlas

- Se identificó que `mongodb+srv` fallaba al consultar el registro DNS SRV desde Node.
- Se comprobó que el clúster de Atlas y el puerto 27017 sí eran accesibles.
- Se comprobó exitosamente una conexión usando los hosts del clúster de forma directa.
- El archivo `.env` contiene la configuración privada y no se documentan aquí credenciales ni secretos.

## 2026-08-06 — Eliminación del campeón mundial

### Objetivo

Dejar la quiniela enfocada exclusivamente en pronósticos y puntuaciones por jornada.

### Cambios realizados

- Se eliminaron los modelos `PronosticoCampeon` y `CampeonOficial` del backend.
- Se eliminaron las API para equipos mundialistas, pronósticos de campeón y campeón oficial.
- Se retiró la puntuación adicional de 20 puntos por acertar el campeón mundial.
- La API de resultados totales ahora calcula únicamente los puntos obtenidos por jornada.
- Se eliminaron las rutas y pantallas públicas para seleccionar y consultar campeones.
- Se eliminó la pantalla administrativa para definir el campeón oficial.
- Se retiraron los accesos de campeón mundial de los menús principal y administrativo.
- Se eliminaron los scripts y estilos utilizados exclusivamente por esas pantallas.
- Se simplificó la tabla general para mostrar solamente jornadas y total.

### Archivos eliminados

- `public/campeon-oficial.html`
- `public/pronostico-campeon.html`
- `public/ver-pronosticos-campeon.html`
- `private/js/campeon-oficial.js`
- `private/js/pronostico-campeon.js`
- `private/js/ver-pronosticos-campeon.js`

### Consideraciones

- No se eliminaron colecciones ni documentos existentes en MongoDB. El sistema simplemente dejó de consultarlos y modificarlos, evitando una eliminación irreversible de datos.
- Las opciones “Mundial FIFA” y “Eliminatorias Mundialistas” del importador de partidos se conservaron porque representan filtros para importar partidos a una jornada, no pronósticos de campeón.
- El cambio previo existente en `.env` se conservó sin modificaciones.

### Verificación

- Los 23 archivos JavaScript activos pasaron la validación de sintaxis de Node.
- No quedaron referencias al módulo de campeón mundial fuera de este registro.
- El servidor modificado inició correctamente en el puerto temporal 3001.
- La aplicación confirmó una conexión exitosa con MongoDB Atlas.
- El puerto 3000 ya estaba ocupado por una instancia anterior del servidor; esa instancia debe reiniciarse para cargar estos cambios.

## 2026-08-06 — Tabla de posiciones por jornada

### Objetivo

Mostrar la clasificación independiente de cada jornada para identificar a la persona ganadora del premio semanal, sin reemplazar la tabla general acumulada.

### Cambios realizados

- Se creó la pantalla “Tabla por Jornada” con acceso desde los menús principal y administrativo.
- Se agregó un selector para consultar cualquier jornada disponible.
- La clasificación muestra posición, jugador, puntos, marcadores exactos y aciertos de resultado.
- Se reutilizó la puntuación existente: 5 puntos por marcador exacto y 3 por resultado acertado; los partidos comodín otorgan 7 y 4 puntos respectivamente.
- La tabla incluye únicamente jugadores que hayan entregado pronósticos para la jornada seleccionada.
- El ganador se declara solamente cuando todos los partidos tienen un resultado oficial válido.
- Si dos o más participantes terminan con el mismo puntaje máximo, todos ocupan el primer lugar y comparten el premio.
- Los marcadores exactos y aciertos se muestran como información, pero no se usan para desempatar.
- La tabla general se mantiene como acumulado independiente de todas las jornadas.

### Verificación

- Los 24 archivos JavaScript pasaron la validación de sintaxis de Node.
- La API se probó con datos reales de `Jornada1`.
- Con 0 de 10 resultados oficiales, la jornada se identificó como pendiente y no declaró ganadores.
