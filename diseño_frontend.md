# Guía de Frontend y Diseño de Interfaz

## Objetivo

La aplicación debe sentirse como un producto web moderno y cuidado, no como un panel de administración tradicional.

El usuario principal es un jugador de una liga de Age of Sigmar: Spearhead que entra en la web para consultar rápidamente su situación, conocer su siguiente rival, registrar partidas y actualizar su disponibilidad.

La prioridad es la claridad y la rapidez de uso.

---

# Stack tecnológico recomendado

## Framework

- Next.js (React)

## Estilos

- Tailwind CSS

## Componentes

- shadcn/ui

## Iconografía

- Lucide Icons

## Tablas

- TanStack Table

Este ecosistema proporciona una base moderna, accesible y fácilmente mantenible.

---

# Referencias visuales

El diseño debe inspirarse en aplicaciones como:

- GitHub
- Linear
- Vercel
- Chess.com (únicamente en la organización de información, no en su estética)

No debe parecer un ERP, CRM o panel administrativo corporativo.

---

# Filosofía visual

La interfaz debe transmitir sencillez.

Debe existir una jerarquía visual muy clara donde el usuario identifique inmediatamente la información importante.

Se debe priorizar:

- Mucho espacio en blanco.
- Tipografía legible.
- Componentes sencillos.
- Muy pocos colores.
- Información agrupada mediante tarjetas.

No deben utilizarse degradados llamativos, fondos recargados, efectos glassmorphism ni animaciones excesivas.

---

# Paleta de color

La interfaz debe utilizar principalmente colores neutros.

Los colores deben reservarse únicamente para comunicar estados.

Ejemplo:

- Victoria → Verde
- Empate → Amarillo
- Derrota → Rojo
- Bonus de PV → Azul

El resto de la interfaz debe mantenerse en tonos neutros.

---

# Navegación

La aplicación tendrá una barra superior fija con las secciones principales.

Ejemplo:

- Inicio
- Clasificación
- Partidas
- Disponibilidad
- Perfil

En dispositivos móviles esta navegación deberá transformarse en un menú desplegable.

No utilizar un menú lateral permanente.

---

# Página de inicio

La pantalla principal debe responder inmediatamente a la pregunta:

> ¿Qué necesito hacer ahora?

Debe mostrar como mínimo:

- Próximo rival recomendado.
- Bonus de PV para ese enfrentamiento.
- Disponibilidad coincidente.
- Posición en la clasificación.
- Resumen de los últimos resultados.

No debe convertirse en un dashboard lleno de estadísticas.

---

# Clasificación

La clasificación será una tabla sencilla.

Columnas mínimas:

- Posición
- Jugador
- Puntos
- Victorias
- Empates
- Derrotas
- Partidas jugadas

Cada jugador podrá pulsarse para acceder a su perfil.

---

# Perfil del jugador

El perfil mostrará:

- Avatar.
- Nombre.
- Facción principal (opcional).
- Estadísticas.
- Historial de partidas.
- Disponibilidad semanal.

La información debe organizarse mediante tarjetas independientes.

---

# Disponibilidad

La disponibilidad debe editarse mediante una cuadrícula interactiva.

Filas:

- Mañana
- Tarde
- Noche

Columnas:

- Lunes
- Martes
- Miércoles
- Jueves
- Viernes
- Sábado
- Domingo

Cada celda puede activarse o desactivarse con un clic.

Este sistema debe ser la forma principal de indicar disponibilidad.

No utilizar formularios tradicionales.

---

# Registro de partidas

El registro debe requerir el mínimo número de acciones posible.

Campos:

- Jugador A
- Jugador B
- Resultado
- Fecha

El flujo debe completarse en pocos segundos.

---

# Componentes

La interfaz debe construirse principalmente mediante:

- Tarjetas (Cards)
- Tablas
- Botones
- Badges
- Dialogs
- Popovers
- Tooltips
- Toasts

Debe evitarse el abuso de modales y ventanas emergentes.

---

# Responsive

La aplicación debe ser completamente funcional desde móvil.

Las tablas podrán adaptarse mediante scroll horizontal o tarjetas compactas.

Las acciones principales deben permanecer accesibles sin necesidad de hacer zoom.

---

# Accesibilidad

Debe mantenerse un buen contraste entre texto y fondo.

Los componentes interactivos deben tener estados claros de:

- Hover
- Focus
- Active
- Disabled

Toda la interfaz debe ser navegable mediante teclado.

---

# Animaciones

Las animaciones deben ser discretas.

Únicamente para:

- Apertura de menús.
- Aparición de diálogos.
- Confirmaciones.
- Cambios de estado.

Nunca deben ralentizar la navegación.

---

# Principios de UX

Toda decisión de diseño debe respetar estos principios:

- Reducir el número de clics necesarios para realizar las acciones habituales.
- Mostrar únicamente la información relevante para la pantalla actual.
- Mantener una jerarquía visual clara.
- Evitar sobrecargar la interfaz con estadísticas o elementos decorativos.
- Mantener consistencia entre todas las pantallas.
- Favorecer la lectura rápida mediante tarjetas, separación visual y tipografía adecuada.

---

# Estilo general

La aplicación debe transmitir la sensación de un producto SaaS moderno.

Se priorizarán:

- Diseño minimalista.
- Bordes redondeados suaves.
- Sombras muy sutiles.
- Espaciado generoso.
- Tipografía clara.
- Componentes consistentes.

El resultado debe sentirse cercano a aplicaciones modernas como GitHub o Linear, manteniendo una identidad limpia, funcional y fácil de utilizar.