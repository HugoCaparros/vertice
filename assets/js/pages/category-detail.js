/* ==========================================================================
   LÓGICA DE DETALLE DE CATEGORÍA (Abstracto, Moderno, etc.)
   Ubicación: assets/js/pages/category_detail.js
   ========================================================================== */

window.initCategoryDetail = async function() {
    const mainContainer = document.querySelector('.category-container');
    const gridContainer = document.getElementById('art-grid');
    const countLabel = document.getElementById('art-count');
    
    if (!mainContainer || !gridContainer) return;

    // 1. Obtener la categoría actual desde el HTML
    const currentCategory = mainContainer.getAttribute('data-category'); // Ej: "Abstracto"

    try {
        // 2. Cargar todas las obras
        const obras = await DataLoader.getData('obras');
        
        // 3. Filtrar por la categoría de la página
        // Asegúrate de que en obras.json la propiedad sea "categoria" o "estilo"
        const filteredObras = obras.filter(obra => 
            obra.categoria === currentCategory || obra.estilo === currentCategory
        );

        // Actualizar contador
        if (countLabel) countLabel.textContent = `Mostrando ${filteredObras.length} obras`;

        // 4. Renderizar Tarjetas
        gridContainer.innerHTML = '';
        
        // Retardo escalonado para la animación fadeInUp
        filteredObras.forEach((obra, index) => {
            const card = document.createElement('a');
            card.href = `obra-detalle.html?id=${obra.id}`;
            card.className = 'cat-card cat-card-animated';
            card.style.animationDelay = `${index * 0.1}s`; // Efecto cascada

            // Formatear precio
            const precio = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(obra.precio);

            card.innerHTML = `
                <div class="cat-card-img-wrapper">
                    ${obra.nuevo ? '<span class="cat-card-badge">NUEVO</span>' : ''}
                    
                    <img src="${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    
                    <button class="card-like-btn" onclick="toggleLike(event, '${obra.id}')">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
                
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                    <div class="info-secondary">
                        <span>${obra.tecnica || 'Técnica Mixta'}</span>
                        <span>•</span>
                        <span>${obra.ano || '2024'}</span>
                    </div>
                    <span class="info-price">${precio}</span>
                </div>
            `;

            gridContainer.appendChild(card);
        });

        if (filteredObras.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay obras disponibles en esta categoría actualmente.</p>';
        }

    } catch (error) {
        console.error("Error cargando obras:", error);
    }
};

// Función auxiliar para el Like (evita que el enlace <a> se active)
window.toggleLike = function(event, id) {
    event.preventDefault(); // No navegar
    event.stopPropagation(); // No propagar al padre
    
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    
    // Toggle visual
    btn.classList.toggle('liked');
    
    if (btn.classList.contains('liked')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        // Aquí podrías guardar en localStorage o BD
        console.log(`Like a la obra ${id}`);
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    }
};