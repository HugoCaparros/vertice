/* Ruta: /assets/js/pages/catalog.js
   Descripción: Lógica del catálogo y categorías, incluyendo filtros, ordenamiento y renderizado del grid de obras. */

let currentCategoryObras = [];

// A. PÁGINA DE CATEGORÍA ESPECÍFICA (Ej: initCategoryPage('abstracto'))
window.initCategoryPage = async function (categoriaFiltro) {
  const grid = document.getElementById("category-grid");
  const sortSelect = document.getElementById("sortSelect");
  const countLabel = document.getElementById("obras-count");

  if (!grid) return;

  try {
    // Usamos getData('obras') que es el estándar de tu DataLoader
    const obras = await DataLoader.getObras();
    // Filtrado insensible a mayúsculas/minúsculas
    currentCategoryObras = obras.filter(
      (o) =>
        (o.categoria || "").toLowerCase() === categoriaFiltro.toLowerCase() ||
        (o.estilo || "").toLowerCase() === categoriaFiltro.toLowerCase(),
    );

    // Actualizar contador
    if (countLabel)
      countLabel.textContent = `MOSTRANDO ${currentCategoryObras.length} OBRAS`;

    // Renderizado inicial
    renderGrid(currentCategoryObras, grid);

    // Evento de ordenamiento
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        sortAndRender(e.target.value, grid);
      });
    }
  } catch (error) {
    console.error("Error cargando categoría:", error);
  }
};

/* --- LÓGICA DE ORDENAMIENTO --- */
function sortAndRender(criterio, gridContainer) {
  // Creamos una copia para no alterar el array original desordenado
  const obrasOrdenadas = sortObras([...currentCategoryObras], criterio);
  renderGrid(obrasOrdenadas, gridContainer);
}

function sortObras(obras, criterio) {
  switch (criterio) {
    case "precio-asc":
      return obras.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    case "precio-desc":
      return obras.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    case "anio-desc":
      return obras.sort((a, b) => (b.ano || 0) - (a.ano || 0)); // Nota: 'ano' según tu JSON
    case "anio-asc":
      return obras.sort((a, b) => (a.ano || 0) - (b.ano || 0));
    default:
      return obras; // Relevancia / Default
  }
}

/* --- LÓGICA DE RENDERIZADO (Adaptada al CSS Editorial) --- */
function renderGrid(obras, container) {
  container.innerHTML = "";

  if (obras.length === 0) {
    container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <h3 style="font-family: var(--font-serif); margin-bottom: 10px;">Colección no disponible</h3>
                <p style="color: var(--text-muted);">No hemos encontrado obras en esta categoría.</p>
            </div>`;
    return;
  }

  const html = obras
    .map((obra, index) => {
      // Retardo para efecto cascada
      const delay = index * 0.05;
      const precio = formatPrice(obra.precio);

      // IMPORTANTE:
      // 1. Usamos <a> como contenedor directo (sin div wrapper) para el Grid CSS.
      // 2. Usamos las clases exactas de category.css (cat-card-artist, cat-card-title, etc).
      return `
            <a href="obra-detalle.html?id=${obra.id}" 
               class="cat-card cat-card-animated" 
               style="animation-delay: ${delay}s">
                
                <div class="cat-card-img-wrapper">
                    ${obra.nuevo ? '<span class="cat-card-badge">NUEVO</span>' : ""}
                    
                    <img src="${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    
                    <button class="card-like-btn" onclick="toggleLike(event, '${obra.id}')">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
                
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista || obra.artista_nombre}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                    
                    <div class="info-secondary">
                        <span>${obra.tecnica || "Mixta"}</span>
                        <span>•</span>
                        <span>${obra.ano || "2024"}</span>
                    </div>
                    
                    <span class="info-price">${precio}</span>
                </div>
            </a>
        `;
    })
    .join("");

  container.innerHTML = html;
}

function formatPrice(price) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/* --- GESTIÓN DE LIKES (Con Seguridad) --- */
window.toggleLike = function (event, id) {
  event.preventDefault(); // No abrir el detalle de la obra
  event.stopPropagation(); // No propagar el click

  // 1. SEGURIDAD: Verificar si está logueado
  const usuario = localStorage.getItem("usuario_logueado");

  if (!usuario) {
    // Si no está logueado, mostrar Modal de "Contenido Exclusivo"
    const modal = document.getElementById("authRequiredModal");
    if (modal) {
      modal.classList.add("active");

      // Eventos para cerrar el modal
      const closeBtn = document.getElementById("closeAuthModal");
      if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove("active");
      };
    } else {
      // Fallback si no hay modal: redirigir al login
      window.location.href = "../auth/login.html";
    }
    return;
  }

  // 2. ACCIÓN DE LIKE (Visual)
  const btn = event.currentTarget;
  const icon = btn.querySelector("i");
  btn.classList.toggle("liked");

  if (btn.classList.contains("liked")) {
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
    // Aquí podrías guardar en LocalStorage: saveLike(id);
  } else {
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
  }
};
