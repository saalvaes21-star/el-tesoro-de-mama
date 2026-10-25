(() => {
  "use strict";

  // =========================================================
  // HELPERS
  // =========================================================

  const first = (...selectors) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  };

  const createElement = (tag, className = "", text = "") => {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== "") {
      element.textContent = text;
    }

    return element;
  };

  const clearElement = (element) => {
    if (!element) return;

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };


  // =========================================================
  // DOM
  // =========================================================

  const memoryGrid = first(
    "#memory-grid",
    "#memoryGrid",
    "[data-memory-grid]"
  );

  const museumDialog = first(
    "#museum-dialog",
    "#museumDialog",
    "#memory-dialog",
    "#memoryDialog",
    "dialog"
  );

  const dialogEyebrow = first(
    "#dialog-eyebrow",
    "#dialogEyebrow",
    "[data-dialog-eyebrow]"
  );

  const dialogTitle = first(
    "#dialog-title",
    "#dialogTitle",
    "[data-dialog-title]"
  );

  const dialogBody = first(
    "#dialog-body",
    "#dialogBody",
    "[data-dialog-body]"
  );

  const closeDialogButton = first(
    "#close-dialog",
    "#closeDialog",
    "[data-close-dialog]"
  );

  const openChestButton = first(
    "#open-chest",
    "#openChest",
    "#openChestButton",
    "[data-open-chest]"
  );

  const goldenChest = first(
    "#golden-chest",
    "#goldenChest",
    ".golden-chest",
    "[data-golden-chest]"
  );


  // =========================================================
  // ESTADO
  // =========================================================

  let memories = [];
  let currentMemoryIndex = 0;

  let activeAudio = null;
  let activeAudioButton = null;

  let touchStartX = 0;
  let touchEndX = 0;


  // =========================================================
  // FOTOS DEL TESORO
  // Estas ya existen actualmente.
  // Más adelante podemos añadir recuerdo-01, recuerdo-02, etc.
  // =========================================================

  const treasurePhotos = [
    "assets/images/familia-principal.jpg",
    "assets/images/familia-iglesia.jpg",
    "assets/images/cristian.jpg",
    "assets/images/saul.jpg",
    "assets/images/mariel.jpg",
    "assets/images/sofia.jpg",
    "assets/images/daniela.jpg",
    "assets/images/erandi.jpg",
    "assets/images/alexander.jpg",
    "assets/images/mama-cierre.jpg"
  ];


  // =========================================================
  // PIEZAS CONCEPTUALES
  // =========================================================

  const museumPieces = {
    vida: {
      eyebrow: "ÁLBUM DE RECUERDOS",
      title: "Momentos que merecen volver",
      text:
        "Porque hay momentos que merecen volver a mirarse una y otra vez. " +
        "No por lo perfectos que fueron, sino porque forman parte de una vida compartida."
    },

    egipto: {
      eyebrow: "BASTET",
      title: "Una curiosidad que siempre ha estado ahí",
      text:
        "Porque tu curiosidad por Egipto siempre ha sido parte de ti. " +
        "Una pequeña pieza para guardar ese gusto por descubrir historias, culturas y otros mundos."
    },

    naturaleza: {
      eyebrow: "EL CABALLO",
      title: "Esa sensación de libertad",
      text:
        "Porque la naturaleza, los caballos y esa sensación de libertad también hablan de lo que disfrutas. " +
        "Hay gustos que dicen mucho de una persona sin necesidad de explicarlos."
    },

    lectura: {
      eyebrow: "LOS LIBROS",
      title: "Mundos entre páginas",
      text:
        "Porque entre páginas también se guardan mundos, ideas y momentos de calma. " +
        "Un espacio para recordar todo lo que también puede encontrarse dentro de una historia."
    }
  };


  // =========================================================
  // AUDIO GLOBAL
  // =========================================================

  const stopCurrentAudio = (reset = true) => {
    if (!activeAudio) return;

    activeAudio.pause();

    if (reset) {
      try {
        activeAudio.currentTime = 0;
      } catch (_) {}
    }

    if (activeAudioButton) {
      activeAudioButton.classList.remove("is-playing");

      const original =
        activeAudioButton.dataset.originalLabel;

      if (original) {
        activeAudioButton.textContent = original;
      }
    }

    activeAudio = null;
    activeAudioButton = null;
  };


  const createVoiceButton = (src, label, icon) => {
    if (!src) return null;

    const button = createElement(
      "button",
      "memory-voice-button"
    );

    button.type = "button";

    const originalLabel = `${icon} ${label}`;

    button.textContent = originalLabel;
    button.dataset.originalLabel = originalLabel;

    // Safari/iPhone:
    // usar un elemento AUDIO real dentro del DOM.
    const audio = document.createElement("audio");

    audio.preload = "metadata";
    audio.controls = false;
    audio.playsInline = true;
    audio.muted = false;
    audio.volume = 1;

    audio.setAttribute("playsinline", "");
    audio.setAttribute(
      "aria-hidden",
      "true"
    );

    // Crear una URL absoluta evita problemas de rutas
    // tanto en Live Server como en GitHub Pages.
    audio.src = new URL(
      src,
      window.location.href
    ).href;

    audio.style.display = "none";

    document.body.appendChild(audio);

    audio.load();

    button.addEventListener("click", () => {
      // Si hay otro audio sonando, detenerlo primero.
      if (activeAudio && activeAudio !== audio) {
        stopCurrentAudio(true);
      }

      // Segundo toque sobre el mismo botón = pausa.
      if (
        activeAudio === audio &&
        !audio.paused
      ) {
        audio.pause();

        button.classList.remove("is-playing");
        button.textContent = originalLabel;

        activeAudio = null;
        activeAudioButton = null;

        return;
      }

      activeAudio = audio;
      activeAudioButton = button;

      audio.muted = false;
      audio.volume = 1;

      const playPromise = audio.play();

      if (
        playPromise &&
        typeof playPromise.then === "function"
      ) {
        playPromise
          .then(() => {
            button.classList.add("is-playing");
            button.textContent = "Ⅱ Pausar";

            console.log(
              "▶ Reproduciendo:",
              audio.src
            );
          })
          .catch((error) => {
            console.error(
              "❌ No se pudo reproducir:",
              audio.src,
              error
            );

            button.classList.remove(
              "is-playing"
            );

            button.textContent =
              originalLabel;

            activeAudio = null;
            activeAudioButton = null;
          });
      } else {
        button.classList.add("is-playing");
        button.textContent = "Ⅱ Pausar";
      }
    });

    audio.addEventListener("playing", () => {
      button.classList.add("is-playing");
      button.textContent = "Ⅱ Pausar";
    });

    audio.addEventListener("pause", () => {
      if (!audio.ended) {
        button.classList.remove(
          "is-playing"
        );

        button.textContent =
          originalLabel;
      }
    });

    audio.addEventListener("ended", () => {
      button.classList.remove("is-playing");
      button.textContent = originalLabel;

      try {
        audio.currentTime = 0;
      } catch (_) {}

      if (activeAudio === audio) {
        activeAudio = null;
        activeAudioButton = null;
      }
    });

    audio.addEventListener("error", () => {
      console.error(
        "❌ Error cargando audio:",
        audio.src,
        audio.error
      );

      button.classList.remove("is-playing");
      button.textContent = originalLabel;

      if (activeAudio === audio) {
        activeAudio = null;
        activeAudioButton = null;
      }
    });

    return button;
  };


  const createVoiceSection = (item) => {
    const messageButton = createVoiceButton(
      item.audioMensaje,
      "Un mensaje para ti",
      "▶"
    );

    const birthdayButton = createVoiceButton(
      item.audioCumple,
      "Y ahora sí… feliz cumpleaños",
      "🎂"
    );

    // Alexander o cualquier persona sin audio:
    // no se muestra absolutamente nada.
    if (!messageButton && !birthdayButton) {
      return null;
    }

    const wrapper = createElement(
      "div",
      "memory-extra"
    );

    const toggle = createElement(
      "button",
      "memory-extra-toggle"
    );

    toggle.type = "button";
    toggle.setAttribute(
      "aria-expanded",
      "false"
    );

    const text = createElement(
      "span",
      "memory-extra-text",
      "Hay algo más que queremos decirte"
    );

    const arrow = createElement(
      "span",
      "memory-extra-arrow",
      "↓"
    );

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    toggle.append(text, arrow);

    const content = createElement(
      "div",
      "memory-extra-content"
    );

    const inner = createElement(
      "div",
      "memory-extra-inner"
    );

    const actions = createElement(
      "div",
      "memory-voice-actions"
    );

    if (messageButton) {
      actions.appendChild(messageButton);
    }

    if (birthdayButton) {
      actions.appendChild(birthdayButton);
    }

    inner.appendChild(actions);
    content.appendChild(inner);

    wrapper.append(toggle, content);

    toggle.addEventListener("click", () => {
      const isOpen =
        wrapper.classList.toggle("is-open");

      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    return wrapper;
  };


  // =========================================================
  // FOTOGRAFÍAS
  // =========================================================

  const createPhoto = (
    src,
    alt,
    className = "memory-photo"
  ) => {
    const wrapper = createElement(
      "div",
      className
    );

    if (!src) {
      const placeholder = createElement(
        "div",
        "memory-photo-placeholder",
        "Un recuerdo por guardar"
      );

      wrapper.appendChild(placeholder);
      return wrapper;
    }

    const image = document.createElement("img");

    image.src = src;
    image.alt = alt || "Recuerdo familiar";
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      clearElement(wrapper);

      const placeholder = createElement(
        "div",
        "memory-photo-placeholder",
        "Este recuerdo todavía no está disponible"
      );

      wrapper.appendChild(placeholder);
    });

    wrapper.appendChild(image);

    return wrapper;
  };


  // =========================================================
  // TARJETAS FAMILIARES
  // =========================================================

  const createMemoryCard = (item, index) => {
    const article = createElement(
      "article",
      "memory-card"
    );

    article.dataset.memoryIndex = String(index);

    const photo = createPhoto(
      item.foto,
      `${item.nombre} junto a mamá`
    );

    const content = createElement(
      "div",
      "memory-content"
    );

    const relation = createElement(
      "p",
      "memory-relation",
      item.familiar
    );

    const title = createElement(
      "h3",
      "",
      item.nombre
    );

    const message = createElement(
      "p",
      "memory-message",
      item.mensaje
    );

    content.append(
      relation,
      title,
      message
    );

    const voiceSection =
      createVoiceSection(item);

    if (voiceSection) {
      content.appendChild(voiceSection);
    }

    article.append(
      photo,
      content
    );

    return article;
  };


  const renderMemories = () => {
    if (!memoryGrid) return;

    clearElement(memoryGrid);

    memories.forEach((item, index) => {
      memoryGrid.appendChild(
        createMemoryCard(item, index)
      );
    });
  };


  // =========================================================
  // DIALOG
  // =========================================================

  const openDialog = () => {
    if (!museumDialog) return;

    if (
      typeof museumDialog.showModal === "function"
    ) {
      if (!museumDialog.open) {
        museumDialog.showModal();
      }
    } else {
      museumDialog.classList.add("is-open");
      museumDialog.removeAttribute("hidden");
    }
  };


  const closeDialog = () => {
    stopCurrentAudio(false);

    if (!museumDialog) return;

    if (
      typeof museumDialog.close === "function"
    ) {
      if (museumDialog.open) {
        museumDialog.close();
      }
    } else {
      museumDialog.classList.remove("is-open");
      museumDialog.setAttribute(
        "hidden",
        ""
      );
    }
  };


  // =========================================================
  // VISOR SECUENCIAL DE FELICITACIONES
  // =========================================================

  const renderCurrentMemory = () => {
    if (!dialogBody || !memories.length) return;

    stopCurrentAudio(false);

    const item =
      memories[currentMemoryIndex];

    clearElement(dialogBody);

    if (dialogEyebrow) {
      dialogEyebrow.textContent =
        `${item.familiar} · ${currentMemoryIndex + 1} de ${memories.length}`;
    }

    if (dialogTitle) {
      dialogTitle.textContent =
        item.nombre;
    }

    const viewer = createElement(
      "div",
      "memory-viewer"
    );

    const photo = createPhoto(
      item.foto,
      `${item.nombre} junto a mamá`,
      "viewer-photo"
    );

    const information = createElement(
      "div",
      "viewer-information"
    );

    const relation = createElement(
      "p",
      "memory-relation",
      item.familiar
    );

    const title = createElement(
      "h3",
      "",
      item.nombre
    );

    const message = createElement(
      "p",
      "memory-message",
      item.mensaje
    );

    information.append(
      relation,
      title,
      message
    );

    const voiceSection =
      createVoiceSection(item);

    if (voiceSection) {
      information.appendChild(
        voiceSection
      );
    }

    const navigation = createElement(
      "div",
      "viewer-navigation"
    );

    const previous = createElement(
      "button",
      "viewer-nav-button",
      "← Anterior"
    );

    previous.type = "button";

    const counter = createElement(
      "span",
      "viewer-counter",
      `${currentMemoryIndex + 1} / ${memories.length}`
    );

    const next = createElement(
      "button",
      "viewer-nav-button",
      currentMemoryIndex === memories.length - 1
        ? "Terminar"
        : "Siguiente →"
    );

    next.type = "button";

    previous.disabled =
      currentMemoryIndex === 0;

    previous.addEventListener(
      "click",
      () => {
        if (currentMemoryIndex <= 0) return;

        currentMemoryIndex -= 1;
        renderCurrentMemory();
      }
    );

    next.addEventListener(
      "click",
      () => {
        if (
          currentMemoryIndex >=
          memories.length - 1
        ) {
          closeDialog();

          const finalSection = first(
            "#final",
            "#cierre",
            ".final-section",
            "[data-final-section]"
          );

          if (finalSection) {
            finalSection.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }

          return;
        }

        currentMemoryIndex += 1;
        renderCurrentMemory();
      }
    );

    navigation.append(
      previous,
      counter,
      next
    );

    information.appendChild(navigation);

    viewer.append(
      photo,
      information
    );

    dialogBody.appendChild(viewer);
  };


  const openMemoryViewer = (index = 0) => {
    if (!memories.length) return;

    currentMemoryIndex =
      Math.max(
        0,
        Math.min(
          index,
          memories.length - 1
        )
      );

    renderCurrentMemory();
    openDialog();
  };


  // =========================================================
  // LLUVIA DE RECUERDOS
  // =========================================================

  const showFloatingMemories = () => {
    const oldLayer =
      document.querySelector(
        ".floating-memory-layer"
      );

    if (oldLayer) {
      oldLayer.remove();
    }

    const layer = createElement(
      "div",
      "floating-memory-layer"
    );

    layer.setAttribute(
      "aria-hidden",
      "true"
    );

    treasurePhotos.forEach(
      (src, index) => {
        const frame = createElement(
          "div",
          "floating-memory"
        );

        frame.style.setProperty(
          "--memory-index",
          index
        );

        const image =
          document.createElement("img");

        image.className =
          "floating-photo";

        image.src = src;
        image.alt = "";

        frame.appendChild(image);
        layer.appendChild(frame);
      }
    );

    document.body.appendChild(layer);

    window.setTimeout(
      () => {
        layer.classList.add("is-leaving");
      },
      3200
    );

    window.setTimeout(
      () => {
        layer.remove();
      },
      4300
    );
  };


  // =========================================================
  // REVELACIÓN DEL COFRE
  // =========================================================

  const showFamilyReveal = () => {
    if (!dialogBody) {
      openMemoryViewer(0);
      return;
    }

    stopCurrentAudio(false);
    clearElement(dialogBody);

    if (dialogEyebrow) {
      dialogEyebrow.textContent =
        "EL VERDADERO TESORO";
    }

    if (dialogTitle) {
      dialogTitle.textContent =
        "Siempre ha estado aquí";
    }

    const reveal = createElement(
      "div",
      "family-reveal"
    );

    const photo = createPhoto(
      "assets/images/familia-principal.jpg",
      "Nuestra familia",
      "family-reveal-photo"
    );

    const text = createElement(
      "p",
      "family-reveal-text",
      "Entre tantos recuerdos, lugares y momentos, hay algo que siempre termina siendo lo más importante: las personas con quienes compartimos la vida."
    );

    const button = createElement(
      "button",
      "family-reveal-button",
      "Abrir nuestros recuerdos →"
    );

    button.type = "button";

    button.addEventListener(
      "click",
      () => openMemoryViewer(0)
    );

    reveal.append(
      photo,
      text,
      button
    );

    dialogBody.appendChild(reveal);
    openDialog();
  };


  const startFamilyExperience = () => {
    if (goldenChest) {
      goldenChest.classList.add(
        "is-opening"
      );
    }

    if (openChestButton) {
      openChestButton.disabled = true;
    }

    showFloatingMemories();

    window.setTimeout(
      () => {
        showFamilyReveal();

        if (openChestButton) {
          openChestButton.disabled = false;
        }
      },
      950
    );
  };


  // =========================================================
  // PIEZAS CONCEPTUALES
  // =========================================================

  const openMuseumPiece = (key) => {
    const piece =
      museumPieces[key];

    if (!piece || !dialogBody) return;

    stopCurrentAudio(false);
    clearElement(dialogBody);

    if (dialogEyebrow) {
      dialogEyebrow.textContent =
        piece.eyebrow;
    }

    if (dialogTitle) {
      dialogTitle.textContent =
        piece.title;
    }

    const description = createElement(
      "div",
      "piece-description"
    );

    const paragraph = createElement(
      "p",
      "",
      piece.text
    );

    description.appendChild(paragraph);
    dialogBody.appendChild(description);

    openDialog();
  };


  // =========================================================
  // CARGA DE MEMORIES.JSON
  // =========================================================

  const loadMemories = async () => {
    try {
      const response = await fetch(
        "memories.json",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "memories.json no contiene un arreglo."
        );
      }

      memories = data
        .slice()
        .sort(
          (a, b) =>
            (a.orden ?? 0) -
            (b.orden ?? 0)
        );

      renderMemories();
    } catch (error) {
      console.error(
        "No se pudieron cargar los recuerdos:",
        error
      );

      if (memoryGrid) {
        clearElement(memoryGrid);

        const errorBox = createElement(
          "p",
          "memory-load-error",
          "No pudimos cargar los recuerdos. Recarga la página para intentarlo de nuevo."
        );

        memoryGrid.appendChild(errorBox);
      }
    }
  };


  // =========================================================
  // EVENTOS
  // =========================================================

  if (openChestButton) {
    openChestButton.addEventListener(
      "click",
      startFamilyExperience
    );
  }


  if (closeDialogButton) {
    closeDialogButton.addEventListener(
      "click",
      closeDialog
    );
  }


  if (museumDialog) {
    museumDialog.addEventListener(
      "click",
      (event) => {
        if (
          event.target === museumDialog
        ) {
          closeDialog();
        }
      }
    );

    museumDialog.addEventListener(
      "touchstart",
      (event) => {
        touchStartX =
          event.changedTouches[0]
            ?.screenX ?? 0;
      },
      { passive: true }
    );

    museumDialog.addEventListener(
      "touchend",
      (event) => {
        touchEndX =
          event.changedTouches[0]
            ?.screenX ?? 0;

        const delta =
          touchEndX - touchStartX;

        if (
          Math.abs(delta) < 55 ||
          !memories.length
        ) {
          return;
        }

        if (
          delta < 0 &&
          currentMemoryIndex <
            memories.length - 1
        ) {
          currentMemoryIndex += 1;
          renderCurrentMemory();
        }

        if (
          delta > 0 &&
          currentMemoryIndex > 0
        ) {
          currentMemoryIndex -= 1;
          renderCurrentMemory();
        }
      },
      { passive: true }
    );
  }


  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    }
  );


  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        stopCurrentAudio(false);
      }
    }
  );


  document
    .querySelectorAll(
      "[data-piece], [data-museum-piece]"
    )
    .forEach((element) => {
      element.addEventListener(
        "click",
        () => {
          const key =
            element.dataset.piece ||
            element.dataset.museumPiece;

          openMuseumPiece(key);
        }
      );
    });


  document
    .querySelectorAll(
      "[data-open-memory]"
    )
    .forEach((element) => {
      element.addEventListener(
        "click",
        () => {
          const index =
            Number(
              element.dataset.openMemory
            ) || 0;

          openMemoryViewer(index);
        }
      );
    });


  // =========================================================
  // INICIO
  // =========================================================

  loadMemories();

})();










