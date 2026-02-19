import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/pages/home.js
   Descripción: Controlador de la página de inicio que gestiona el grid interactivo de previsualización. */

export async function initHomePage() {
    const gridContainer = document.getElementById('art-grid');

    if (!gridContainer) return;

    try {
        const obras = await DataLoader.getObras();

        const renderCategory = (categoria) => {
            const slots = gridContainer.querySelectorAll('.art-slot');
            const assetRoot = DataLoader.getAssetPath();

            const normalize = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const targetCat = normalize(categoria);

            const filteredObras = categoria 
                ? obras.filter(o => normalize(o.categoria_id) === targetCat || normalize(o.estilo) === targetCat)
                : obras;

            const randomSelection = filteredObras.sort(() => 0.5 - Math.random()).slice(0, 5);

            slots.forEach((slot, index) => {
                const obra = randomSelection[index];
                slot.innerHTML = '';
                slot.style.backgroundColor = '#f4f4f4'; 

                if (obra) {
                    let cleanPath = obra.imagen.replace(/^(\.\/|\/|\.\.\/)+/, '');
                    let imagePath = assetRoot + cleanPath;

                    const link = document.createElement('a');
                    link.href = `./pages/catalogo/obra-detalle.html?id=${obra.id}`; 
                    
                    link.className = 'art-grid-link';
                    link.style.display = 'block';
                    link.style.width = '100%';
                    link.style.height = '100%';

                    const img = document.createElement('img');
                    img.src = imagePath;
                    img.alt = obra.titulo;
                    
                    img.loading = 'lazy';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.opacity = '0'; 
                    img.style.transition = 'opacity 0.6s ease';

                    img.onload = () => { img.style.opacity = '1'; };
                    img.onerror = () => { 
                        console.error("No se pudo cargar la imagen en:", imagePath);
                        slot.style.backgroundColor = '#e0e0e0'; 
                    };

                    link.appendChild(img);
                    slot.appendChild(link);
                }
            });
        };

        const triggers = document.querySelectorAll('.cat-trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', () => {
                const category = trigger.getAttribute('data-cat');
                renderCategory(category);
            });
        });

        renderCategory('moderno');

    } catch (error) {
        console.error("Error inicializando Home Page:", error);
    }
}

// Global para main.js
window.initHomePage = initHomePage;