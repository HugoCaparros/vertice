import DataLoader from '../services/dataLoader.js';

/* ==========================================================================
   CATEGORY PAGE LOGIC (ES6 Module)
   ========================================================================== */

let currentData = [];

/**
 * Inicializa la página de categorías (o el índice de categorías)
 */
export async function initCatalogPage(categorySlug) {
    const gridContainer = document.getElementById('category-grid-container');
    if (!gridContainer) return;

    if (!categorySlug) {
        // Si no hay slug, estamos en la página de índice de categorías
        renderCategoryIndex(gridContainer);
    } else {
        // Si hay slug, estamos en una página de categoría específica (aunque esto ahora se maneja en main.js)
        renderCategoryDetail(gridContainer, categorySlug);
    }
}

/**
 * Renderiza el índice global de categorías (categorias.html)
 */
async function renderCategoryIndex(container) {
    try {
        const categorias = await DataLoader.getCategorias();
        const base = DataLoader.getBasePath();

        container.innerHTML = categorias.map(cat => `
            <div class="category-card" onclick="window.location.href='${cat.slug}.html'">
                <div class="category-card-info">
                    <h3 class="category-title">${cat.nombre}</h3>
                    <p class="category-desc">${cat.descripcion}</p>
                    <div class="category-tags">
                        ${cat.tags_populares.map(t => `<span class="tag">#${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

/**
 * Renderiza el detalle de una categoría específica (ej: abstracto.html)
 */
export async function initCategoryDetail() {
    const container = document.querySelector('.art-grid-5-col') || document.getElementById('category-grid-container');
    if (!container) return;

    // Detectar categoría por el nombre del archivo si no hay param
    const path = window.location.pathname;
    const slug = path.split('/').pop().replace('.html', '');
    
    try {
        const data = await DataLoader.getObrasPorCategoria(slug);
        if (!data.info) return;

        // Inyectar metadatos
        const titleEl = document.getElementById('cat-title');
        const descEl = document.getElementById('cat-description');
        if (titleEl) titleEl.textContent = data.info.nombre;
        if (descEl) descEl.textContent = data.info.descripcion;

        currentData = data.obras;
        renderGrid(container, currentData);
    } catch (e) { console.error(e); }
}

function renderGrid(container, items) {
    container.innerHTML = '';
    const base = DataLoader.getBasePath();

    container.innerHTML = items.map(obra => {
        const isLiked = DataLoader.isFavorite(obra.id.toString());
        return `
            <article class="cat-card">
                <div class="cat-card-img-wrapper">
                    <img src="${base}${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    <button class="card-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(event, '${obra.id}')">
                        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <a href="obra-detalle.html?id=${obra.id}" class="card-overlay-link"></a>
                </div>
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista_data?.nombre || 'Artista Vértice'}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                </div>
            </article>
        `;
    }).join('');
}

// Globales
window.initCatalogPage = initCatalogPage;
window.initCategoryDetail = initCategoryDetail;
window.toggleLike = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const success = DataLoader.toggleFavorite(id.toString());
    if(!success && window.showAuthModal) window.showAuthModal(DataLoader.getBasePath());
    
    // Feedback visual
    const btn = event.currentTarget.closest('.card-like-btn');
    if(btn) {
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        if(btn.classList.contains('liked')) {
            icon.classList.replace('fa-regular', 'fa-solid');
        } else {
            icon.classList.replace('fa-solid', 'fa-regular');
        }
    }
};