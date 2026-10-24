"use strict";

/* =========================================================
   DOM
========================================================= */

const memoryGrid = document.querySelector("#memoryGrid");

const museumDialog = document.querySelector("#museumDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogEyebrow = document.querySelector("#dialogEyebrow");
const dialogBody = document.querySelector("#dialogBody");
const closeDialogButton = document.querySelector("#closeDialog");

const openChestButton = document.querySelector("#openChestButton");
const goldenChest = document.querySelector("#goldenChest");
const chestPlaceholder = document.querySelector("#chestPlaceholder");

/* =========================================================
   ESTADO
========================================================= */

let memories = [];

let currentMemoryIndex = 0;

let activeAudio = null;
let activeAudioButton = null;

let audioRequestId = 0;

let touchStartX = 0;
let touchEndX = 0;

/* =========================================================
   PIEZAS DEL MUSEO
========================================================= */

const museumPieces = {
  vida: {
    title: "Álbum de recuerdos",
    eyebrow: "UNA PEQUEÑA PARTE DE TI",
    message:
      "Porque hay momentos que merecen volver a mirarse una y otra vez. Este álbum representa las fotografías, los recuerdos y esos pequeños instantes que terminan formando parte de nuestra historia."
  },

  egipto: {
    title: "Bastet",
    eyebrow: "UNA PEQUEÑA PARTE DE TI",
    message:
      "Porque tu curiosidad por Egipto siempre ha sido parte de ti. Su historia, sus símbolos y sus misterios representan esa fascinación tuya por descubrir otras épocas y otros mundos."
  },

  naturaleza: {
    title: "El caballo",
    eyebrow: "UNA PEQUEÑA PARTE DE TI",
    message:
      "Porque la naturaleza, los caballos y esa sensación de libertad también hablan de las cosas que disfrutas y de esos momentos que transmiten tranquilidad."
  },

  lectura: {
    title: "Los libros",
    eyebrow: "UNA PEQUEÑA PARTE DE TI",
    message:
      "Porque entre páginas también se guardan mundos, ideas y momentos de calma. Los libros representan esa parte tuya que disfruta descubrir nuevas historias."
  }
};

/* =========================================================
   UTILIDADES
========================================================= */

function createElement(tag, className = "", text = "") {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function clearElement(element) {
  if (!element) return;

  element.replaceChildren();
}

/* =========================================================
   DIALOG
========================================================= */

function openDialog({
  eyebrow = "UN RECUERDO ESPECIAL",
  title = "Para ti, Mamá",
  content
}) {
  stopCurrentAudio();

  dialogEyebrow.textContent = eyebrow;
  dialogTitle.textContent = title;

  clearElement(dialogBody);

  if (content instanceof Node) {
    dialogBody.appendChild(content);
  } else {
    dialogBody.textContent = String(content ?? "");
  }

  if (!museumDialog.open) {
    museumDialog.showModal();
  }
}

function closeDialog() {
  stopCurrentAudio();

  if (museumDialog.open) {
    museumDialog.close();
  }
}

/* =========================================================
   AUDIO
========================================================= */

function updateAudioButton(button, state) {
  if (!button) return;

  const icon = button.querySelector(".audio-icon");
  const label = button.querySelector(".audio-label");

  if (!icon || !label) return;

  switch (state) {
    case "loading":
      icon.textContent = "⋯";
      label.textContent = "Cargando...";
      break;

    case "playing":
      icon.textContent = "Ⅱ";
      label.textContent = "Pausar mensaje";
      break;

    case "error":
      icon.textContent = "!";
      label.textContent = "Intentar de nuevo";
      break;

    default:
      icon.textContent = "▶";
      label.textContent = "Escuchar mensaje";
  }
}

function stopCurrentAudio() {
  audioRequestId += 1;

  if (activeAudio) {
    activeAudio.pause();

    try {
      activeAudio.currentTime = 0;
    } catch {
      /* metadata todavía no disponible */
    }
  }

  updateAudioButton(activeAudioButton, "idle");

  activeAudio = null;
  activeAudioButton = null;
}

function pauseCurrentAudio() {
  audioRequestId += 1;

  if (activeAudio) {
    activeAudio.pause();
  }

  updateAudioButton(activeAudioButton, "idle");

  activeAudio = null;
  activeAudioButton = null;
}

function createAudioControl(item) {
  const button = createElement("button", "audio-control");

  button.type = "button";

  const icon = createElement(
    "span",
    "audio-icon",
    "▶"
  );

  const label = createElement(
    "span",
    "audio-label",
    "Escuchar mensaje"
  );

  button.append(icon, label);

  if (!item.audio) {
    button.disabled = true;

    icon.textContent = "♡";
    label.textContent = "Audio próximamente";

    return button;
  }

  const audio = document.createElement("audio");

  audio.preload = "metadata";
  audio.src = item.audio;

  button.appendChild(audio);

  button.addEventListener("click", async () => {
    const sameAudio =
      activeAudio === audio &&
      activeAudioButton === button;

    if (sameAudio && !audio.paused) {
      pauseCurrentAudio();
      return;
    }

    stopCurrentAudio();

    activeAudio = audio;
    activeAudioButton = button;

    const request = ++audioRequestId;

    updateAudioButton(button, "loading");

    try {
      const promise = audio.play();

      if (promise !== undefined) {
        await promise;
      }

      if (request !== audioRequestId) {
        audio.pause();
        return;
      }

      updateAudioButton(button, "playing");
    } catch (error) {
      console.warn(
        `No pudo reproducirse ${item.nombre}:`,
        error
      );

      if (request === audioRequestId) {
        activeAudio = null;
        activeAudioButton = null;

        updateAudioButton(button, "error");
      }
    }
  });

  audio.addEventListener("ended", () => {
    if (activeAudio === audio) {
      activeAudio = null;
      activeAudioButton = null;
    }

    updateAudioButton(button, "idle");

    try {
      audio.currentTime = 0;
    } catch {
      /* sin acción */
    }
  });

  return button;
}

/* =========================================================
   FOTOS
========================================================= */

function createPhoto(item, className = "memory-photo") {
  const frame = createElement("div", className);

  if (!item.foto) {
    const placeholder = createElement(
      "div",
      "memory-photo-placeholder",
      "♡"
    );

    frame.appendChild(placeholder);

    return frame;
  }

  const image = document.createElement("img");

  image.src = item.foto;
  image.alt = `Recuerdo de ${item.nombre}`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("error", () => {
    clearElement(frame);

    frame.appendChild(
      createElement(
        "div",
        "memory-photo-placeholder",
        "♡"
      )
    );
  });

  frame.appendChild(image);

  return frame;
}

/* =========================================================
   TARJETAS DE LA SECCIÓN NORMAL
========================================================= */

function createMemoryCard(item) {
  const article = createElement(
    "article",
    "memory-card"
  );

  const photo = createPhoto(item);

  const content = createElement(
    "div",
    "memory-content"
  );

  content.append(
    createElement(
      "span",
      "memory-relation",
      item.familiar
    ),
    createElement(
      "h3",
      "",
      item.nombre
    ),
    createElement(
      "p",
      "",
      item.mensaje
    ),
    createAudioControl(item)
  );

  article.append(photo, content);

  return article;
}

function renderMemories() {
  clearElement(memoryGrid);

  if (!memories.length) {
    memoryGrid.appendChild(
      createElement(
        "div",
        "loading-memory",
        "Todavía no hay recuerdos cargados."
      )
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  memories.forEach((item) => {
    fragment.appendChild(
      createMemoryCard(item)
    );
  });

  memoryGrid.appendChild(fragment);
}

/* =========================================================
   CARGA DEL JSON
========================================================= */

async function loadMemories() {
  try {
    const response = await fetch(
      "./memories.json",
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "memories.json debe contener un arreglo."
      );
    }

    memories = [...data].sort(
      (a, b) =>
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
    );

    renderMemories();
  } catch (error) {
    console.error(error);

    clearElement(memoryGrid);

    const message = createElement(
      "div",
      "loading-memory"
    );

    message.innerHTML = `
      <strong>No pudimos cargar memories.json.</strong>
      <br>
      Usa Live Server para ejecutar el proyecto.
    `;

    memoryGrid.appendChild(message);
  }
}

/* =========================================================
   VISOR DE FELICITACIONES
========================================================= */

function createMemoryViewer(index) {
  const item = memories[index];

  const viewer = createElement(
    "div",
    "memory-viewer"
  );

  const photoArea = createElement(
    "div",
    "viewer-photo-area"
  );

  photoArea.appendChild(
    createPhoto(
      item,
      "viewer-photo"
    )
  );

  const information = createElement(
    "div",
    "viewer-content"
  );

  information.append(
    createElement(
      "span",
      "memory-relation",
      item.familiar
    ),

    createElement(
      "h3",
      "",
      item.nombre
    ),

    createElement(
      "p",
      "",
      item.mensaje
    ),

    createAudioControl(item)
  );

  const controls = createElement(
    "div",
    "viewer-navigation"
  );

  const previous = createElement(
    "button",
    "viewer-arrow",
    "←"
  );

  previous.type = "button";
  previous.setAttribute(
    "aria-label",
    "Recuerdo anterior"
  );

  const position = createElement(
    "span",
    "viewer-position",
    `${index + 1} de ${memories.length}`
  );

  const next = createElement(
    "button",
    "viewer-arrow",
    "→"
  );

  next.type = "button";
  next.setAttribute(
    "aria-label",
    "Siguiente recuerdo"
  );

  previous.disabled = index === 0;

  next.disabled =
    index === memories.length - 1;

  previous.addEventListener(
    "click",
    showPreviousMemory
  );

  next.addEventListener(
    "click",
    showNextMemory
  );

  controls.append(
    previous,
    position,
    next
  );

  viewer.append(
    photoArea,
    information,
    controls
  );

  return viewer;
}

function renderCurrentMemory() {
  stopCurrentAudio();

  clearElement(dialogBody);

  dialogEyebrow.textContent =
    "VOCES DEL CORAZÓN";

  dialogTitle.textContent =
    "Un recuerdo para ti";

  dialogBody.appendChild(
    createMemoryViewer(
      currentMemoryIndex
    )
  );
}

function showPreviousMemory() {
  if (currentMemoryIndex <= 0) return;

  currentMemoryIndex -= 1;

  renderCurrentMemory();
}

function showNextMemory() {
  if (
    currentMemoryIndex >=
    memories.length - 1
  ) {
    return;
  }

  currentMemoryIndex += 1;

  renderCurrentMemory();
}

/* =========================================================
   FOTOGRAFÍAS FLOTANTES
========================================================= */

function createFloatingMemory(item, index) {
  const memory = createElement(
    "div",
    "floating-memory"
  );

  const photo = createPhoto(
    item,
    "floating-photo"
  );

  memory.appendChild(photo);

  const angle =
    index % 2 === 0
      ? -8 - index
      : 7 + index;

  memory.style.setProperty(
    "--memory-rotation",
    `${angle}deg`
  );

  memory.style.setProperty(
    "--memory-delay",
    `${index * 110}ms`
  );

  return memory;
}

function showFloatingMemories() {
  const layer = createElement(
    "div",
    "floating-memory-layer"
  );

  document.body.appendChild(layer);

  const selected = memories.slice(
    0,
    Math.min(memories.length, 7)
  );

  selected.forEach((item, index) => {
    layer.appendChild(
      createFloatingMemory(
        item,
        index
      )
    );
  });

  requestAnimationFrame(() => {
    layer.classList.add("is-visible");
  });

  return layer;
}

/* =========================================================
   REVELADO DEL COFRE
========================================================= */

function animateChest() {
  const target =
    goldenChest &&
    !goldenChest.classList.contains(
      "hidden-model"
    )
      ? goldenChest
      : chestPlaceholder;

  if (!target) return;

  target.animate(
    [
      {
        transform: "scale(1)",
        filter: "brightness(1)"
      },

      {
        transform: "scale(1.045)",
        filter:
          "brightness(1.22) drop-shadow(0 0 20px rgba(226,185,111,.35))"
      },

      {
        transform: "scale(1)",
        filter: "brightness(1)"
      }
    ],
    {
      duration: 900,
      easing: "ease-out"
    }
  );
}

function createRevealMessage() {
  const wrapper = createElement(
    "div",
    "reveal-message"
  );

  const first = createElement(
    "p",
    "reveal-line",
    "Hay regalos que no caben dentro de una caja."
  );

  const second = createElement(
    "p",
    "reveal-line reveal-line-secondary",
    "Este está hecho de voces, fotografías y personas que te quieren."
  );

  wrapper.append(first, second);

  return wrapper;
}

function startFamilyExperience() {
  if (!memories.length) {
    openDialog({
      eyebrow: "EL GRAN REVELADO",
      title: "Este cofre todavía está esperando sus recuerdos",
      content:
        "En cuanto agreguemos las fotografías y mensajes familiares, aparecerán aquí."
    });

    return;
  }

  animateChest();

  const intro = createRevealMessage();

  openDialog({
    eyebrow: "EL GRAN REVELADO",
    title: "Para ti, Mamá",
    content: intro
  });

  setTimeout(() => {
    const floatingLayer =
      showFloatingMemories();

    setTimeout(() => {
      floatingLayer.classList.add(
        "is-leaving"
      );

      setTimeout(() => {
        floatingLayer.remove();

        currentMemoryIndex = 0;

        renderCurrentMemory();
      }, 600);
    }, 2300);
  }, 800);
}

/* =========================================================
   PIEZAS DE MAMÁ
========================================================= */

function openMuseumPiece(pieceKey) {
  const piece =
    museumPieces[pieceKey];

  if (!piece) return;

  const content =
    createElement(
      "p",
      "piece-description",
      piece.message
    );

  openDialog({
    eyebrow: piece.eyebrow,
    title: piece.title,
    content
  });
}

/* =========================================================
   MODELOS 3D
========================================================= */

function configureModelFallback(model) {
  const container =
    model.closest(
      ".collection-model"
    ) ||
    model.closest(
      ".treasure-stage"
    );

  if (!container) return;

  const placeholder =
    container.querySelector(
      ".object-placeholder, .model-placeholder"
    );

  model.addEventListener(
    "load",
    () => {
      model.classList.remove(
        "hidden-model"
      );

      if (placeholder) {
        placeholder.style.display =
          "none";
      }
    }
  );

  model.addEventListener(
    "error",
    () => {
      model.classList.add(
        "hidden-model"
      );

      if (placeholder) {
        placeholder.style.display =
          "";
      }
    }
  );
}

function initializeModels() {
  document
    .querySelectorAll("model-viewer")
    .forEach(
      configureModelFallback
    );
}

/* =========================================================
   SWIPE
========================================================= */

function handleTouchStart(event) {
  touchStartX =
    event.changedTouches[0].screenX;
}

function handleTouchEnd(event) {
  touchEndX =
    event.changedTouches[0].screenX;

  const distance =
    touchEndX - touchStartX;

  const threshold = 55;

  if (
    Math.abs(distance) <
    threshold
  ) {
    return;
  }

  if (distance < 0) {
    showNextMemory();
  } else {
    showPreviousMemory();
  }
}

/* =========================================================
   EVENTOS
========================================================= */

openChestButton?.addEventListener(
  "click",
  startFamilyExperience
);

goldenChest?.addEventListener(
  "click",
  startFamilyExperience
);

document
  .querySelectorAll(".room-button")
  .forEach((button) => {
    button.textContent =
      "Descubrir esta pieza";

    button.addEventListener(
      "click",
      () => {
        openMuseumPiece(
          button.dataset.room
        );
      }
    );
  });

closeDialogButton?.addEventListener(
  "click",
  closeDialog
);

museumDialog?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      museumDialog
    ) {
      closeDialog();
    }
  }
);

museumDialog?.addEventListener(
  "close",
  stopCurrentAudio
);

museumDialog?.addEventListener(
  "touchstart",
  handleTouchStart,
  {
    passive: true
  }
);

museumDialog?.addEventListener(
  "touchend",
  handleTouchEnd,
  {
    passive: true
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (!museumDialog.open) return;

    if (event.key === "ArrowRight") {
      showNextMemory();
    }

    if (event.key === "ArrowLeft") {
      showPreviousMemory();
    }
  }
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      pauseCurrentAudio();
    }
  }
);

/* =========================================================
   INICIO
========================================================= */

async function init() {
  initializeModels();

  await loadMemories();
}

init();