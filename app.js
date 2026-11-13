/**
 * ============================================================================
 * KOMPA COSTA RICA - MARCO OFICIAL PARA HISTORIAS DE INSTAGRAM (1080x1920)
 * Sistema Web Frontend 100% Estático · Identidad de Marca 2026
 * ============================================================================
 */

(() => {
  'use strict';

  // --- CONSTANTES DE DISEÑO Y RESOLUCIÓN NATIVA ---
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  // Ventana de encuadre fotográfico (960 x 1250 px, radio 38px)
  const WINDOW_X = 60;
  const WINDOW_Y = 290;
  const WINDOW_W = 960;
  const WINDOW_H = 1250;
  const WINDOW_RADIUS = 38;

  // Paleta Oficial KOMPA 2026
  const PALETTE = {
    ink: '#07111E',
    white: '#FFFFFF',
    sand: '#F4F0E9',
    metal: '#B5B8B7',
    meta: '#FFD100',      // Amarillo Meta
    oceano: '#2EC4B6',    // Turquesa Océano
    rosa: '#F24C8B',      // Rosa Vibrante
    naturaleza: '#2E7D5B',// Verde Naturaleza
    cumbre: '#F26430'     // Naranja Cumbre
  };

  // --- ELEMENTOS DEL DOM ---
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');
  const video = document.getElementById('cameraVideo');
  const flashOverlay = document.getElementById('flashOverlay');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  const liveBadge = document.getElementById('liveBadge');
  const gestureHint = document.getElementById('gestureHint');
  const cameraPromptOverlay = document.getElementById('cameraPromptOverlay');
  const btnGrantCamera = document.getElementById('btnGrantCamera');
  const promptGalleryInput = document.getElementById('promptGalleryInput');

  // Contenedores de controles
  const cameraControls = document.getElementById('cameraControls');
  const capturedControls = document.getElementById('capturedControls');
  const editingTools = document.getElementById('editingTools');

  // Botones y Sliders
  const btnShutter = document.getElementById('btnShutter');
  const btnTimer = document.getElementById('btnTimer');
  const timerLabel = document.getElementById('timerLabel');
  const btnFlipCamera = document.getElementById('btnFlipCamera');
  const galleryInput = document.getElementById('galleryInput');
  const customFrameInput = document.getElementById('customFrameInput');
  const zoomSlider = document.getElementById('zoomSlider');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnRotate = document.getElementById('btnRotate');
  const btnResetTransform = document.getElementById('btnResetTransform');
  const btnShareStory = document.getElementById('btnShareStory');
  const btnDownload = document.getElementById('btnDownload');
  const btnRetake = document.getElementById('btnRetake');

  // Modales
  const btnOpenQR = document.getElementById('btnOpenQR');
  const btnCloseQR = document.getElementById('btnCloseQR');
  const qrModal = document.getElementById('qrModal');
  const qrUrlInput = document.getElementById('qrUrlInput');
  const btnCopyUrl = document.getElementById('btnCopyUrl');
  const btnDownloadQRPNG = document.getElementById('btnDownloadQRPNG');
  const qrcodeContainer = document.getElementById('qrcodeContainer');

  const btnOpenHelp = document.getElementById('btnOpenHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const btnUnderstood = document.getElementById('btnUnderstood');
  const helpModal = document.getElementById('helpModal');

  const fallbackModal = document.getElementById('fallbackModal');
  const btnCloseFallback = document.getElementById('btnCloseFallback');

  // Notificaciones Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  // --- ESTADO DE LA APLICACIÓN ---
  let isCameraActive = false;
  let currentFacingMode = 'user'; // 'user' (frontal) o 'environment' (trasera)
  let videoStream = null;
  let timerSeconds = 0; // 0s o 3s
  let isCountingDown = false;

  let activeVariant = 'oficial'; // 'oficial', 'sport', 'travel', 'minimal', 'custom'
  let customFrameImage = null;

  // Estado de la foto cargada o capturada
  let userImage = null; // Instancia de HTMLImageElement o ImageBitmap
  let photoPanX = 0;
  let photoPanY = 0;
  let photoScale = 1.0;
  let photoRotation = 0; // en radianes

  // Gestos táctiles y ratón
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPinchDistance = 0;
  let initialPinchScale = 1.0;

  // Instancia de QRCode
  let qrCodeInstance = null;

  // Audio Context para sonido de obturador sintetizado
  let audioCtx = null;

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', async () => {
    // Configurar URL por defecto para el QR (usando el host actual o producción)
    const currentUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
      ? 'https://www.kompacr.com/marco'
      : window.location.href;
    
    qrUrlInput.value = currentUrl;
    generateQRCode(currentUrl);

    // Intentar iniciar la cámara frontal de manera predeterminada
    await startCamera();

    // Iniciar loop de renderizado
    requestAnimationFrame(renderLoop);
  });

  // ==========================================================================
  // MANEJO DE CÁMARA (WEBRTC) ROBUSTO Y COMPATIBLE CON MÓVILES
  // ==========================================================================
  async function requestCameraStream(facing) {
    const attempts = [
      { audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { audio: false, video: { facingMode: { ideal: facing } } },
      { audio: false, video: { facingMode: facing } },
      { audio: false, video: true }
    ];

    let lastError = null;
    for (const c of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c);
        return stream;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('No se pudo acceder a la cámara.');
  }

  async function startCamera(fromUserGesture = false) {
    stopCamera();
    userImage = null; // Quitar cualquier imagen previa para ver la cámara

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraPrompt();
      showToast('Tu navegador o entorno requiere activar la cámara manualmente.', '📷');
      return;
    }

    try {
      videoStream = await requestCameraStream(currentFacingMode);
      video.srcObject = videoStream;
      video.muted = true;
      video.playsInline = true;

      // Esperar a que el stream esté listo para ser dibujado
      await new Promise((resolve) => {
        if (video.videoWidth > 0 && video.readyState >= 2) return resolve();
        video.onloadedmetadata = () => resolve();
        video.oncanplay = () => resolve();
        setTimeout(resolve, 800);
      });

      try {
        await video.play();
      } catch (playErr) {
        console.warn('Reproducción de video pendiente de interacción:', playErr);
      }

      isCameraActive = true;
      hideCameraPrompt();
      liveBadge.classList.remove('hidden');
      cameraControls.classList.remove('hidden');
      capturedControls.classList.add('hidden');
      editingTools.classList.add('opacity-40', 'pointer-events-none');
    } catch (err) {
      console.warn('Cámara requiere permiso explícito:', err);
      isCameraActive = false;
      liveBadge.classList.add('hidden');
      cameraControls.classList.remove('hidden');
      capturedControls.classList.add('hidden');
      showCameraPrompt();
      if (fromUserGesture) {
        showToast('Permiso de cámara denegado en tu navegador.', '⚠️');
      }
    }
  }

  function showCameraPrompt() {
    if (cameraPromptOverlay) {
      cameraPromptOverlay.classList.remove('hidden');
      cameraPromptOverlay.classList.add('flex');
    }
  }

  function hideCameraPrompt() {
    if (cameraPromptOverlay) {
      cameraPromptOverlay.classList.add('hidden');
      cameraPromptOverlay.classList.remove('flex');
    }
  }

  // Botón explícito dentro del viewport para otorgar permiso con un toque (requerimiento de iOS y Safari)
  if (btnGrantCamera) {
    btnGrantCamera.addEventListener('click', async () => {
      await startCamera(true);
    });
  }

  // Subir desde el prompt de cámara
  if (promptGalleryInput) {
    promptGalleryInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          userImage = img;
          resetPhotoTransform();
          stopCamera();
          hideCameraPrompt();
          enterEditMode();
          showToast('Foto cargada desde galería', '🖼️');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
    isCameraActive = false;
  }

  // Alternar entre cámara frontal y trasera
  btnFlipCamera.addEventListener('click', async () => {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    showToast(currentFacingMode === 'user' ? 'Cámara Frontal' : 'Cámara Trasera', '🔄');
    await startCamera(true);
  });

  // Alternar temporizador (0s -> 3s -> 0s)
  btnTimer.addEventListener('click', () => {
    timerSeconds = (timerSeconds === 0) ? 3 : 0;
    timerLabel.textContent = `${timerSeconds}s`;
    btnTimer.classList.toggle('bg-kompa-meta/20', timerSeconds > 0);
    btnTimer.classList.toggle('text-kompa-meta', timerSeconds > 0);
    showToast(`Temporizador: ${timerSeconds} segundos`, '⏱️');
  });

  // ==========================================================================
  // DISPARADOR DE FOTO (SHUTTER) Y TEMPORIZADOR
  // ==========================================================================
  btnShutter.addEventListener('click', () => {
    if (isCountingDown) return;

    if (timerSeconds > 0) {
      runCountdown(timerSeconds, () => capturePhotoFromVideo());
    } else {
      capturePhotoFromVideo();
    }
  });

  function runCountdown(seconds, callback) {
    isCountingDown = true;
    countdownOverlay.classList.remove('hidden');
    countdownOverlay.classList.add('flex');
    
    let current = seconds;
    countdownNumber.textContent = current;
    playBeepSound(440, 0.1);

    const interval = setInterval(() => {
      current--;
      if (current > 0) {
        countdownNumber.textContent = current;
        playBeepSound(440, 0.1);
      } else {
        clearInterval(interval);
        countdownOverlay.classList.add('hidden');
        countdownOverlay.classList.remove('flex');
        isCountingDown = false;
        playBeepSound(880, 0.25);
        callback();
      }
    }, 1000);
  }

  function capturePhotoFromVideo() {
    if (!video.videoWidth || !video.videoHeight) {
      showToast('Esperando señal de la cámara...', '⏳');
      return;
    }

    // Disparar flash visual y sonido de obturador
    triggerFlash();
    playShutterSound();

    // Crear un canvas temporal para extraer el frame con máxima fidelidad
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tCtx = tempCanvas.getContext('2d');

    // Si es cámara frontal, aplicar efecto espejo para corregir orientación natural
    if (currentFacingMode === 'user') {
      tCtx.translate(tempCanvas.width, 0);
      tCtx.scale(-1, 1);
    }
    tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const capturedImg = new Image();
    capturedImg.onload = () => {
      userImage = capturedImg;
      resetPhotoTransform();
      stopCamera();
      enterEditMode();
      showToast('¡Foto capturada! Ajusta y comparte.', '✨');
    };
    capturedImg.src = tempCanvas.toDataURL('image/png');
  }

  function triggerFlash() {
    flashOverlay.classList.add('flash-active');
    setTimeout(() => {
      flashOverlay.classList.remove('flash-active');
    }, 250);
  }

  function enterEditMode() {
    isCameraActive = false;
    liveBadge.classList.add('hidden');
    cameraControls.classList.add('hidden');
    capturedControls.classList.remove('hidden');
    editingTools.classList.remove('opacity-40', 'pointer-events-none');
    
    // Ocultar hint tras 3 segundos
    setTimeout(() => {
      gestureHint.style.opacity = '0';
    }, 3500);
  }

  // ==========================================================================
  // CARGA DE FOTO DESDE GALERÍA
  // ==========================================================================
  galleryInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        userImage = img;
        resetPhotoTransform();
        stopCamera();
        enterEditMode();
        showToast('Foto cargada desde galería', '🖼️');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // ==========================================================================
  // CARGA DE MARCO PNG PERSONALIZADO
  // ==========================================================================
  customFrameInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        customFrameImage = img;
        setActiveVariant('custom');
        showToast('Marco PNG personalizado cargado', '🎨');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // Selector de variantes predeterminadas
  document.querySelectorAll('.frame-variant-btn[data-variant]').forEach(btn => {
    btn.addEventListener('click', () => {
      const variant = btn.getAttribute('data-variant');
      setActiveVariant(variant);
    });
  });

  function setActiveVariant(variant) {
    activeVariant = variant;
    document.querySelectorAll('.frame-variant-btn').forEach(btn => {
      if (btn.getAttribute('data-variant') === variant) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // MANIPULACIÓN Y TRANSFORMACIONES DE LA FOTO (ZOOM, PAN, ROTATE)
  // ==========================================================================
  function resetPhotoTransform() {
    photoPanX = 0;
    photoPanY = 0;
    photoRotation = 0;

    if (!userImage) {
      photoScale = 1.0;
      zoomSlider.value = 1.0;
      return;
    }

    // Calcular escala inicial para cubrir holgadamente la ventana de recorte
    const scaleX = WINDOW_W / userImage.width;
    const scaleY = WINDOW_H / userImage.height;
    photoScale = Math.max(scaleX, scaleY) * 1.05;
    zoomSlider.value = photoScale;
  }

  zoomSlider.addEventListener('input', (e) => {
    photoScale = parseFloat(e.target.value);
  });

  btnZoomIn.addEventListener('click', () => {
    photoScale = Math.min(3.0, photoScale + 0.15);
    zoomSlider.value = photoScale;
  });

  btnZoomOut.addEventListener('click', () => {
    photoScale = Math.max(0.5, photoScale - 0.15);
    zoomSlider.value = photoScale;
  });

  btnRotate.addEventListener('click', () => {
    photoRotation += Math.PI / 2;
    if (photoRotation >= Math.PI * 2) photoRotation = 0;
    showToast('Rotado 90°', '🔄');
  });

  btnResetTransform.addEventListener('click', () => {
    resetPhotoTransform();
    showToast('Posición y zoom restablecidos', '🎯');
  });

  btnRetake.addEventListener('click', async () => {
    userImage = null;
    hideCameraPrompt();
    await startCamera(true);
  });

  // ==========================================================================
  // MANEJO DE GESTOS TÁCTILES Y RATÓN (DRAG + PINCH TO ZOOM)
  // ==========================================================================
  canvas.addEventListener('mousedown', (e) => {
    if (isCameraActive) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    gestureHint.style.opacity = '0';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || isCameraActive) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    // Escalar desplazamiento según la relación canvas render/pantalla
    const rect = canvas.getBoundingClientRect();
    const factor = CANVAS_WIDTH / rect.width;
    photoPanX += dx * factor;
    photoPanY += dy * factor;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Gestos táctiles para dispositivos móviles
  canvas.addEventListener('touchstart', (e) => {
    if (isCameraActive) return;
    gestureHint.style.opacity = '0';

    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchScale = photoScale;
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (isCameraActive) return;
    e.preventDefault(); // Prevenir scroll o zoom del navegador

    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;

      const rect = canvas.getBoundingClientRect();
      const factor = CANVAS_WIDTH / rect.width;
      photoPanX += dx * factor;
      photoPanY += dy * factor;
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (initialPinchDistance > 0) {
        const factor = dist / initialPinchDistance;
        photoScale = Math.min(3.0, Math.max(0.5, initialPinchScale * factor));
        zoomSlider.value = photoScale;
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = 0;
  });

  function getTouchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  // ==========================================================================
  // LOOP DE RENDERIZADO EN CANVAS (1080x1920)
  // ==========================================================================
  function renderLoop() {
    renderCanvas();
    requestAnimationFrame(renderLoop);
  }

  function renderCanvas() {
    // 1. Limpiar lienzo
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Dibujar foto o stream de video en el área de la ventana
    ctx.save();
    
    // Crear camino de recorte con bordes redondeados (38px de radio)
    drawRoundedRectPath(ctx, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    ctx.clip();

    // Fondo oscuro dentro del recorte si aún no hay imagen
    ctx.fillStyle = '#0F1A28';
    ctx.fillRect(WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H);

    const windowCenterX = WINDOW_X + WINDOW_W / 2;
    const windowCenterY = WINDOW_Y + WINDOW_H / 2;

    if (isCameraActive && video.videoWidth) {
      // Modo Cámara en Vivo: proyección directa al recorte
      ctx.save();
      ctx.translate(windowCenterX, windowCenterY);

      // Si es cámara frontal, aplicar espejo en vista previa para naturalidad
      if (currentFacingMode === 'user') {
        ctx.scale(-1, 1);
      }

      const vScale = Math.max(WINDOW_W / video.videoWidth, WINDOW_H / video.videoHeight);
      const drawW = video.videoWidth * vScale;
      const drawH = video.videoHeight * vScale;
      ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

    } else if (userImage) {
      // Modo Edición / Foto Capturada
      ctx.save();
      ctx.translate(windowCenterX + photoPanX, windowCenterY + photoPanY);
      ctx.rotate(photoRotation);
      ctx.scale(photoScale, photoScale);
      ctx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
      ctx.restore();
    }

    ctx.restore(); // Termina clipping

    // 3. Renderizar el marco superior según la variante elegida
    if (activeVariant === 'custom' && customFrameImage) {
      ctx.drawImage(customFrameImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (activeVariant === 'sport') {
      renderFrameSport(ctx);
    } else if (activeVariant === 'travel') {
      renderFrameTravel(ctx);
    } else if (activeVariant === 'minimal') {
      renderFrameMinimal(ctx);
    } else {
      renderFrameOficial(ctx);
    }
  }

  // ==========================================================================
  // MOTORES DE DISEÑO DE MARCOS GRÁFICOS (1080x1920)
  // ==========================================================================

  /**
   * VARIANTE 1: OFICIAL KOMPA COSTA RICA 2026
   * Base #07111E con recorte evenodd, Isotipo sinuoso, acentos multicolor de colección,
   * handle @KOMPA.CR y pulseras modulares de silicona con placas metálicas grabadas.
   */
  function renderFrameOficial(c) {
    c.save();

    // Fondo KOMPA INK con recorte central transparente (evenodd)
    c.fillStyle = PALETTE.ink;
    c.beginPath();
    c.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.fill('evenodd');

    // Borde elegante alrededor de la ventana de foto
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.stroke();

    // --- HEADER: ZONA SUPERIOR (Y: 100 - 270) ---
    // Isotipo Vectorial Oficial de KOMPA
    drawKompaIsotipo(c, 540, 115, 62, PALETTE.white, PALETTE.meta, PALETTE.oceano);

    // Wordmark KOMPA
    c.textAlign = 'center';
    c.fillStyle = PALETTE.white;
    c.font = '900 38px Montserrat';
    c.letterSpacing = '0.35em';
    c.fillText('K O M P A', 548, 202);

    // Slogan superior
    c.fillStyle = PALETTE.sand;
    c.font = '600 15px Montserrat';
    c.letterSpacing = '0.22em';
    c.fillText('CREA TU PROPIA HISTORIA', 540, 238);

    // Indicador sutil de colección en header
    drawAccentDots(c, 540, 260);

    // --- LATERALES: LÍNEAS DE RUTA Y HITOS DE AVENTURA ---
    drawLateralRouteSystem(c, PALETTE.meta, PALETTE.oceano, PALETTE.rosa);

    // --- FOOTER: ZONA INFERIOR (Y: 1560 - 1880) ---
    // Placas metálicas y pulseras de silicona KOMPA en las esquinas inferiores
    drawSiliconeBraceletBadge(c, 160, 1720, 'KOMPA METAL', '#FFD100');
    drawSiliconeBraceletBadge(c, 920, 1720, 'COSTA RICA', '#2EC4B6');

    // Slogan principal inferior
    c.fillStyle = PALETTE.white;
    c.font = '800 24px Montserrat';
    c.letterSpacing = '0.25em';
    c.fillText('CREA TU PROPIA HISTORIA', 540, 1600);

    // Línea de ruta central inferior
    drawCurvedRouteDivider(c, 540, 1630);

    // Handle Oficial @KOMPA.CR con bandera de Costa Rica
    c.font = '800 30px Montserrat';
    c.fillStyle = PALETTE.white;
    c.letterSpacing = '0.12em';
    c.fillText('@KOMPA.CR', 540, 1680);

    // Bandera oficial de Costa Rica y texto editorial
    drawCostaRicaBadge(c, 540, 1725);

    // Coordenadas geográficas oficiales de Costa Rica
    c.fillStyle = PALETTE.metal;
    c.font = '600 12px Montserrat';
    c.letterSpacing = '0.2em';
    c.fillText('9.7489° N, 83.7534° W · EDICIÓN 2026', 540, 1785);

    c.restore();
  }

  /**
   * VARIANTE 2: SPORT KOMPA (Amarillo Meta & Naranja Cumbre)
   */
  function renderFrameSport(c) {
    c.save();

    c.fillStyle = PALETTE.ink;
    c.beginPath();
    c.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.fill('evenodd');

    // Borde dinámico con gradiente deportivo
    c.lineWidth = 4;
    const grad = c.createLinearGradient(WINDOW_X, WINDOW_Y, WINDOW_X + WINDOW_W, WINDOW_Y + WINDOW_H);
    grad.addColorStop(0, PALETTE.meta);
    grad.addColorStop(1, PALETTE.cumbre);
    c.strokeStyle = grad;
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.stroke();

    // Header Sport
    drawKompaIsotipo(c, 540, 115, 62, PALETTE.white, PALETTE.meta, PALETTE.cumbre);

    c.textAlign = 'center';
    c.fillStyle = PALETTE.white;
    c.font = '900 38px Montserrat';
    c.letterSpacing = '0.35em';
    c.fillText('K O M P A', 548, 202);

    // Badge "SPORT PERFORMANCE"
    drawPillBadge(c, 540, 240, 'SPORT PERFORMANCE', PALETTE.cumbre, PALETTE.ink);

    // Líneas dinámicas en los laterales
    drawSportLateralTicks(c, PALETTE.meta, PALETTE.cumbre);

    // Footer Sport
    c.fillStyle = PALETTE.white;
    c.font = '800 24px Montserrat';
    c.letterSpacing = '0.2em';
    c.fillText('DESAFÍA TUS LÍMITES', 540, 1600);

    c.font = '800 30px Montserrat';
    c.fillStyle = PALETTE.meta;
    c.letterSpacing = '0.12em';
    c.fillText('@KOMPA.CR', 540, 1660);

    drawCostaRicaBadge(c, 540, 1715);

    c.fillStyle = PALETTE.sand;
    c.font = '700 13px Montserrat';
    c.letterSpacing = '0.25em';
    c.fillText('RESISTENCIA · ALTITUD · VELOCIDAD', 540, 1775);

    c.restore();
  }

  /**
   * VARIANTE 3: TRAVEL & ADVENTURE (Turquesa Océano & Verde Naturaleza)
   */
  function renderFrameTravel(c) {
    c.save();

    c.fillStyle = PALETTE.ink;
    c.beginPath();
    c.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.fill('evenodd');

    // Borde fino color Turquesa Océano
    c.lineWidth = 3.5;
    c.strokeStyle = PALETTE.oceano;
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.stroke();

    // Header Travel
    drawKompaIsotipo(c, 540, 115, 62, PALETTE.white, PALETTE.oceano, PALETTE.naturaleza);

    c.textAlign = 'center';
    c.fillStyle = PALETTE.white;
    c.font = '900 38px Montserrat';
    c.letterSpacing = '0.35em';
    c.fillText('K O M P A', 548, 202);

    drawPillBadge(c, 540, 240, 'EXPLORA COSTA RICA', PALETTE.oceano, PALETTE.ink);

    // Líneas topográficas en laterales
    drawTopographicTicks(c, PALETTE.oceano, PALETTE.naturaleza);

    // Footer Travel
    c.fillStyle = PALETTE.white;
    c.font = '800 24px Montserrat';
    c.letterSpacing = '0.2em';
    c.fillText('CADA SENDERO ES TU HISTORIA', 540, 1600);

    c.font = '800 30px Montserrat';
    c.fillStyle = PALETTE.white;
    c.letterSpacing = '0.12em';
    c.fillText('@KOMPA.CR', 540, 1660);

    drawCostaRicaBadge(c, 540, 1715);

    c.fillStyle = PALETTE.sand;
    c.font = '600 12px Montserrat';
    c.letterSpacing = '0.22em';
    c.fillText('OCÉANO PACÍFICO · CARIBE · VOLCANES', 540, 1775);

    c.restore();
  }

  /**
   * VARIANTE 4: MINIMAL EDITORIAL (Estilo fotográfico puro)
   */
  function renderFrameMinimal(c) {
    c.save();

    // Gradientes sutiles en top y bottom para máxima visibilidad de la foto
    const topGrad = c.createLinearGradient(0, 0, 0, 320);
    topGrad.addColorStop(0, 'rgba(7, 17, 30, 0.95)');
    topGrad.addColorStop(0.7, 'rgba(7, 17, 30, 0.7)');
    topGrad.addColorStop(1, 'rgba(7, 17, 30, 0)');
    c.fillStyle = topGrad;
    c.fillRect(0, 0, CANVAS_WIDTH, 320);

    const bottomGrad = c.createLinearGradient(0, 1500, 0, CANVAS_HEIGHT);
    bottomGrad.addColorStop(0, 'rgba(7, 17, 30, 0)');
    bottomGrad.addColorStop(0.3, 'rgba(7, 17, 30, 0.8)');
    bottomGrad.addColorStop(1, 'rgba(7, 17, 30, 0.98)');
    c.fillStyle = bottomGrad;
    c.fillRect(0, 1500, CANVAS_WIDTH, 420);

    // Marco exterior fino
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    drawRoundedRectPath(c, WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, WINDOW_RADIUS);
    c.stroke();

    // Logo sutil arriba
    drawKompaIsotipo(c, 540, 120, 52, PALETTE.white, PALETTE.meta, PALETTE.oceano);
    c.textAlign = 'center';
    c.fillStyle = PALETTE.white;
    c.font = '900 32px Montserrat';
    c.letterSpacing = '0.35em';
    c.fillText('K O M P A', 546, 195);

    // Footer minimal
    c.fillStyle = PALETTE.white;
    c.font = '800 24px Montserrat';
    c.letterSpacing = '0.25em';
    c.fillText('CREA TU PROPIA HISTORIA', 540, 1680);

    c.font = '700 22px Montserrat';
    c.fillStyle = PALETTE.sand;
    c.letterSpacing = '0.15em';
    c.fillText('@KOMPA.CR 🇨🇷', 540, 1730);

    c.restore();
  }

  // ==========================================================================
  // ELEMENTOS GRÁFICOS Y VECTORES DE MARCA
  // ==========================================================================

  /**
   * Dibuja el Isotipo oficial KOMPA:
   * Montaña geométrica exterior con ruta sinuosa interior.
   */
  function drawKompaIsotipo(c, x, y, size, peakColor, trailColor1, trailColor2) {
    c.save();
    c.translate(x, y);

    const half = size / 2;
    // Montaña geométrica
    c.beginPath();
    c.moveTo(0, -half);
    c.lineTo(half * 1.15, half * 0.95);
    c.lineTo(-half * 1.15, half * 0.95);
    c.closePath();
    c.lineWidth = 4.5;
    c.strokeStyle = peakColor;
    c.lineJoin = 'round';
    c.stroke();

    // Sendero sinuoso interior 1 (Amarillo / Acento)
    c.beginPath();
    c.moveTo(-half * 0.3, half * 0.95);
    c.bezierCurveTo(0, half * 0.45, -half * 0.4, 0, 0, -half * 0.5);
    c.lineWidth = 4;
    c.strokeStyle = trailColor1;
    c.lineCap = 'round';
    c.stroke();

    // Sendero sinuoso complementario 2 (Turquesa / Acento)
    c.beginPath();
    c.moveTo(half * 0.3, half * 0.95);
    c.bezierCurveTo(0, half * 0.45, half * 0.4, 0, 0, -half * 0.5);
    c.lineWidth = 2.5;
    c.setLineDash([3, 4]);
    c.strokeStyle = trailColor2;
    c.stroke();

    c.restore();
  }

  /**
   * Sistema de líneas de ruta lateral y puntos de hito (Colección KOMPA 2026)
   */
  function drawLateralRouteSystem(c, col1, col2, col3) {
    c.save();

    // Lateral Izquierdo
    c.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(35, WINDOW_Y + 100);
    c.lineTo(35, WINDOW_Y + WINDOW_H - 100);
    c.stroke();

    // Hitos izquierdos con acentos
    drawMilestoneNode(c, 35, WINDOW_Y + 250, col1, '01');
    drawMilestoneNode(c, 35, WINDOW_Y + 600, col2, '02');
    drawMilestoneNode(c, 35, WINDOW_Y + 950, col3, '03');

    // Lateral Derecho
    c.beginPath();
    c.moveTo(CANVAS_WIDTH - 35, WINDOW_Y + 100);
    c.lineTo(CANVAS_WIDTH - 35, WINDOW_Y + WINDOW_H - 100);
    c.stroke();

    // Hitos derechos
    drawMilestoneNode(c, CANVAS_WIDTH - 35, WINDOW_Y + 380, col2, 'CR');
    drawMilestoneNode(c, CANVAS_WIDTH - 35, WINDOW_Y + 750, col1, '★');

    c.restore();
  }

  function drawMilestoneNode(c, x, y, color, label) {
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, 6, 0, Math.PI * 2);
    c.fill();

    // Anillo exterior
    c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.stroke();

    c.restore();
  }

  /**
   * Ilustración estilizada de la pulsera modular de silicona KOMPA
   * con su placa metálica grabada (KOMPA METAL #B5B8B7).
   */
  function drawSiliconeBraceletBadge(c, x, y, text, accentColor) {
    c.save();
    c.translate(x, y);

    // Correa de silicona (píldora con textura segmentada)
    c.fillStyle = '#1A2535';
    drawRoundedRectPath(c, -85, -16, 170, 32, 16);
    c.fill();

    // Ranuras de ajuste de silicona
    c.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let i = -70; i <= -45; i += 8) {
      c.fillRect(i, -8, 4, 16);
    }
    for (let i = 45; i <= 70; i += 8) {
      c.fillRect(i, -8, 4, 16);
    }

    // Placa metálica central KOMPA METAL (#B5B8B7)
    c.fillStyle = PALETTE.metal;
    drawRoundedRectPath(c, -38, -12, 76, 24, 6);
    c.fill();

    // Borde brillante de la placa
    c.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    c.lineWidth = 1;
    drawRoundedRectPath(c, -38, -12, 76, 24, 6);
    c.stroke();

    // Grabado en la placa metálica
    c.fillStyle = PALETTE.ink;
    c.font = '900 8.5px Montserrat';
    c.textAlign = 'center';
    c.letterSpacing = '0.08em';
    c.fillText(text, 0, 3.5);

    // Pequeño acento de colección
    c.fillStyle = accentColor;
    c.beginPath();
    c.arc(0, 22, 3, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  /**
   * Bandera oficial de Costa Rica (Azul, Blanco, Rojo doble, Blanco, Azul)
   * acompañada de la tipografía oficial.
   */
  function drawCostaRicaBadge(c, x, y) {
    c.save();
    c.translate(x, y);

    const flagW = 42;
    const flagH = 26;
    const flagX = -85;
    const flagY = -13;

    // Sombra de la bandera
    c.shadowColor = 'rgba(0, 0, 0, 0.4)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 2;

    // Franjas oficiales de Costa Rica (proporciones 1:1:2:1:1)
    const stripeH = flagH / 6;

    // 1. Azul
    c.fillStyle = '#002B7F';
    drawRoundedRectPath(c, flagX, flagY, flagW, flagH, 4);
    c.fill();
    c.shadowColor = 'transparent';

    // 2. Blanco
    c.fillStyle = '#FFFFFF';
    c.fillRect(flagX, flagY + stripeH, flagW, stripeH * 4);

    // 3. Rojo (doble ancho central)
    c.fillStyle = '#CE1126';
    c.fillRect(flagX, flagY + stripeH * 2, flagW, stripeH * 2);

    // Borde sutil de la bandera
    c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    c.lineWidth = 1;
    drawRoundedRectPath(c, flagX, flagY, flagW, flagH, 4);
    c.stroke();

    // Texto COSTA RICA
    c.fillStyle = PALETTE.white;
    c.font = '800 16px Montserrat';
    c.letterSpacing = '0.22em';
    c.textAlign = 'left';
    c.fillText('COSTA RICA', -32, 5);

    c.restore();
  }

  function drawPillBadge(c, x, y, text, bgColor, textColor) {
    c.save();
    c.font = '800 11px Montserrat';
    const metrics = c.measureText(text);
    const w = metrics.width + 28;
    const h = 26;

    c.fillStyle = bgColor;
    drawRoundedRectPath(c, x - w / 2, y - h / 2, w, h, 13);
    c.fill();

    c.fillStyle = textColor;
    c.textAlign = 'center';
    c.letterSpacing = '0.15em';
    c.fillText(text, x, y + 4);
    c.restore();
  }

  function drawAccentDots(c, x, y) {
    const dots = [PALETTE.meta, PALETTE.oceano, PALETTE.rosa, PALETTE.naturaleza, PALETTE.cumbre];
    const spacing = 14;
    const startX = x - ((dots.length - 1) * spacing) / 2;

    dots.forEach((color, i) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(startX + i * spacing, y, 2.5, 0, Math.PI * 2);
      c.fill();
    });
  }

  function drawCurvedRouteDivider(c, x, y) {
    c.save();
    c.beginPath();
    c.moveTo(x - 90, y);
    c.quadraticCurveTo(x - 30, y - 8, x, y);
    c.quadraticCurveTo(x + 30, y + 8, x + 90, y);
    c.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = PALETTE.meta;
    c.beginPath();
    c.arc(x, y, 3.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawSportLateralTicks(c, col1, col2) {
    c.save();
    for (let y = WINDOW_Y + 120; y < WINDOW_Y + WINDOW_H - 120; y += 70) {
      c.fillStyle = (y % 140 === 0) ? col1 : col2;
      // Izquierda
      c.fillRect(28, y, 14, 3);
      // Derecha
      c.fillRect(CANVAS_WIDTH - 42, y, 14, 3);
    }
    c.restore();
  }

  function drawTopographicTicks(c, col1, col2) {
    c.save();
    c.strokeStyle = 'rgba(46, 196, 182, 0.25)';
    c.lineWidth = 1.5;

    // Ondas topográficas en esquinas
    c.beginPath();
    c.arc(WINDOW_X, WINDOW_Y, 80, 0, Math.PI / 2);
    c.arc(WINDOW_X, WINDOW_Y, 120, 0, Math.PI / 2);
    c.stroke();

    c.beginPath();
    c.arc(WINDOW_X + WINDOW_W, WINDOW_Y + WINDOW_H, 80, Math.PI, Math.PI * 1.5);
    c.arc(WINDOW_X + WINDOW_W, WINDOW_Y + WINDOW_H, 120, Math.PI, Math.PI * 1.5);
    c.stroke();

    c.restore();
  }

  function drawRoundedRectPath(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.arcTo(x + width, y, x + width, y + radius, radius);
    c.lineTo(x + width, y + height - radius);
    c.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    c.lineTo(x + radius, y + height);
    c.arcTo(x, y + height, x, y + height - radius, radius);
    c.lineTo(x, y + radius);
    c.arcTo(x, y, x + radius, y, radius);
    c.closePath();
  }

  // ==========================================================================
  // EXPORTACIÓN Y COMPARTIR DIRECTO EN HISTORIAS DE INSTAGRAM
  // ==========================================================================
  btnShareStory.addEventListener('click', async () => {
    // Generar render final de alta fidelidad
    renderCanvas();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Error generando imagen.', '❌');
        return;
      }

      const file = new File([blob], 'kompa-historia.png', { type: 'image/png' });

      // Verificar soporte de la Web Share API para archivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'KOMPA Costa Rica',
            text: '¡Crea tu propia historia! @kompa.cr #kompacr'
          });
          showToast('¡Compartido con éxito!', '🎉');
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Fallo en navigator.share, ejecutando descarga directa:', err);
            downloadBlob(blob, 'kompa-historia.png');
            openFallbackModal();
          }
        }
      } else {
        // En navegadores de escritorio o sin soporte de Web Share con archivos
        downloadBlob(blob, 'kompa-historia.png');
        openFallbackModal();
      }
    }, 'image/png', 1.0);
  });

  btnDownload.addEventListener('click', () => {
    renderCanvas();
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'kompa-historia-1080x1920.png');
        showToast('¡Imagen HD descargada!', '💾');
      }
    }, 'image/png', 1.0);
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function openFallbackModal() {
    fallbackModal.classList.remove('hidden');
    fallbackModal.classList.add('flex');
  }

  btnCloseFallback.addEventListener('click', () => {
    fallbackModal.classList.add('hidden');
    fallbackModal.classList.remove('flex');
  });

  // ==========================================================================
  // GENERADOR DE CÓDIGO QR PARA STANDS Y EVENTOS
  // ==========================================================================
  btnOpenQR.addEventListener('click', () => {
    qrModal.classList.remove('hidden');
    qrModal.classList.add('flex');
  });

  btnCloseQR.addEventListener('click', () => {
    qrModal.classList.add('hidden');
    qrModal.classList.remove('flex');
  });

  qrUrlInput.addEventListener('input', (e) => {
    generateQRCode(e.target.value.trim());
  });

  btnCopyUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(qrUrlInput.value.trim()).then(() => {
      showToast('URL copiada al portapapeles', '📋');
    });
  });

  function generateQRCode(url) {
    qrcodeContainer.innerHTML = '';
    if (!url) return;

    try {
      qrCodeInstance = new QRCode(qrcodeContainer, {
        text: url,
        width: 210,
        height: 210,
        colorDark: '#07111E',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  }

  /**
   * Genera y descarga un cartel imprimible de alta resolución (600x680 px)
   * con el QR oficial, marca KOMPA e instrucciones para eventos.
   */
  btnDownloadQRPNG.addEventListener('click', () => {
    const qrImg = qrcodeContainer.querySelector('img') || qrcodeContainer.querySelector('canvas');
    if (!qrImg) {
      showToast('Generando código QR...', '⏳');
      return;
    }

    const qrCard = document.createElement('canvas');
    qrCard.width = 600;
    qrCard.height = 680;
    const qc = qrCard.getContext('2d');

    // Fondo KOMPA INK
    qc.fillStyle = PALETTE.ink;
    qc.fillRect(0, 0, 600, 680);

    // Borde exterior con gradiente de colección
    qc.lineWidth = 4;
    const borderGrad = qc.createLinearGradient(0, 0, 600, 680);
    borderGrad.addColorStop(0, PALETTE.meta);
    borderGrad.addColorStop(0.5, PALETTE.oceano);
    borderGrad.addColorStop(1, PALETTE.rosa);
    qc.strokeStyle = borderGrad;
    drawRoundedRectPath(qc, 18, 18, 564, 644, 28);
    qc.stroke();

    // Isotipo KOMPA
    drawKompaIsotipo(qc, 300, 75, 46, PALETTE.white, PALETTE.meta, PALETTE.oceano);

    // Encabezado
    qc.textAlign = 'center';
    qc.fillStyle = PALETTE.white;
    qc.font = '900 28px Montserrat';
    qc.letterSpacing = '0.3em';
    qc.fillText('K O M P A', 305, 138);

    qc.fillStyle = PALETTE.sand;
    qc.font = '700 13px Montserrat';
    qc.letterSpacing = '0.2em';
    qc.fillText('CREA TU PROPIA HISTORIA', 300, 168);

    // Tarjeta contenedora blanca para el QR
    qc.fillStyle = '#FFFFFF';
    drawRoundedRectPath(qc, 150, 195, 300, 300, 20);
    qc.fill();

    // Dibujar el QR
    qc.drawImage(qrImg, 175, 220, 250, 250);

    // Instrucción inferior
    qc.fillStyle = PALETTE.white;
    qc.font = '800 16px Montserrat';
    qc.letterSpacing = '0.15em';
    qc.fillText('ESCANEA Y TOMA TU FOTO', 300, 535);

    // URL y @KOMPA.CR
    qc.fillStyle = PALETTE.metal;
    qc.font = '600 12px Montserrat';
    qc.letterSpacing = '0.12em';
    qc.fillText(qrUrlInput.value.trim(), 300, 565);

    // Costa Rica Badge
    drawCostaRicaBadge(qc, 300, 615);

    // Descarga automática
    qrCard.toBlob((blob) => {
      downloadBlob(blob, 'kompa-codigo-qr-oficial.png');
      showToast('Cartel QR descargado listo para imprimir', '🖨️');
    }, 'image/png');
  });

  // ==========================================================================
  // MODAL DE AYUDA / INFORMACIÓN
  // ==========================================================================
  btnOpenHelp.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
    helpModal.classList.add('flex');
  });

  btnCloseHelp.addEventListener('click', () => {
    helpModal.classList.add('hidden');
    helpModal.classList.remove('flex');
  });

  btnUnderstood.addEventListener('click', () => {
    helpModal.classList.add('hidden');
    helpModal.classList.remove('flex');
  });

  // ==========================================================================
  // SONIDOS SINTETIZADOS (WEB AUDIO API)
  // ==========================================================================
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playShutterSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  function playBeepSound(freq, duration) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // ==========================================================================
  // NOTIFICACIONES TOAST Y PLACEHOLDER FOTOGRÁFICO
  // ==========================================================================
  let toastTimeout = null;
  function showToast(message, icon = '✨') {
    toastMessage.textContent = message;
    toastIcon.textContent = icon;

    toastNotification.classList.remove('opacity-0', '-translate-y-2');
    toastNotification.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('opacity-100', 'translate-y-0');
      toastNotification.classList.add('opacity-0', '-translate-y-2');
    }, 2800);
  }

  /**
   * Crea una imagen placeholder artística con gradiente de Costa Rica
   * en caso de que el usuario acceda desde un entorno sin webcam disponible.
   */
  function createPlaceholderPhoto() {
    const temp = document.createElement('canvas');
    temp.width = 960;
    temp.height = 1250;
    const tCtx = temp.getContext('2d');

    // Gradiente al atardecer sobre volcanes de Costa Rica
    const bgGrad = tCtx.createLinearGradient(0, 0, 0, 1250);
    bgGrad.addColorStop(0, '#0F2B48');
    bgGrad.addColorStop(0.5, '#1D4E89');
    bgGrad.addColorStop(0.8, '#F26430');
    bgGrad.addColorStop(1, '#FFD100');
    tCtx.fillStyle = bgGrad;
    tCtx.fillRect(0, 0, 960, 1250);

    // Silueta de montaña
    tCtx.fillStyle = '#07111E';
    tCtx.beginPath();
    tCtx.moveTo(0, 1250);
    tCtx.lineTo(250, 750);
    tCtx.lineTo(500, 920);
    tCtx.lineTo(750, 680);
    tCtx.lineTo(960, 1250);
    tCtx.closePath();
    tCtx.fill();

    // Texto instructivo elegante
    tCtx.textAlign = 'center';
    tCtx.fillStyle = '#FFFFFF';
    tCtx.font = '800 32px Montserrat';
    tCtx.fillText('TU FOTO AQUÍ', 480, 520);

    tCtx.font = '600 18px Montserrat';
    tCtx.fillStyle = PALETTE.sand;
    tCtx.fillText('Toca "Galería" abajo para subir tu foto', 480, 565);

    const placeholder = new Image();
    placeholder.onload = () => {
      userImage = placeholder;
      resetPhotoTransform();
      enterEditMode();
    };
    placeholder.src = temp.toDataURL('image/png');
  }

})();

