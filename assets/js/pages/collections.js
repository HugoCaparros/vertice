/* Ruta: /assets/js/pages/collections.js
   Descripción: Lógica para la carga y renderizado de colecciones en mis-colecciones.html */

document.addEventListener('DOMContentLoaded', initCollections);

async function initCollections() {
    const container = document.getElementById('collections-grid');
    if (!container) return;

    // Obtener colecciones desde DataLoader (o fetch directo si no existe el método)
    let colecciones = [];
    try {
        if (typeof DataLoader !== 'undefined' && DataLoader.getColecciones) {
            colecciones = await DataLoader.getColecciones();
        } else {
            const base = typeof DataLoader !== 'undefined' ? DataLoader.getBasePath() : '../../assets/data/';
            const response = await fetch(`${base}colecciones.json`);
            colecciones = await response.json();
        }
    } catch (error) {
        console.error("Error cargando colecciones:", error);
        container.innerHTML = '<p class="error-msg">No se pudieron cargar las colecciones en este momento.</p>';
        return;
    }

    if (colecciones.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay colecciones disponibles todavía.</p>';
        return;
    }

    const base = typeof DataLoader !== 'undefined' ? DataLoader.getBasePath() : '/';

    container.innerHTML = colecciones.map(c => `
        <article class="collection-card" onclick="window.location.href='../catalogo/obras.html?coleccion=${c.id}'">
            <div class="collection-img-wrapper">
                <img src="${base}${c.imagen_portada}" alt="${c.titulo}" loading="lazy">
            </div>
            <div class="collection-content">
                <div class="collection-meta">
                    <span>${c.obras_ids.length} OBRAS</span>
                    <span>${new Date(c.fecha_creacion).getFullYear()}</span>
                </div>
                <h3 class="collection-title">${c.titulo}</h3>
                <p class="collection-desc">${c.descripcion}</p>
            </div>
            <div class="collection-footer">
                <img src="${base}${c.artista_imagen}" class="curator-avatar" alt="${c.artista_nombre}">
                <div class="curator-info">Curada por ${c.artista_nombre}</div>
            </div>
        </article>
    `).join('');
}
