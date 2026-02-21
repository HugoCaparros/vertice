import notifications from '../services/notifications.js';

/* Ruta: /assets/js/pages/details.js
   Descripción: Lógica para la visualización de detalles de obras y artistas, incluyendo carga de grids y efectos visuales. */

/**
 * Utilidad para inyectar texto de forma segura
 */
function safeText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
}

/**
 * LÓGICA PARA LA PÁGINA DE DETALLE DE OBRA
 */
export async function initObraDetalle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const obra = await DataLoader.getObraCompleta(id);

    if (obra) {
        const base = DataLoader.getBasePath();
        const nombreArtista = obra.artista_data ? obra.artista_data.nombre : "Artista Vértice";
        const idArtista = obra.artista_data ? obra.artista_data.id : "";

        // 1. Información Principal e Identidad
        safeText('obra-titulo', obra.titulo);

        const linkArtista = document.getElementById('link-artista-hero');
        if (linkArtista) {
            linkArtista.textContent = nombreArtista;
            if (idArtista) {
                linkArtista.href = `artista-detalle.html?id=${idArtista}`;
            }
        }

        safeText('obra-tecnica-label', obra.tecnica);
        safeText('obra-anio-label', obra.anio || 's/f');
        safeText('obra-categoria-label', obra.categoria_data ? obra.categoria_data.nombre : 'Sin categoría');

        // 2. Narrativa y Contexto
        safeText('obra-descripcion-texto', obra.descripcion);
        safeText('obra-curaduria', obra.curaduria || "Esta obra es una pieza central de nuestra colección actual.");

        // 3. Ficha Técnica
        safeText('obra-soporte', obra.tecnica_detalle || obra.tecnica || 'No especificado');
        const dims = obra.dimensiones && obra.dimensiones.trim() !== "" ? obra.dimensiones : 'Dimensiones no disponibles';
        safeText('obra-dimensiones', dims);
        safeText('obra-id-ref', `VRT-${obra.id.toString().padStart(4, '0')}`);

        // 4. Imagen Principal con Zoom Suave
        const imgEl = document.getElementById('obra-imagen-principal');
        if (imgEl) {
            imgEl.style.transition = "opacity 0.8s ease, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
            imgEl.style.opacity = "0";
            imgEl.src = base + obra.imagen;
            imgEl.onload = () => {
                imgEl.style.opacity = "1";
            };
        }

        // 5. Estadísticas con Toggle de Favorito
        if (obra.stats) {
            const formatNum = (num) => new Intl.NumberFormat('es-ES').format(num);
            safeText('stat-vistas', formatNum(obra.stats.vistas));
            safeText('stat-likes', formatNum(obra.stats.likes));

            // Precio en euros con formato premium
            if (obra.precio) {
                safeText('obra-precio', formatNum(obra.precio) + " €");
            }

            const likesWrapper = document.getElementById('stat-likes-wrapper');
            if (likesWrapper) {
                const heartIcon = likesWrapper.querySelector('i');
                FavoritesManager.syncUI(id, 'obra', { icon: heartIcon });

                likesWrapper.onclick = async () => {
                    await FavoritesManager.toggleObra(id, heartIcon);
                };
            }
        }

        // 6. LÓGICA DE FAVORITOS (Toggle dinámico)
        const btnColeccion = document.getElementById('btn-coleccion');
        if (btnColeccion) {
            const updateBtn = async () => {
                const isFav = await DataLoader.isFavorite(id);
                btnColeccion.textContent = isFav ? 'ELIMINAR DE VÉRTICE' : 'GUARDAR EN VÉRTICE';
                btnColeccion.classList.toggle('active', isFav);
            };

            updateBtn(); // Estado inicial

            btnColeccion.onclick = async () => {
                const heartIcon = document.querySelector('#stat-likes-wrapper i');
                await FavoritesManager.toggleObra(id, heartIcon);
                updateBtn();

                // Efecto visual extra en el botón
                btnColeccion.style.transform = 'scale(0.98)';
                setTimeout(() => btnColeccion.style.transform = '', 100);
            };
        }

        // 7. Carga de Obras Relacionadas (Mejorada)
        cargarRelacionadas(obra.categoria_id, id);

        // 8. Renderizado de Comentarios
        const commentsContainer = document.getElementById('lista-comentarios');
        if (commentsContainer && obra.lista_comentarios) {
            commentsContainer.innerHTML = obra.lista_comentarios.map(c => `
                <div class="comentario">
                    <img src="${base}${c.avatar}" class="user-avatar-small" alt="${c.handle}" loading="lazy">
                    <div class="comentario-content">
                        <strong>${c.handle}</strong>
                        <p>${c.texto}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

/**
 * CARGA DE OBRAS RELACIONADAS (Uniformidad visual y metadatos completos)
 */
async function cargarRelacionadas(categoriaId, actualId) {
    const container = document.getElementById('contenedor-relacionadas');
    if (!container) return;

    const todas = await DataLoader.getObras();
    const base = DataLoader.getBasePath();

    const filtradas = todas
        .filter(o => o.categoria_id === categoriaId && o.id != actualId)
        .slice(0, 4);

    if (filtradas.length > 0) {
        container.innerHTML = filtradas.map(o => `
            <article class="artist-card" onclick="window.location.href='obra-detalle.html?id=${o.id}'">
                <div class="artist-image">
                    <img src="${base}${o.imagen}" alt="${o.titulo}" loading="lazy" style="filter: none; width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="artist-info" style="margin-top: var(--space-4);">
                    <h3 style="font-weight: var(--weight-semibold); margin-bottom: 2px;">${o.titulo}</h3>
                    <p style="font-size: 0.75rem; color: var(--color-gris-medio); text-transform: uppercase; letter-spacing: 1px;">
                        ${o.artista_data ? o.artista_data.nombre : 'Vértice Art'}
                    </p>
                </div>
            </article>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-muted">Explora más obras en nuestra colección principal.</p>';
    }
}

/**
 * LÓGICA PARA EL PERFIL DE ARTISTA (Página pública de detalle de artista)
 */
export async function initArtistaDetalle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const artista = await DataLoader.getArtistaCompleto(id);
    if (artista) {
        const base = DataLoader.getBasePath();
        safeText('nombre-artista', artista.nombre);
        safeText('bio-artista', artista.bio);
        safeText('disciplina-artista', artista.disciplina);

        // Nuevos Campos Enriquecidos
        safeText('nacionalidad-artista', artista.nacionalidad || 'Internacional');
        safeText('estilo-artista', artista.estilo_predominante || artista.disciplina);

        // Contadores con formato premium
        const totalObras = (artista.lista_obras || []).length;
        safeText('count-obras', totalObras);

        const seguidoresNum = artista.seguidores || 0;
        const formatFollowers = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num;
        };
        safeText('count-seguidores', formatFollowers(seguidoresNum));

        const img = document.getElementById('imagen-artista');
        if (img) {
            img.src = base + artista.imagen;
            img.style.opacity = "0";
            img.onload = () => img.style.opacity = "1";
        }

        // Lógica de Seguimiento
        const btnFollow = document.getElementById('follow-btn');
        if (btnFollow) {
            const checkStatus = async () => {
                const isFollowing = await DataLoader.isFollowingArtist(id);
                btnFollow.textContent = isFollowing ? 'SIGUIENDO EN VÉRTICE' : 'SEGUIR EN VÉRTICE';
                btnFollow.classList.toggle('following', isFollowing);
            };
            checkStatus();

            btnFollow.onclick = async () => {
                await FavoritesManager.toggleArtista(id, btnFollow);
            };
        }

        const worksContainer = document.getElementById('obras-artista-grid');
        if (worksContainer && artista.lista_obras) {
            worksContainer.innerHTML = artista.lista_obras.map(o => `
                <div class="mini-card" onclick="window.location.href='obra-detalle.html?id=${o.id}'">
                    <div class="mini-card-img-wrapper">
                        <img src="${base}${o.imagen}" alt="${o.titulo}" loading="lazy">
                        <div class="mini-card-overlay">
                            <span>VER DETALLE</span>
                        </div>
                    </div>
                    <div class="mini-card-info">
                        <h3>${o.titulo}</h3>
                        <p>${o.tecnica}</p>
                    </div>
                </div>
            `).join('');
        }

        // Cargar Artistas Sugeridos
        cargarArtistasSugeridos(id, artista.disciplina);
    }
}

