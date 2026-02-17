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
 * Lanza una notificación flotante en la pantalla (Toast)
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-mensaje ${tipo}`;
    
    const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icono}"></i> ${mensaje}`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * LÓGICA PARA LA PÁGINA DE DETALLE DE OBRA
 */
window.initObraDetalle = async function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    if (typeof DataLoader === 'undefined') {
        console.error("DataLoader no definido. Revisa el orden de los scripts en el HTML.");
        return;
    }

    const obra = await DataLoader.getObraCompleta(id);
    
    if (obra) {
        const base = DataLoader.getBasePath();
        const nombreArtista = obra.artista_data ? obra.artista_data.nombre : "Artista Vértice";
        
        // 1. Información Principal e Identidad
        safeText('obra-titulo', obra.titulo);
        safeText('nombre-artista', nombreArtista); 
        safeText('obra-tecnica', obra.tecnica);
        safeText('obra-anio', obra.anio || 's/f');

        // 2. Narrativa y Contexto (Jerarquía Editorial: Nota del Curador diferenciada)
        safeText('obra-descripcion-texto', obra.descripcion);
        safeText('obra-curaduria', obra.curaduria || "Esta obra es una pieza central de nuestra colección actual.");

        // 3. Ficha Técnica Enriquecida (Valores destacados frente a etiquetas)
        safeText('obra-soporte', obra.tecnica_detalle || obra.tecnica || 'No especificado');
        const dims = obra.dimensiones && obra.dimensiones.trim() !== "" ? obra.dimensiones : 'Dimensiones no disponibles';
        safeText('obra-dimensiones', dims);
        // Formato de referencia estandarizado VRT-0000
        safeText('obra-id-ref', `VRT-${obra.id.toString().padStart(4, '0')}`);

        // 4. Manejo de la Imagen Principal (Efecto suave y micro-perspectiva)
        const imgEl = document.getElementById('obra-imagen-principal');
        if (imgEl) {
            imgEl.style.transition = "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
            imgEl.style.opacity = "0"; 
            imgEl.src = base + obra.imagen;
            imgEl.loading = "lazy";
            imgEl.onload = () => imgEl.style.opacity = "1";
        }

        // 5. Estadísticas de Interacción (Formato de miles: 15.000)
        if (obra.stats) {
            const formatNum = (num) => new Intl.NumberFormat('es-ES').format(num);
            safeText('stat-vistas', formatNum(obra.stats.vistas));
            safeText('stat-likes', formatNum(obra.stats.likes));
            safeText('stat-guardados', formatNum(obra.stats.guardados));
        }

        // 6. LÓGICA DE COLECCIÓN (Diseño sólido en una sola línea)
        const btnColeccion = document.getElementById('btn-coleccion');
        if (btnColeccion) {
            let estaEnColeccion = false; 

            btnColeccion.onclick = () => {
                if (!estaEnColeccion) {
                    estaEnColeccion = true;
                    btnColeccion.textContent = 'ELIMINAR DE MI COLECCIÓN';
                    btnColeccion.classList.add('active');
                    mostrarNotificacion('Obra añadida a tu colección privada', 'success');
                } else {
                    estaEnColeccion = false;
                    btnColeccion.textContent = 'AÑADIR A MI COLECCIÓN PRIVADA';
                    btnColeccion.classList.remove('active');
                    mostrarNotificacion('Obra eliminada de tu colección', 'info');
                }
            };
        }

        // 7. Carga de Obras Relacionadas
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
};

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
 * LÓGICA PARA EL PERFIL DE ARTISTA
 */
window.initArtistaDetalle = async function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    
    const artista = await DataLoader.getArtistaCompleto(id);
    if (artista) {
        const base = DataLoader.getBasePath();
        safeText('nombre-artista', artista.nombre);
        safeText('bio-artista', artista.bio);
        safeText('disciplina-artista', artista.disciplina);
        
        const img = document.getElementById('imagen-artista');
        if(img) {
            img.src = base + artista.imagen;
            img.loading = "lazy";
        }
        
        const banner = document.getElementById('banner-artista');
        if(banner) {
            banner.src = base + (artista.banner || '');
            banner.loading = "lazy";
        }
        
        const worksContainer = document.getElementById('obras-artista-grid');
        if(worksContainer && artista.lista_obras) {
            worksContainer.innerHTML = artista.lista_obras.map(o => `
                <div class="mini-card" onclick="window.location.href='obra-detalle.html?id=${o.id}'">
                    <img src="${base}${o.imagen}" alt="${o.titulo}" loading="lazy">
                </div>
            `).join('');
        }
    }
};

/**
 * LÓGICA PARA EL LISTADO GENERAL DE ARTISTAS
 */
window.initArtistsList = async function() {
    const container = document.getElementById('artists-grid-container');
    if (!container) return;
    
    const artistas = await DataLoader.getArtistas();
    const base = DataLoader.getBasePath();

    container.innerHTML = artistas.map(a => `
        <article class="artist-card" onclick="window.location.href='artista-detalle.html?id=${a.id}'">
            <div class="artist-image">
                <img src="${base}${a.imagen}" alt="${a.nombre}" loading="lazy">
            </div>
            <div class="artist-info">
                <h3>${a.nombre}</h3>
                <p>${a.disciplina}</p>
            </div>
        </article>
    `).join('');
};

/**
 * ENRUTADOR DE INICIALIZACIÓN
 */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('obra-titulo')) {
        window.initObraDetalle();
    }
    
    if (document.getElementById('nombre-artista') && !document.getElementById('obra-titulo')) {
        window.initArtistaDetalle();
    }
    
    if (document.getElementById('artists-grid-container')) {
        window.initArtistsList();
    }
});