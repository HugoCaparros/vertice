import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/pages/home.js
   Descripción: Controlador de la página de inicio interactiva. */

export async function initHomePage() {
    const container = document.getElementById('interactive-container');
    const wrapper = document.getElementById('canvas-wrapper');
    const instructions = document.getElementById('central-instructions');

    if (!container || !wrapper || !instructions) return;

    // Centrar el scroll directamente en el medio del lienzo de 6000px
    const halfCanvas = 3000;
    const halfViewportW = container.clientWidth / 2;
    const halfViewportH = container.clientHeight / 2;

    container.scrollLeft = halfCanvas - halfViewportW;
    container.scrollTop = halfCanvas - halfViewportH;

    try {
        const obras = await DataLoader.getObras();
        if (!obras) return;

        const assetRoot = DataLoader.getAssetPath();
        // Renderizar TODAS las obras con una distribución inteligente para evitar solapamientos
        renderAllObras(obras, wrapper, assetRoot);

        setupDragToScroll(container);
        addReturnToCenterButton(container, instructions);

    } catch (error) {
        console.error("Error inicializando Home Interactiva:", error);
    }
}

/**
 * Centra el scroll del contenedor en el medio del canvas
 */
function centerViewport(container) {
    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;

    container.scrollLeft = (scrollWidth - clientWidth) / 2;
    container.scrollTop = (scrollHeight - clientHeight) / 2;
}

/**
 * Renderiza todas las obras usando un sistema de rejilla estática y balanceada
 */
function renderAllObras(obras, wrapper, assetRoot) {
    const canvasSize = 6000; // px
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // Configuración del grid (800px x 1000px permite obras grandes + margenes)
    const cellW = 850;
    const cellH = 1050; // Margen de 3rem (~48px) incluido en este espacio

    // Generar coordenadas de grid en espiral
    let cells = [];
    const radius = 5; // Suficiente para cubrir las obras

    for (let r = 0; r <= radius; r++) {
        for (let x = -r; x <= r; x++) {
            for (let y = -r; y <= r; y++) {
                if (Math.abs(x) === r || Math.abs(y) === r) {
                    // Evitar el centro (3x3 celdas centrales para las instrucciones)
                    if (Math.abs(x) <= 1 && Math.abs(y) <= 1) continue;
                    cells.push({ col: x, row: y });
                }
            }
        }
    }

    // Ordenar obras de forma determinista para que la Home sea estática
    const sortedObras = [...obras].sort((a, b) => a.id - b.id);

    sortedObras.forEach((obra, index) => {
        if (index >= cells.length) return;

        const cell = cells[index];
        const link = document.createElement('a');
        link.href = `./pages/catalogo/obra-detalle.html?id=${obra.id}`;
        link.className = 'floating-artwork';

        // Tamaños ordenados por ID para un look "curado"
        const sizes = ['size-sm', 'size-md', 'size-lg'];
        const sizeClass = sizes[obra.id % sizes.length];
        link.classList.add(sizeClass);

        // Posicionar en el centro de la celda
        const posX = centerX + (cell.col * cellW);
        const posY = centerY + (cell.row * cellH);

        // Centrar el elemento en su coordenada (restando la mitad de su tamaño aprox)
        // Usamos translate(-50%, -50%) en CSS o calculamos aquí. Mejor aquí para control total.
        link.style.left = `${posX}px`;
        link.style.top = `${posY}px`;
        link.style.transform = `translate(-50%, -50%)`;

        const img = document.createElement('img');
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.8s ease';
        img.onload = () => img.style.opacity = '1';

        let cleanPath = obra.imagen.replace(/^(\.\/|\/|\.\.\/)+/, '');
        img.src = assetRoot + cleanPath;
        img.alt = obra.titulo;
        img.className = 'artwork-img';

        if (img.complete) img.style.opacity = '1';

        link.appendChild(img);
        wrapper.appendChild(link);
    });
}



/**
 * Implementa scroll arrastrando con el ratón (UX mejorada para desktop)
 */
function setupDragToScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let startY;
    let scrollTop;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 1.5; // Velocidad de arrastre ajustada
        const walkY = (y - startY) * 1.5;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
}

/**
 * Añade un botón "VOLVER AL CENTRO" al navbar si estamos en la home
 */
function addReturnToCenterButton(container, target) {
    // Esperar un poco a que el navbar se cargue (ya que es dinámico)
    setTimeout(() => {
        const navRight = document.querySelector('.nav-right');
        if (!navRight || document.getElementById('return-center-btn')) return;

        const btn = document.createElement('a');
        btn.id = 'return-center-btn';
        btn.href = '#';
        btn.className = 'nav-link';
        btn.style.marginRight = 'var(--space-6)';
        btn.textContent = 'VOLVER AL CENTRO';

        btn.onclick = (e) => {
            e.preventDefault();
            target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        };

        // Insertar antes del login/user menu
        navRight.insertBefore(btn, navRight.firstChild);
    }, 1000); // Un segundo suele ser suficiente para el fetch del partial
}

// Global para main.js
window.initHomePage = initHomePage;