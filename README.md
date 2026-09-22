# 🔊 LectoVoz — App accesible para discapacidad visual · Por Diana Trujillo

Lector de textos en voz alta con accesibilidad total (WCAG 2.1 AA). 100% front-end, sin backend: tus textos nunca salen del dispositivo.

## Funciones
- 🔊 Leer en voz alta, pausar, continuar, detener (Web Speech API)
- 🖱 Leer texto seleccionado + leer archivos `.txt`
- 🗣 Selector de voz en español, velocidad y volumen
- 🔍 A+/A-, alto contraste, invertir colores, resaltar enlaces, quitar animaciones
- ⌨️ 100% navegable por teclado + atajos `Alt+L` / `Alt+P` / `Alt+S`
- 📱 Responsive, botones grandes (56px), foco visible, regiones ARIA

## Demo local
```
http://localhost/lectovoz/
```
Demo en GitHub Pages: Settings → Pages → Deploy from branch → `main` → `/ (root)`.

## Estructura del proyecto
```
lectovoz/
├── index.html          · Estructura semántica: lector, ejemplos, atajos (skip-link, ARIA)
├── styles.css          · Temas (normal, alto contraste, invertido), foco visible, responsive
├── app.js              · SpeechSynthesis: leer/pausar/continuar/detener/selección,
│                         voces, velocidad, archivo .txt, atajos de teclado
├── lectovoz_db.sql     · Esquema opcional (historial multi-usuario a futuro)
└── README.md
```

## Base de datos `lectovoz_db` (extensión opcional)
| Tabla | Guarda |
|---|---|
| `usuarios` | nombre, email único, tipo de discapacidad |
| `preferencias_accesibilidad` | fuente, contrastes, voz y velocidad (1 por usuario) |
| `textos` | título, contenido, categoría, nº de palabras (generada), FULLTEXT |
| `lecturas` | historial usuario + texto, duración, completada |
| `voces_favoritas` | voces preferidas por usuario |
| `vista_historial` | historial legible |

```powershell
Get-Content lectovoz_db.sql -Raw | mysql -u root
```

## Stack
HTML + CSS + JavaScript (Web Speech API) + MySQL (opcional).

Hecho por **Diana Trujillo** ✨