/* === ALBUM LIGHTBOX V7 START === */

(() => {

  const initAlbumV7 = () => {

    const photos = [
      ...document.querySelectorAll(
        "[data-album-src]"
      )
    ];

    const lightbox =
      document.getElementById(
        "albumLightbox"
      );

    const image =
      document.getElementById(
        "albumLightboxImage"
      );

    const close =
      document.getElementById(
        "albumLightboxClose"
      );

    const prev =
      document.getElementById(
        "albumPrev"
      );

    const next =
      document.getElementById(
        "albumNext"
      );

    const count =
      document.getElementById(
        "albumLightboxCount"
      );

    if (
      !photos.length ||
      !lightbox ||
      !image
    ) {
      return;
    }

    let current = 0;


    const show = (index) => {

      current =
        (index + photos.length)
        % photos.length;

      image.src =
        photos[current]
        .dataset.albumSrc;

      count.textContent =
        `${current + 1} / ${photos.length}`;
    };


    const open = (index) => {

      show(index);

      lightbox.classList.add(
        "is-open-v7"
      );

      lightbox.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.style.overflow =
        "hidden";
    };


    const closeBox = () => {

      lightbox.classList.remove(
        "is-open-v7"
      );

      lightbox.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.style.overflow =
        "";
    };


    photos.forEach(
      (photo, index) => {

        photo.addEventListener(
          "click",
          () => open(index)
        );

      }
    );


    close?.addEventListener(
      "click",
      closeBox
    );


    prev?.addEventListener(
      "click",
      () => show(current - 1)
    );


    next?.addEventListener(
      "click",
      () => show(current + 1)
    );


    lightbox.addEventListener(
      "click",
      (event) => {

        if (
          event.target === lightbox
        ) {
          closeBox();
        }

      }
    );


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          !lightbox.classList.contains(
            "is-open-v7"
          )
        ) {
          return;
        }

        if (event.key === "Escape") {
          closeBox();
        }

        if (event.key === "ArrowLeft") {
          show(current - 1);
        }

        if (event.key === "ArrowRight") {
          show(current + 1);
        }

      }
    );

  };


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initAlbumV7
    );

  } else {

    initAlbumV7();

  }

})();

