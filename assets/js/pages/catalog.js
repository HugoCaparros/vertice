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
        allObras = await DataLoader.getObras();
        
        if (!allObras || allObras.length === 0) {
            container.innerHTML = '<p class="error-msg">No se encontraron obras disponibles.</p>';
            return;
        }

        renderArtworks(allObras, container);
        initFilterEvents(container);
    } catch (error) {
        console.error("❌ Error inicializando el catálogo:", error);
        notifications.show("Error al conectar con la galería.", "error");
        container.innerHTML = '<p class="error-msg">Hubo un error al cargar las obras.</p>';
    }
}

/**
 * Inicializa los eventos de filtrado y búsqueda
 */
function initFilterEvents(container) {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sortSelect');

    const applyFilters = () => {
        let filtered = [...allObras];

        // 1. Búsqueda por texto
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(o => 
                o.titulo.toLowerCase().includes(query) || 
                o.artista.toLowerCase().includes(query)
            );
        }

        // 2. Filtro por Categoría
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        if (activeFilter !== 'all') {
            filtered = filtered.filter(o => o.categoria_id === activeFilter);
        }

        // 3. Ordenación
        const sortBy = sortSelect.value;
        if (sortBy === 'precio-asc') {
            filtered.sort((a, b) => a.precio - b.precio);
        } else if (sortBy === 'precio-desc') {
            filtered.sort((a, b) => b.precio - a.precio);
        }

        renderArtworks(filtered, container);

        // Feedback si no hay resultados
        if (filtered.length === 0) {
            notifications.show("No hay obras que coincidan con tu búsqueda.", "info");
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
function renderArtworks(obras, container) {
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

        const isLiked = DataLoader.isFavorite(obra.id.toString());

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
                        <span>${obra.tecnica || 'Técnica Mixta'}</span>
                        <span>•</span>
                        <span>${obra.ano || '2024'}</span>
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