async function cargarArtistasSugeridos(actualId, disciplina) {
    const container = document.getElementById('artistas-sugeridos-container');
    if (!container) return;

    const todos = await DataLoader.getArtistas();
    const base = DataLoader.getBasePath();

    const sugeridos = todos
        .filter(a => a.id != actualId && a.disciplina === disciplina)
        .slice(0, 3);

    if (sugeridos.length > 0) {
        container.innerHTML = sugeridos.map(a => `
            <div class="artist-mini-card" onclick="window.location.href='artista-detalle.html?id=${a.id}'">
                <div class="artist-mini-avatar">
                   <img src="${base}${a.imagen}" alt="${a.nombre}" loading="lazy">
                </div>
                <div class="artist-mini-info">
                   <h4>${a.nombre}</h4>
                   <span>${a.disciplina}</span>
                </div>
            </div>
        `).join('');
    }
}

/**
 * LÓGICA PARA EL LISTADO GENERAL DE ARTISTAS
 */
export async function initArtistsList() {
    const container = document.getElementById('artists-grid-container');
    if (!container) return;

    const artistas = await DataLoader.getArtistas();
    const base = DataLoader.getBasePath();

    container.innerHTML = artistas.map(a => {
        return `
            <article class="artist-card" onclick="window.location.href='artista-detalle.html?id=${a.id}'">
                <div class="artist-card-img-wrapper">
                    <img src="${base}${a.imagen}" alt="${a.nombre}" class="artist-card-img" loading="lazy">
                </div>
                <div class="artist-card-info">
                    <div class="artist-card-header">
                        <h3 class="artist-card-name">${a.nombre}</h3>
                    </div>
                    <p class="artist-card-specialty">${a.disciplina}</p>
                </div>
            </article>
        `;
    }).join("");
}

// Global para eventos inline en artistas
window.toggleArtistFollow = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget.closest('.follow-icon-btn');
    const icon = btn.querySelector('i');

    const isNowFollowing = await FavoritesManager.toggleArtista(id, null, icon);
    btn.classList.toggle('active', isNowFollowing);
};

// Retrocompatibilidad global
window.initObraDetalle = initObraDetalle;
window.initArtistaDetalle = initArtistaDetalle;
window.initArtistsList = initArtistsList;
window.mostrarNotificacion = mostrarNotificacion;