/* === ALBUM LIGHTBOX V7 END === */


/* === TREASURE EXPERIENCE V9 START === */

(() => {
  "use strict";

  const initTreasureExperienceV9 = () => {

    const treasure =
      document.getElementById("cofre");

    const memories =
      document.getElementById("recuerdos");

    const oldChest =
      document.getElementById("chestPlaceholder");

    const legacyButton =
      document.getElementById("openChestButton");

    if (
      !treasure ||
      !memories ||
      !oldChest
    ) {
      return;
    }


    // --------------------------------------------------------
    // BOTÓN ANTIGUO FUERA DE LA INTERFAZ
    // --------------------------------------------------------

    if (legacyButton) {
      legacyButton.style.display = "none";
      legacyButton.setAttribute(
        "aria-hidden",
        "true"
      );
      legacyButton.tabIndex = -1;
    }


    // --------------------------------------------------------
    // QUITAR LISTENERS ANTIGUOS DEL COFRE
    // --------------------------------------------------------

    const chest =
      oldChest.cloneNode(true);

    oldChest.replaceWith(chest);

    chest.setAttribute(
      "role",
      "button"
    );

    chest.setAttribute(
      "tabindex",
      "0"
    );

    chest.setAttribute(
      "aria-label",
      "Abrir el tesoro familiar"
    );

    chest.setAttribute(
      "aria-expanded",
      "false"
    );


    // --------------------------------------------------------
    // REVELACIÓN FAMILIAR
    // --------------------------------------------------------

    let reveal =
      document.getElementById(
        "familyTreasureRevealV9"
      );

    if (reveal) {
      reveal.remove();
    }

    reveal =
      document.createElement("section");

    reveal.id =
      "familyTreasureRevealV9";

    reveal.className =
      "family-treasure-reveal-v9";

    reveal.setAttribute(
      "aria-hidden",
      "true"
    );

    reveal.innerHTML = `
      <div class="family-reveal-heading-v9">

        <span>
          
        </span>

        <h3>
          Nuestro verdadero tesoro.
        </h3>

        <p>
          No está hecho de objetos.
          Está hecho de personas, momentos
          y de todo lo que hemos vivido juntos.
        </p>

      </div>


      <div class="family-gallery-v9">

        <figure class="family-main-photo-v9">

          <div
            class="family-photo-light-v9"
            aria-hidden="true"
          ></div>

          <img
            src="assets/images/familia-principal.jpg"
            alt="Nuestra familia reunida"
          >

          <figcaption>
            Donde estamos juntos,
            siempre hay algo que guardar.
          </figcaption>

        </figure>


        <figure class="family-secondary-photo-v9">

          <img
            src="assets/images/familia-iglesia.jpg"
            alt="Nuestra familia reunida frente a una iglesia"
          >

          <figcaption>
            Aquí también vive una parte
            de nuestra historia.
          </figcaption>

        </figure>

      </div>


      <div
        class="family-transition-v9"
        aria-hidden="true"
      >
        <span></span>

        <small>
          
        </small>

        <span></span>
      </div>
    `;

    treasure.appendChild(reveal);


    // --------------------------------------------------------
    // TARJETAS DESPUÉS DE LAS DOS FOTOS
    // --------------------------------------------------------

    memories.classList.add(
      "treasure-memories-v9"
    );

    memories.classList.remove(
      "is-visible-v6"
    );

    memories.setAttribute(
      "aria-hidden",
      "true"
    );

    reveal.insertAdjacentElement(
      "afterend",
      memories
    );


    // --------------------------------------------------------
    // LLUVIA DE FOTOS
    // --------------------------------------------------------

    const rainPhotos = [
      "assets/images/cristian.jpg",
      "assets/images/saul.jpg",
      "assets/images/mariel.jpg",
      "assets/images/sofia.jpg",
      "assets/images/daniela.jpg",
      "assets/images/erandi.jpg",
      "assets/images/alexander.jpg"
    ];


    const createRain = () => {

      const previous =
        treasure.querySelector(
          ".treasure-photo-rain-v9"
        );

      if (previous) {
        previous.remove();
      }

      const layer =
        document.createElement("div");

      layer.className =
        "treasure-photo-rain-v9";

      layer.setAttribute(
        "aria-hidden",
        "true"
      );

      rainPhotos.forEach(
        (src, index) => {

          const frame =
            document.createElement("div");

          frame.className =
            `rain-photo-v9 rain-photo-v9-${index + 1}`;

          const img =
            document.createElement("img");

          img.src = src;
          img.alt = "";

          frame.appendChild(img);
          layer.appendChild(frame);
        }
      );

      treasure.appendChild(layer);

      requestAnimationFrame(() => {
        layer.classList.add(
          "is-active-v9"
        );
      });

      window.setTimeout(() => {
        layer.classList.add(
          "is-leaving-v9"
        );
      }, 3000);

      window.setTimeout(() => {
        layer.remove();
      }, 4000);
    };


    // --------------------------------------------------------
    // ABRIR TESORO
    // --------------------------------------------------------

    let opened = false;

    const openTreasure = () => {

      if (opened) {
        reveal.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        return;
      }

      opened = true;

      chest.setAttribute(
        "aria-expanded",
        "true"
      );

      treasure.classList.add(
        "treasure-opened-v9"
      );

      createRain();


      // Primero aparecen las DOS fotos.
      window.setTimeout(() => {

        reveal.classList.add(
          "is-visible-v9"
        );

        reveal.setAttribute(
          "aria-hidden",
          "false"
        );

      }, 850);


      // Nos movemos suavemente a la revelación,
      // PERO NO a las tarjetas.
      window.setTimeout(() => {

        reveal.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }, 1250);


      // Las tarjetas quedan disponibles inmediatamente,
      // pero físicamente están DEBAJO de las dos fotos.
      // No desplazamos la pantalla hacia ellas.
      window.setTimeout(() => {

        memories.classList.add(
          "is-visible-v9"
        );

        memories.setAttribute(
          "aria-hidden",
          "false"
        );

      }, 900);

    };


    chest.addEventListener(
      "click",
      openTreasure
    );

    chest.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openTreasure();
        }

      }
    );

  };


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initTreasureExperienceV9
    );

  } else {

    initTreasureExperienceV9();

  }

})();

