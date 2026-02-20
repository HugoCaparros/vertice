import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/pages/home.js
   Descripción: Controlador de la página de inicio interactiva. */

export async function initHomePage() {
    const container = document.getElementById('interactive-container');
    const wrapper = document.getElementById('canvas-wrapper');
    const instructions = document.getElementById('central-instructions');

    if (!container || !wrapper || !instructions) return;

    // 1. Ocultar y centrar instantáneamente incluso antes del renderizado pesado
    container.style.opacity = '0';

    const canvasSize = 6000;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    const snapCenter = () => {
        const viewportW = container.clientWidth || window.innerWidth;
        const viewportH = container.clientHeight || window.innerHeight;
        container.scrollLeft = centerX - (viewportW / 2);
        container.scrollTop = centerY - (viewportH / 2);
    };

    // Primer snap inmediato
    snapCenter();

    try {
        const obras = await DataLoader.getObras();
        if (!obras) return;

        const assetRoot = DataLoader.getAssetPath();
        renderAllObras(obras, wrapper, assetRoot);

        // Segundo snap tras el renderizado para asegurar posición final
        setTimeout(() => {
            snapCenter();
            container.style.opacity = '1';
        }, 150);

        setupDragToScroll(container);
        addReturnToCenterButton(container, instructions);

    } catch (error) {
        console.error("Error inicializando Home Interactiva:", error);
        container.style.opacity = '1';
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
    const canvasSize = 6000;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // Configuración del grid: Celdas más pequeñas para mayor densidad
    const cellW = 500;
    const cellH = 650;

    // Generar coordenadas de grid en todas direcciones (X e Y positivos y negativos)
    let cells = [];
    const radius = 8; // Aumentamos el radio para cubrir más área del canvas 6000x6000px

    for (let r = 0; r <= radius; r++) {
        for (let x = -r; x <= r; x++) {
            for (let y = -r; y <= r; y++) {
                // Solo celdas en el "anillo" actual r
                if (Math.abs(x) === r || Math.abs(y) === r) {
                    // Evitar el centro exacto donde están las instrucciones (espacio de 2x2 celdas aprox)
                    if (Math.abs(x) <= 1 && Math.abs(y) <= 1) continue;
                    cells.push({ col: x, row: y });
                }
            }
        }
    }

    // Ordenar las celdas por distancia real (diagonal) al centro para una expansión radial perfecta
    cells.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.col * cellW, 2) + Math.pow(a.row * cellH, 2));
        const distB = Math.sqrt(Math.pow(b.col * cellW, 2) + Math.pow(b.row * cellH, 2));
        return distA - distB;
    });

    // Barajar ligeramente las celdas dentro de grupos de distancia similar 
    // para evitar un aspecto demasiado "perfecto" o robótico
    for (let i = 0; i < cells.length - 1; i += 3) {
        if (Math.random() > 0.5) {
            [cells[i], cells[i + 1]] = [cells[i + 1], cells[i]];
        }
    }

    // Usar todas las obras disponibles
    const sortedObras = [...obras].sort((a, b) => a.id - b.id);

    sortedObras.forEach((obra, index) => {
        if (index >= cells.length) return;

        const cell = cells[index];
        const link = document.createElement('a');
        link.href = `./pages/catalogo/obra-detalle.html?id=${obra.id}`;
        link.className = 'floating-artwork';

        // Tamaños variados
        const sizes = ['size-sm', 'size-md', 'size-lg'];
        const sizeClass = sizes[index % sizes.length];
        link.classList.add(sizeClass);

        // Posición calculada respecto al centro del canvas
        const posX = centerX + (cell.col * cellW);
        const posY = centerY + (cell.row * cellH);

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