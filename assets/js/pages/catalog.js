import FavoritesManager from '../utils/favoritesManager.js';
import notifications from '../services/notifications.js';

let allObras = []; // Cache local para filtrado rápido

/**
 * Inicializa la página del catálogo general (obras.html).
 */
export async function initGeneralCatalog() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loader-v">Buscando en la galería...</div>';

        // Obtener obras desde el servicio
        const [obras, favoriteIds] = await Promise.all([
            DataLoader.getObras(),
            DataLoader.getFavorites()
        ]);
        allObras = obras;

        const favIds = favoriteIds.map(f => f.id.toString());

        if (!allObras || allObras.length === 0) {
            container.innerHTML = '<p class="error-msg">No se encontraron obras disponibles.</p>';
            return;
        }

        renderArtworks(allObras, container, favIds);
        initFilterEvents(container, favIds);
    } catch (error) {
        console.error("❌ Error inicializando el catálogo:", error);
        notifications.show("Error al conectar con la galería.", "error");
        container.innerHTML = '<p class="error-msg">Hubo un error al cargar las obras.</p>';
    }
}

/**
 * Inicializa los eventos de filtrado y búsqueda
 */
function initFilterEvents(container, favoriteIds) {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sortSelect');

    const applyFilters = () => {
        let filtered = [...allObras];

        // 1. Búsqueda por texto (Título o Artista)
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(o =>
                o.titulo.toLowerCase().includes(query) ||
                (o.artista && o.artista.toLowerCase().includes(query))
            );
        }

        // 2. Filtro por Categoría
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';

        if (activeFilter !== 'all') {
            filtered = filtered.filter(o => o.categoria_id === activeFilter);
        }

        // 3. Ordenación
        if (sortSelect) {
            const sortBy = sortSelect.value;
            if (sortBy === 'precio-asc') {
                filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
            } else if (sortBy === 'precio-desc') {
                filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
            }
        }

        renderArtworks(filtered, container, favoriteIds);

        // Feedback sutil si no hay resultados
        if (filtered.length === 0 && (query || activeFilter !== 'all')) {
            console.log("🔍 No se encontraron resultados para los filtros aplicados.");
        }
    };

    // Eventos
    searchInput?.addEventListener('input', applyFilters);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    sortSelect?.addEventListener('change', applyFilters);
}

/**
 * Renderiza el HTML de las tarjetas de obras.
 */
function renderArtworks(obras, container, favoriteIds) {
    if (obras.length === 0) {
        container.innerHTML = `
            <div class="empty-results">
                <i class="fa-solid fa-cloud-moon"></i>
                <p>No se encontraron obras coincidentes.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = obras.map(obra => {
        const precioFormateado = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(obra.precio || 0);

        const isLiked = favoriteIds.includes(obra.id.toString());

        return `
            <div class="cat-card">
                <div class="cat-card-img-wrapper">
                    ${obra.nuevo ? '<span class="cat-card-badge">NUEVO</span>' : ''}
                    <img src="${DataLoader.getAssetPath()}${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    <button class="card-like-btn ${isLiked ? 'liked' : ''}" onclick="window.toggleLike(event, '${obra.id}')">
                        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista || 'Artista Desconocido'}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                    <div class="info-secondary">
                        <span>${obra.tecnica || 'Técnica Vértice'}</span>
                        <span>•</span>
                        <span>${obra.anio || '2024'}</span>
                    </div>
                    <span class="info-price">${precioFormateado}</span>
                </div>
                <a href="obra-detalle.html?id=${obra.id}" class="card-overlay-link"></a>
            </div>
        `;
    }).join("");
}

// Global para eventos
window.initGeneralCatalog = initGeneralCatalog;
window.toggleLike = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget.closest('.card-like-btn');
    const icon = btn.querySelector('i');

    const isNowLiked = await FavoritesManager.toggleObra(id, icon);
    btn.classList.toggle('liked', isNowLiked);
};
