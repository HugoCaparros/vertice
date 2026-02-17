/* Ruta: /assets/js/services/auth.js
   Descripción: Servicio de autenticación que gestiona el login, registro y lógica de sesión de usuarios. */

const AuthService = {

    initialized: false,

    init: () => {
        if (AuthService.initialized) return;
        AuthService.initialized = true;

        // 1. Detectar formularios
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', AuthService.handleLogin);

        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.addEventListener('submit', AuthService.handleRegister);

        // 2. Inicializar UI Helpers
        AuthService.setupPasswordToggles();
        AuthService.setupCustomSelect();
        AuthService.setupSlidingPanel();
        AuthService.setupRecoveryModal();
    },

    // ========================================================================
    // A. UTILIDADES UI (SELECT, PASSWORDS, SLIDER)
    // ========================================================================

    setupCustomSelect: () => {
        console.log("1. Buscando el wrapper del select...");
        const wrapper = document.querySelector('.custom-select-wrapper');
        if (!wrapper) {
            // No estamos en la página de registro/login o no hay select personalizado.
            return;
        }

        console.log("2. Wrapper encontrado. Configurando eventos...");

        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelectorAll('.custom-option');
        const selectText = document.getElementById('selectText'); // Span del texto visible
        const hiddenInput = document.getElementById('tipoUsuario'); // Input oculto

        if (!trigger) console.error("❌ Falta el trigger (.custom-select-trigger)");
        if (options.length === 0) console.error("❌ No hay opciones (.custom-option)");

        // 1. Abrir/Cerrar
        trigger.addEventListener('click', (e) => {
            wrapper.classList.toggle('open');
            e.stopPropagation();
        });

        // 2. Seleccionar Opción
        options.forEach(option => {
            option.addEventListener('click', () => {
                const text = option.textContent;
                const value = option.getAttribute('data-value');

                // Actualizar UI
                selectText.textContent = text;
                selectText.style.color = "#000"; // Color activo

                // Actualizar lógica (Input oculto)
                if (hiddenInput) hiddenInput.value = value;

                // Estilos de selección
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                // Cerrar
                wrapper.classList.remove('open');
            });
        });

        // 3. Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
        });
    },

    setupPasswordToggles: () => {
        const icons = document.querySelectorAll('.show-pass-icon');
        icons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                // Busca el input anterior (hermano)
                const input = e.target.previousElementSibling;
                if (input && input.tagName === 'INPUT') {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);

                    // Cambiar icono
                    e.target.classList.toggle('fa-eye');
                    e.target.classList.toggle('fa-eye-slash');
                }
            });
        });
    },

    setupSlidingPanel: () => {
        const container = document.getElementById('authContainer');
        const signUpBtn = document.getElementById('signUpBtn');
        const signInBtn = document.getElementById('signInBtn');

        if (container && signUpBtn && signInBtn) {
            signUpBtn.addEventListener('click', () => container.classList.add("right-panel-active"));
            signInBtn.addEventListener('click', () => container.classList.remove("right-panel-active"));

            // Detectar modo en URL (ej: login.html?mode=register)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('mode') === 'register') {
                container.classList.add("right-panel-active");
            }
        }
    },

    // ========================================================================
    // B. LÓGICA DE REGISTRO
    // ========================================================================
    handleRegister: async (e) => {
        e.preventDefault();

        // 1. Obtener elementos
        const nameInput = document.getElementById('nombre');
        const emailInput = document.getElementById('emailReg');
        const passInput = document.getElementById('passwordReg'); // Añadido
        const roleInput = document.getElementById('tipoUsuario'); // El input oculto
        const btn = e.target.querySelector('button[type="submit"]');

        let errorMsg = document.getElementById('regError');
        let successMsg = document.getElementById('regSuccess');

        // Inicializar mensajes
        if (!errorMsg) {
            errorMsg = document.createElement('p');
            errorMsg.id = 'regError';
            errorMsg.classList.add('error-message');
            e.target.appendChild(errorMsg);
        }
        errorMsg.style.display = 'none';

        // 2. Validaciones
        const rol = roleInput ? roleInput.value : '';

        if (!rol) {
            errorMsg.textContent = "⚠️ Por favor selecciona si eres Artista o Coleccionista.";
            errorMsg.style.display = 'block';
            return;
        }

        if (passInput.value.length < 6) {
            errorMsg.textContent = "⚠️ La contraseña debe tener al menos 6 caracteres.";
            errorMsg.style.display = 'block';
            return;
        }

        // 3. Simular Registro
        const originalText = btn.textContent;
        btn.textContent = "Registrando...";
        btn.disabled = true;

        setTimeout(() => {
            // Crear objeto usuario
            const nuevoUsuario = {
                id: Date.now(),
                nombre: nameInput.value,
                email: emailInput.value,
                password: passInput.value, // ¡Guardamos la contraseña!
                avatar: "../../assets/img/default-avatar.jpg",
                rol: rol, // Valor limpio del input hidden (ej: "artista")
                handle: "@" + nameInput.value.replace(/\s+/g, '').toLowerCase()
            };

            // Guardar en localStorage (Simulación de Backend)
            // Nota: En una app real, esto se enviaría a una API.
            // Aquí guardamos sesión directa para simplificar.
            localStorage.setItem('usuario_logueado', JSON.stringify(nuevoUsuario));

            // Éxito
            if (successMsg) successMsg.style.display = 'block';
            btn.style.backgroundColor = "var(--color-verde)";
            btn.textContent = "¡Cuenta creada!";

            // Redirigir
            setTimeout(() => { window.location.href = '../../index.html'; }, 1500);
        }, 1500);
    },

    // ========================================================================
    // C. LÓGICA DE LOGIN
    // ========================================================================
    handleLogin: async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        const btn = e.target.querySelector('button[type="submit"]');
        let errorMsg = document.getElementById('loginError');

        if (!errorMsg) {
            errorMsg = document.createElement('p');
            errorMsg.id = 'loginError';
            errorMsg.classList.add('error-message');
            e.target.appendChild(errorMsg);
        }
        errorMsg.style.display = 'none';

        const originalText = btn.textContent;
        btn.textContent = "Verificando...";
        btn.disabled = true;

        try {
            // Verificar si DataLoader existe
            if (typeof DataLoader === 'undefined') throw new Error("Error del sistema: DataLoader no cargado");

            // Obtener usuarios del JSON
            const usuarios = await DataLoader.getUsuarios();

            // Buscar coincidencia
            const usuarioEncontrado = usuarios.find(u =>
                u.email.toLowerCase() === emailInput.value.trim().toLowerCase() &&
                u.password === passInput.value
            );

            if (usuarioEncontrado) {
                // Login exitoso
                localStorage.setItem('usuario_logueado', JSON.stringify(usuarioEncontrado));
                btn.style.backgroundColor = "var(--color-verde)";
                btn.textContent = "¡Bienvenido!";
                setTimeout(() => { window.location.href = '../../index.html'; }, 1000);
            } else {
                throw new Error("Credenciales incorrectas");
            }
        } catch (error) {
            // Login fallido
            errorMsg.textContent = "❌ Usuario o contraseña incorrectos.";
            errorMsg.style.display = 'block';
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = "";
        }
    },

    // ========================================================================
    // D. MODAL DE RECUPERACIÓN
    // ========================================================================
    setupRecoveryModal: () => {
        const modal = document.getElementById('forgotModal');
        const openLink = document.getElementById('forgotLink');
        const closeBtn = document.getElementById('closeModal');
        const form = document.getElementById('recoveryForm');

        if (!modal || !openLink) return;

        // Abrir
        openLink.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });

        // Cerrar
        const closeModal = () => modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // Submit del formulario de recuperación
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Aquí iría la lógica de resetear contraseña
                const btn = form.querySelector('button');
                btn.textContent = "Enviando...";
                setTimeout(() => {
                    document.getElementById('resetSuccess').style.display = 'block';
                    btn.textContent = "¡Enviado!";
                    setTimeout(closeModal, 1500);
                }, 1000);
            });
        }
    }
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', AuthService.init);