/* === TREASURE EXPERIENCE V9 END === */



/* === ALBUM ZOOM FIX V30 START === */

(() => {
  "use strict";

  const initAlbumZoomV30 = () => {

    const photos = [
      ...document.querySelectorAll(
        "#albumMosaic .album-photo"
      )
    ];

    const lightbox =
      document.getElementById("albumLightbox");

    const image =
      document.getElementById("albumLightboxImage");

    const close =
      document.getElementById("albumLightboxClose");

    const prev =
      document.getElementById("albumPrev");

    const next =
      document.getElementById("albumNext");

    const count =
      document.getElementById("albumLightboxCount");

    if (
      !photos.length ||
      !lightbox ||
      !image
    ) {
      console.warn(
        "Album zoom V30: faltan elementos."
      );
      return;
    }

    let current = 0;

    const getSrc = (photo) => {
      return (
        photo.dataset.albumSrc ||
        photo.querySelector("img")?.src ||
        ""
      );
    };

    const show = (index) => {

      current =
        (index + photos.length)
        % photos.length;

      const src =
        getSrc(photos[current]);

      image.src = src;

      if (count) {
        count.textContent =
          `${current + 1} / ${photos.length}`;
      }
    };

    const open = (index) => {

      show(index);

      lightbox.classList.add(
        "is-open-v7"
      );

      lightbox.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.classList.add(
        "album-lightbox-open-v30"
      );
    };

    const closeBox = () => {

      lightbox.classList.remove(
        "is-open-v7"
      );

      lightbox.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.classList.remove(
        "album-lightbox-open-v30"
      );
    };

    photos.forEach(
      (photo, index) => {

        photo.style.cursor = "zoom-in";

        photo.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            open(index);
          }
        );

      }
    );

    close?.addEventListener(
      "click",
      closeBox
    );

    prev?.addEventListener(
      "click",
      () => show(current - 1)
    );

    next?.addEventListener(
      "click",
      () => show(current + 1)
    );

    lightbox.addEventListener(
      "click",
      event => {

        if (event.target === lightbox) {
          closeBox();
        }

      }
    );

    document.addEventListener(
      "keydown",
      event => {

        if (
          !lightbox.classList.contains(
            "is-open-v7"
          )
        ) {
          return;
        }

        if (event.key === "Escape") {
          closeBox();
        }

        if (event.key === "ArrowLeft") {
          show(current - 1);
        }

        if (event.key === "ArrowRight") {
          show(current + 1);
        }

      }
    );

  };

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initAlbumZoomV30
    );

  } else {

    initAlbumZoomV30();

  }

})();

/* === ALBUM ZOOM FIX V30 END === */

