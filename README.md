# KOMPA Costa Rica · Marco Oficial para Historias de Instagram (1080×1920)

Aplicación web estática (100% frontend, sin dependencias de backend ni builds pesados) lista para desplegar en **GitHub Pages** y ser vinculada o integrada en producción en `https://www.kompacr.com/marco`.

Diseñada para eventos, activaciones de marca, puntos de venta y campañas en redes sociales: los usuarios escanean un código QR con su smartphone, capturan una selfie o suben una foto, ajustan su encuadre táctilmente con el marco oficial de **KOMPA** en resolución nativa de Instagram Stories (1080×1920 px, 9:16) y la comparten directamente en sus Historias de Instagram etiquetando a `@KOMPA.CR`.

---

## 🏔️ 1. Identidad Visual Oficial (Manual de Marca KOMPA 2026)

- **Tipografía:** Google Fonts `Montserrat` (pesos `500`, `600`, `700`, `800`, `900`).
- **Paleta de Colores Corporativa:**
  - `KOMPA INK`: `#07111E` (Fondo principal, biseles y contraste alto)
  - `KOMPA WHITE`: `#FFFFFF` (Wordmark, isotipo y textos principales)
  - `KOMPA SAND`: `#F4F0E9` (Textos secundarios y detalles editoriales)
  - `KOMPA METAL`: `#B5B8B7` (Placas metálicas grabadas de pulseras)
  - **Acentos de Colección:**
    - Amarillo Meta: `#FFD100`
    - Turquesa Océano: `#2EC4B6`
    - Rosa Vibrante: `#F24C8B`
    - Verde Naturaleza: `#2E7D5B`
    - Naranja Cumbre: `#F26430`
- **Elementos del Marco 1080×1920 px:**
  - **Header Superior:** Isotipo oficial vectorial (montaña con sendero sinuoso interior), wordmark `K O M P A` en Montserrat ExtraBold con tracking amplio y slogan `CREA TU PROPIA HISTORIA`, respetando la zona segura superior de Instagram.
  - **Ventana de Encuadre Central:** Recorte rectangular transparente de esquinas redondeadas (`border-radius: 38px`, `960×1250 px`) donde se previsualiza y ajusta la fotografía del usuario.
  - **Sistema Lateral:** Marcadores de ruta minimalistas, hitos de aventura y coordenadas geográficas de Costa Rica (`9.7489° N, 83.7534° W`).
  - **Footer Inferior:** Slogan `CREA TU PROPIA HISTORIA`, handle `@KOMPA.CR` acompañado de la bandera de Costa Rica y el texto `COSTA RICA`, junto con ilustraciones vectoriales de las pulseras modulares de silicona y placas metálicas grabadas de KOMPA.

---

## 🚀 2. Características Técnicas

1. **Cámara en Vivo en Tiempo Real (WebRTC):**
   - Transmisión continua en el canvas 9:16 con el marco KOMPA superpuesto en tiempo real a 60 FPS.
   - Alternancia entre cámara frontal (`user`, con efecto espejo natural en vista previa y corregido en la captura) y trasera (`environment`).
   - Temporizador opcional de 3 segundos con cuenta regresiva visual y alertas sonoras.
   - Sonido de obturador y flash sintetizados con **Web Audio API** (sin archivos de audio externos que puedan fallar).
2. **Manipulación Táctil Multitouch:**
   - Arrastre con un dedo / mouse (Pan X/Y).
   - Pellizco con dos dedos (*Pinch-to-zoom*) en pantallas táctiles de celulares.
   - Controles de zoom con slider y botones `+` / `-`.
   - Rotación 90° en sentido horario.
   - Botón de centrado y restablecimiento instantáneo.
3. **Variantes de Marco en Canvas + Carga de PNG:**
   - **Oficial:** `#07111E` con acentos de colección multicolor (`#FFD100`, `#2EC4B6`, `#F24C8B`).
   - **Sport:** Acentos de alta visibilidad en Amarillo Meta (`#FFD100`) y Naranja Cumbre (`#F26430`).
   - **Travel:** Acentos en Turquesa Océano (`#2EC4B6`) y Verde Naturaleza (`#2E7D5B`) con ondas topográficas.
   - **Minimal:** Marco con degradado suave y bordes ultra-delgados para máxima visibilidad fotográfica.
   - **+ Subir PNG:** Permite cargar cualquier archivo PNG transparente de 1080×1920 px diseñado por el equipo de diseño.
