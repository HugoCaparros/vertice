import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/pages/home.js
   Descripción: Controlador de la página de inicio interactiva. */

export async function initHomePage() {
    const container = document.getElementById('interactive-container');
    const wrapper = document.getElementById('canvas-wrapper');
    const instructions = document.getElementById('central-instructions');

    if (!container || !wrapper || !instructions) return;

    // Centrar el scroll inmediatamente
    setTimeout(() => {
        instructions.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    }, 50);

    try {
        const obras = await DataLoader.getObras();
        if (!obras) return;

        // Aumentar el número de obras para llenar más el espacio
        const sampleObras = obras.sort(() => 0.5 - Math.random()).slice(0, 40);

        const assetRoot = DataLoader.getAssetPath();

        // Renderizar obras por "cuadrantes" para asegurar dispersión
        sampleObras.forEach((obra, index) => {
            renderFloatingObra(obra, wrapper, assetRoot, index);
        });

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
 * Renderiza una obra en una posición aleatoria del canvas
 */
function renderFloatingObra(obra, wrapper, assetRoot, index) {
    const link = document.createElement('a');
    link.href = `./pages/catalogo/obra-detalle.html?id=${obra.id}`;
    link.className = 'floating-artwork';

    // Tamaños más grandes para llenar el espacio
    const sizes = ['size-sm', 'size-md', 'size-lg'];
    const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
    link.classList.add(sizeClass);

    // Posicionamiento aleatorio basado en el índice para asegurar cobertura de la "pantalla entera"
    const pos = getRandomPosition(300, 300, 100, 60);
    link.style.left = `${pos.x}vw`;
    link.style.top = `${pos.y}vh`;

    // Rotación leve aleatoria
    const rotation = (Math.random() - 0.5) * 8;
    link.style.transform = `rotate(${rotation}deg)`;

    // Añadir un ligero retraso en la transición para efecto de carga orgánica
    link.style.transitionDelay = `${Math.random() * 0.5}s`;

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