import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/pages/home.js
   Descripción: Controlador de la página de inicio interactiva. */

export async function initHomePage() {
    const container = document.getElementById('interactive-container');
    const wrapper = document.getElementById('canvas-wrapper');
    const instructions = document.getElementById('central-instructions');

    if (!container || !wrapper) return;

    // Centrar el scroll inmediatamente (o casi)
    centerViewport(container);

    try {
        const obras = await DataLoader.getObras();
        if (!obras) return;

        // Seleccionar una muestra aleatoria de obras (ej: 25)
        const sampleObras = obras.sort(() => 0.5 - Math.random()).slice(0, 30);

        const assetRoot = DataLoader.getAssetPath();

        sampleObras.forEach(obra => {
            renderFloatingObra(obra, wrapper, assetRoot);
        });

        setupDragToScroll(container);

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
 * Renderiza una obra en una posición aleatoria del canvas
 */
function renderFloatingObra(obra, wrapper, assetRoot) {
    const link = document.createElement('a');
    link.href = `./pages/catalogo/obra-detalle.html?id=${obra.id}`;
    link.className = 'floating-artwork';

    // Asignar tamaño aleatorio
    const sizes = ['size-sm', 'size-md', 'size-lg'];
    const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
    link.classList.add(sizeClass);

    // Posicionamiento aleatorio evitando el centro exacto
    const pos = getRandomPosition(300, 300, 80, 40); // 300vw x 300vh, margen de 80vw x 40vh en el centro
    link.style.left = `${pos.x}vw`;
    link.style.top = `${pos.y}vh`;

    // Rotación leve aleatoria
    const rotation = (Math.random() - 0.5) * 10;
    link.style.transform = `rotate(${rotation}deg)`;

    const img = document.createElement('img');
    let cleanPath = obra.imagen.replace(/^(\.\/|\/|\.\.\/)+/, '');
    img.src = assetRoot + cleanPath;
    img.alt = obra.titulo;
    img.className = 'artwork-img';
    img.loading = 'lazy';

    img.style.opacity = '0';
    img.style.transition = 'opacity 0.8s ease';
    img.onload = () => img.style.opacity = '1';

    link.appendChild(img);
    wrapper.appendChild(link);
}

/**
 * Genera coordenadas aleatorias evitando un área central protegida
 */
function getRandomPosition(totalW, totalH, skipW, skipH) {
    let x, y;
    const centerX = totalW / 2;
    const centerY = totalH / 2;
    const halfSkipW = skipW / 2;
    const halfSkipH = skipH / 2;

    do {
        x = Math.random() * (totalW - 20) + 10; // Margen de seguridad de 10vw
        y = Math.random() * (totalH - 20) + 10;
    } while (
        x > centerX - halfSkipW && x < centerX + halfSkipW &&
        y > centerY - halfSkipH && y < centerY + halfSkipH
    );

    return { x, y };
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
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
}

// Global para main.js
window.initHomePage = initHomePage;