4. **Exportación y Salto Directo a Instagram Stories:**
   - Botón **"Compartir en Historias"**: Genera el archivo `kompa-historia.png` y utiliza la **Web Share API (`navigator.share({ files: [file] })`)** para abrir el selector nativo del sistema operativo del celular y enviar directo a Instagram Stories.
   - **Fallback automático inteligente:** En navegadores de escritorio o sin soporte de Web Share, descarga la imagen automáticamente en resolución HD 1080×1920 y abre una ventana modal con el paso a paso y enlace a Instagram.
5. **Generador de Código QR Integrado:**
   - Generación dinámica de QR con `qrcodejs` apuntando a la URL actual o editable.
   - Botón **"Descargar Cartel QR (PNG 600×680)"** que genera automáticamente un diseño para imprimir con el QR oficial, isotipo KOMPA, marco y claim `CREA TU PROPIA HISTORIA`.

---

## 📦 3. Estructura del Proyecto

```text
kompa-marco-stories/
├── index.html         # Estructura semántica, Tailwind CSS CDN, modales y canvas
├── style.css          # Estilos de zonas seguras iOS/Android, sliders y animaciones
├── app.js             # Motor Canvas 1080x1920, cámara, gestos táctiles, QR y Share API
└── README.md          # Instrucciones de despliegue y documentación
```

---

## 🌐 4. Instrucciones de Despliegue

### Opción A: Despliegue en GitHub Pages (Recomendado, 2 minutos)

1. Crea un repositorio en GitHub, por ejemplo: `kompa-marco` o `marco-stories`.
2. Sube los archivos (`index.html`, `style.css`, `app.js`, `README.md`) a la rama `main`.
3. En GitHub, dirígete a:
   **Settings** > **Pages** (en el menú lateral izquierdo).
4. En **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Selecciona `main` y `/ (root)`.
   - Haz clic en **Save**.
5. Tu aplicación estará disponible en minutos en:
   `https://<tu-usuario>.github.io/<tu-repositorio>/`

### Opción B: Integración en Producción (`https://www.kompacr.com/marco`)

Puedes poner en producción esta herramienta bajo tu dominio principal mediante cualquiera de los siguientes métodos:

1. **Subdirectorio estático en tu servidor / hosting (Vercel, Netlify, Cloudflare Pages o Apache/Nginx):**
   - Coloca los archivos en la carpeta `/marco` de tu servidor web.
   - Al entrar a `https://www.kompacr.com/marco`, se cargará el `index.html`.
2. **Reverse Proxy o Redirección Cloudflare / Nginx:**
   - Si tu sitio principal está en WordPress, Shopify u otro CMS, configura una regla de proxy inverso para que la ruta `/marco` apunte a tu GitHub Pages de manera transparente.
3. **Iframe Responsivo en tu CMS:**
   ```html
   <iframe 
     src="https://<tu-usuario>.github.io/<tu-repositorio>/" 
     style="width:100%; height:100dvh; border:none; overflow:hidden;" 
     allow="camera; microphone; clipboard-write; web-share"
   ></iframe>
   ```
   > **Nota importante:** Para que la cámara web y el botón de compartir funcionen dentro de un `iframe`, es indispensable incluir el atributo `allow="camera; web-share"`.

---

## 📱 5. Buenas Prácticas para Eventos y Activaciones

1. Abre la herramienta desde tu computadora o teléfono.
2. Toca el botón **"QR"** en la esquina superior derecha.
3. Verifica que la URL esté configurada en `https://www.kompacr.com/marco`.
4. Haz clic en **"Descargar Cartel QR (PNG 600×680)"**.
5. Imprime el cartel descargado en acrílicos de mesa, flyers o tótems en tus stands de eventos deportivos, ferias o tiendas de KOMPA Costa Rica.

---

## 📄 Licencia y Derechos

© 2026 **KOMPA Costa Rica**. Todos los derechos reservados.
*Crea Tu Propia Historia.*

