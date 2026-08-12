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

## 2026-08-11 — Revisión de continuidad del proyecto

### Objetivo

Revisar el historial del proyecto, confirmar el punto exacto en que quedó el desarrollo y definir las siguientes prioridades antes de realizar nuevos cambios.

### Estado confirmado

- El último trabajo terminado fue la eliminación del módulo de campeón mundial y la creación de la tabla de posiciones independiente por jornada.
- La rama `main` está sincronizada con `origin/main` en el commit `33669ae` (`fixing issues and tabla por jornada`).
- Antes de actualizar esta bitácora, el árbol de trabajo no tenía cambios pendientes.
- El proyecto no cuenta actualmente con una suite de pruebas automatizadas; `package.json` sólo incluye el comando de inicio del servidor.
- El archivo `README.md` contiene únicamente el nombre del proyecto y todavía no documenta instalación, configuración, operación ni despliegue.
- Se confirmó que `.env` está versionado en Git. No se copiaron ni expusieron sus valores en esta bitácora.
- Se detectaron rutas que modifican información sin exigir sesión administrativa, entre ellas la sincronización de resultados, el guardado general de pronósticos y la actualización de equipos. Esto requiere una revisión de permisos antes de considerarlo listo para producción.
- La sesión administrativa utiliza un secreto predeterminado si falta `SESSION_SECRET`; conviene impedir el arranque en producción cuando los secretos obligatorios no estén configurados.
- En esta revisión no se modificó código funcional ni información de MongoDB.

### Recomendaciones para continuar

1. Proteger secretos: retirar `.env` del control de versiones, agregar un `.env.example` sin credenciales y rotar cualquier secreto que haya quedado en el historial remoto.
2. Auditar y proteger todas las rutas de escritura, separando claramente las acciones del administrador de las acciones permitidas a cada jugador.
3. Crear pruebas automáticas para el cálculo de puntos, comodines, empates, cierre de jornadas y permisos de acceso.
4. Probar de extremo a extremo la tabla por jornada con una jornada completa, incluyendo empate en primer lugar y resultados oficiales corregidos.
5. Completar el `README.md` con requisitos, variables de entorno, instalación, ejecución, despliegue y respaldo/restauración.

## 2026-08-11 — Mejora de contraste del ganador por jornada

### Cambio realizado

- Se cambió a café oscuro (`#422006`) el color del texto de la fila ganadora en la tabla por jornada.
- El fondo amarillo de la fila se conservó y ahora tiene suficiente contraste para que el nombre, la posición y los puntos sean legibles.
- La regla se aplicó también directamente a las celdas para evitar que estilos generales de la tabla mantengan el texto blanco.

### Archivos modificados

- `private/css/styles.css`
- `CAMBIOS_PROYECTO.md`
