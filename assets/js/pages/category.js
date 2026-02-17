/* ==========================================================================
   CATEGORY PAGE LOGIC (INTERCONEXIÓN TOTAL)
   Ubicación: assets/js/pages/category.js
   Misión: Cargar metadatos del catálogo, filtrar obras por categoría y
           cruzar datos con Artistas y Comentarios dinámicamente.
   ========================================================================== */

let currentData = [];

/**
 * Función Principal de Inicialización
 * @param {string} categorySlug - El identificador (slug) de la categoría (ej: 'clasico')
 */
window.initCatalogPage = async function(categorySlug) {
    
    // 1. BLOQUEO DE SEGURIDAD
    if (!categorySlug) return; 

    const gridContainer = document.getElementById('category-grid-container');
    const targetContainer = gridContainer || document.querySelector('.art-grid-5-col');
    if (!targetContainer) return;

    // Inicializar filtros visuales
    initFilters(targetContainer); 

    try {
        console.log(`🚀 Iniciando catálogo interconectado: "${categorySlug}"`);

        // 2. VERIFICACIÓN DE DATALOADER Y CARGA DE DATOS CRUZADOS
        if (typeof DataLoader === 'undefined') {
            console.error("⛔ DataLoader no encontrado.");
            return;
        }

        // Cargamos la información de la categoría y sus obras con artistas ya vinculados
        // Utilizamos el nuevo método relacional del DataLoader
        const data = await DataLoader.getObrasPorCategoria(categorySlug);
        
        if (!data.info) {
            console.warn(`⚠️ No se encontró información para la categoría: ${categorySlug}`);
            return;
        }

        // 3. INYECCIÓN DINÁMICA DE METADATOS (Desde categorias.json)
        // Llenamos el título, curador y descripción directamente del JSON
        const titleEl = document.getElementById('cat-title');
        const descEl = document.getElementById('cat-description');
        const curatorEl = document.getElementById('cat-curator');

        if (titleEl) titleEl.textContent = data.info.nombre;
        if (descEl) descEl.textContent = data.info.descripcion;
        if (curatorEl) curatorEl.textContent = `Curador: ${data.info.curador}`;

        // 4. ACTUALIZAR CONTADOR
        currentData = data.obras;
        const countEl = document.getElementById('obraCount');
        if (countEl) countEl.textContent = `${currentData.length} OBRAS EN EXHIBICIÓN`;

        // 5. RENDERIZAR GRID EDITORIAL
        renderGrid(targetContainer, currentData);

    } catch (error) {
        console.error("🔥 Error cargando catálogo interconectado:", error);
    }
};

/**
 * Renderiza las tarjetas con métricas sociales y descripciones extensas
 */
function renderGrid(container, items) {
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:var(--text-muted);">No hay obras disponibles en esta categoría.</div>';
        return;
    }

    items.forEach((obra, index) => {
        const stats = obra.stats || { vistas: 0, likes: 0, compartidos: 0 };
        const delay = index * 0.05;

        // Ajuste de ruta de imagen para subcarpetas
        let rutaImg = obra.imagen || '';
        if (!rutaImg.startsWith('http') && !rutaImg.startsWith('../../')) {
            rutaImg = '../../' + rutaImg;
        }

        const card = document.createElement('article');
        card.className = 'cat-card cat-card-animated'; 
        card.style.animationDelay = `${delay}s`;

        // Renderizado con descripción extensa y métricas aleatorias/orgánicas
        card.innerHTML = `
            <a href="obra-detalle.html?id=${obra.id}" style="text-decoration:none; color:inherit; display:block;">
                <div class="cat-card-img-wrapper">
                    <img src="${rutaImg}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    ${obra.badge ? `<span class="cat-card-badge">${obra.badge}</span>` : ''}
                    
                    <div class="card-overlay-stats">
                        <span><i class="fa-solid fa-eye"></i> ${stats.vistas.toLocaleString()}</span>
                        <span><i class="fa-solid fa-share-nodes"></i> ${stats.compartidos.toLocaleString()}</span>
                    </div>

                    <button class="card-like-btn" onclick="toggleLike(event, '${obra.id}')">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista_data?.nombre || 'Artista Vértice'}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                    
                    <p class="cat-card-excerpt">${obra.descripcion ? obra.descripcion.substring(0, 80) + '...' : ''}</p>
                    
                    <div class="cat-card-social">
                        <span class="social-item"><i class="fa-solid fa-heart"></i> ${stats.likes.toLocaleString()}</span>
                        <span class="social-item"><i class="fa-solid fa-comment"></i> ${obra.comentarios?.length || Math.floor(Math.random() * 15)}</span>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(card);
    });
}

/**
 * Inicializa los botones de filtrado
 */
function initFilters(container) {
    const buttons = document.querySelectorAll('.filter-pill');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applySorting(btn.getAttribute('data-sort'), container);
        });
    });
}

/**
 * Lógica de Ordenación
 */
function applySorting(criteria, container) {
    if (!currentData.length) return;
    let sorted = [...currentData];

    switch (criteria) {
        case 'precio-asc': 
            sorted.sort((a, b) => (a.precio||0) - (b.precio||0)); 
            break;
        case 'precio-desc': 
            sorted.sort((a, b) => (b.precio||0) - (a.precio||0)); 
            break;
        case 'anio-desc': 
            sorted.sort((a, b) => new Date(b.fecha_publicacion || b.anio) - new Date(a.fecha_publicacion || a.anio)); 
            break;
        case 'anio-asc': 
            sorted.sort((a, b) => new Date(a.fecha_publicacion || a.anio) - new Date(b.fecha_publicacion || b.anio)); 
            break;
        case 'likes-desc':
            sorted.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
            break;
        default: 
            sorted.sort((a, b) => a.id - b.id); 
            break;
    }
    renderGrid(container, sorted);
}

/**
 * Gestión de Likes con Verificación de Usuario
 */
window.toggleLike = function (event, id) {
    event.preventDefault(); 
    event.stopPropagation(); 

    // Verificamos si hay una sesión activa para permitir la interacción
    const usuario = localStorage.getItem("usuario_logueado");

    if (!usuario) {
        const modal = document.getElementById("authRequiredModal");
        if (modal) {
            modal.classList.add("active");
            const closeBtn = document.getElementById("closeAuthModal");
            if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");
        } else {
            window.location.href = "../auth/login.html";
        }
        return;
    }

    const btn = event.currentTarget;
    const icon = btn.querySelector("i");
    btn.classList.toggle('liked');

    if (btn.classList.contains('liked')) {
        icon.className = "fa-solid fa-heart";
    } else {
        icon.className = "fa-regular fa-heart";
    }
};