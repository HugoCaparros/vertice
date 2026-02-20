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
        // Si no hay slug, cargamos todas las obras o el índice
        renderCategoryIndex(gridContainer);
    } else {
        // Si hay slug, inicializamos el detalle de esa categoría
        initCategoryDetail(categorySlug);
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
/**
 * Renderiza el detalle de una categoría específica (ej: abstracto.html)
 */
export async function initCategoryDetail(slugOverride) {
    const container = document.querySelector('.art-grid-5-col') || document.getElementById('category-grid-container');
    if (!container) return;

    // Detectar categoría por el nombre del archivo si no hay param
    let slug = slugOverride;
    if (!slug) {
        const path = window.location.pathname;
        slug = path.split('/').pop().replace('.html', '');
    }

    try {
        const data = await DataLoader.getObrasPorCategoria(slug);
        if (!data.info) {
            console.warn(`No se encontró información para la categoría: ${slug}`);
            return;
        }

        // Inyectar metadatos
        const titleEl = document.querySelector('.category-title') || document.getElementById('cat-title');
        const descEl = document.querySelector('.collection-subtitle') || document.getElementById('cat-description');
        const countEl = document.getElementById('obraCount');

        if (titleEl) titleEl.textContent = data.info.nombre;
        if (descEl) descEl.textContent = data.info.descripcion;
        if (countEl) countEl.textContent = `${data.obras.length} obras en esta colección`;

        currentData = data.obras;
        const favorites = await DataLoader.getFavorites();
        const favoriteIds = favorites.map(f => f.id.toString());

        renderGrid(container, currentData, favoriteIds);
        initSorting(container, favoriteIds);
    } catch (e) { console.error(e); }
}

/**
 * Inicializa los botones de ordenación
 */
function initSorting(container, favoriteIds) {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            const sortType = e.currentTarget.getAttribute('data-sort');

            // UI: Activar píldora
            pills.forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Lógica: Ordenar
            const sorted = sortObras([...currentData], sortType);
            renderGrid(container, sorted, favoriteIds);
        });
    });
}

function sortObras(items, type) {
    switch (type) {
        case 'likes-desc':
            return items.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
        case 'anio-desc':
            return items.sort((a, b) => b.anio - a.anio);
        case 'anio-asc':
            return items.sort((a, b) => a.anio - b.anio);
        case 'precio-asc':
            return items.sort((a, b) => a.precio - b.precio);
        case 'precio-desc':
            return items.sort((a, b) => b.precio - a.precio);
        default:
            return items; // 'default' o 'todo' devuelve el orden original
    }
}

function renderGrid(container, items, favoriteIds) {
    container.innerHTML = '';
    const base = DataLoader.getBasePath();

    container.innerHTML = items.map(obra => {
        const isLiked = favoriteIds.includes(obra.id.toString());
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
window.toggleLike = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const success = await DataLoader.toggleFavorite(id.toString());
    if (!success && window.showAuthModal) window.showAuthModal(DataLoader.getBasePath());

    // Feedback visual
    const btn = event.currentTarget.closest('.card-like-btn');
    if (btn) {
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        if (btn.classList.contains('liked')) {
            icon.classList.replace('fa-regular', 'fa-solid');
        } else {
            icon.classList.replace('fa-solid', 'fa-regular');
        }
    }
};