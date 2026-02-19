import DataLoader from './dataLoader.js';

/* Ruta: /assets/js/services/auth.js
   Descripción: Servicio de autenticación que gestiona el login, registro y lógica de sesión de usuarios. */

export const AuthService = {

    initialized: false,

    init: () => {
        if (AuthService.initialized) return;
        AuthService.initialized = true;

        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', AuthService.handleLogin);

        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.addEventListener('submit', AuthService.handleRegister);

        AuthService.setupPasswordToggles();
        AuthService.setupCustomSelect();
        AuthService.setupSlidingPanel();
        AuthService.setupRecoveryModal();
    },

    setupCustomSelect: () => {
        const wrapper = document.querySelector('.custom-select-wrapper');
        if (!wrapper) return;

        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelectorAll('.custom-option');
        const selectText = document.getElementById('selectText');
        const hiddenInput = document.getElementById('tipoUsuario');

        trigger.addEventListener('click', (e) => {
            wrapper.classList.toggle('open');
            e.stopPropagation();
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const text = option.textContent;
                const value = option.getAttribute('data-value');
                selectText.textContent = text;
                selectText.style.color = "#000";
                if (hiddenInput) hiddenInput.value = value;
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                wrapper.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
        });
    },

    setupPasswordToggles: () => {
        const icons = document.querySelectorAll('.show-pass-icon');
        icons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                if (input && input.tagName === 'INPUT') {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
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

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('mode') === 'register') {
                container.classList.add("right-panel-active");
            }
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('nombre');
        const emailInput = document.getElementById('emailReg');
        const passInput = document.getElementById('passwordReg');
        const roleInput = document.getElementById('tipoUsuario');
        const btn = e.target.querySelector('button[type="submit"]');

        let errorMsg = document.getElementById('regError');
        let successMsg = document.getElementById('regSuccess');

        if (!errorMsg) {
            errorMsg = document.createElement('p');
            errorMsg.id = 'regError';
            errorMsg.classList.add('error-message');
            e.target.appendChild(errorMsg);
        }
        errorMsg.style.display = 'none';

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

        btn.textContent = "Registrando...";
        btn.disabled = true;

        setTimeout(() => {
            const nuevoUsuario = {
                id: Date.now(),
                nombre: nameInput.value,
                email: emailInput.value,
                password: passInput.value,
                avatar: "../../assets/img/default-avatar.webp",
                rol: rol,
                handle: "@" + nameInput.value.replace(/\s+/g, '').toLowerCase()
            };

            localStorage.setItem('usuario_logueado', JSON.stringify(nuevoUsuario));

            if (successMsg) successMsg.style.display = 'block';
            btn.style.backgroundColor = "var(--color-verde)";
            btn.textContent = "¡Cuenta creada!";

            setTimeout(() => { window.location.href = '../../index.html'; }, 1500);
        }, 1500);
    },

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
            const usuarios = await DataLoader.getUsuarios();
            const usuarioEncontrado = usuarios.find(u =>
                u.email.toLowerCase() === emailInput.value.trim().toLowerCase() &&
                u.password === passInput.value
            );

            if (usuarioEncontrado) {
                localStorage.setItem('usuario_logueado', JSON.stringify(usuarioEncontrado));
                btn.style.backgroundColor = "var(--color-verde)";
                btn.textContent = "¡Bienvenido!";
                setTimeout(() => { window.location.href = '../../index.html'; }, 1000);
            } else {
                throw new Error("Credenciales incorrectas");
            }
        } catch (error) {
            errorMsg.textContent = "❌ Usuario o contraseña incorrectos.";
            errorMsg.style.display = 'block';
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = "";
        }
    },

    setupRecoveryModal: () => {
        const modal = document.getElementById('forgotModal');
        const openLink = document.getElementById('forgotLink');
        const closeBtn = document.getElementById('closeModal');
        const form = document.getElementById('recoveryForm');

        if (!modal || !openLink) return;

        openLink.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });

        const closeModal = () => modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = form.querySelector('button');
                btn.textContent = "Enviando...";
                setTimeout(() => {
                    const success = document.getElementById('resetSuccess');
                    if (success) success.style.display = 'block';
                    btn.textContent = "¡Enviado!";
                    setTimeout(closeModal, 1500);
                }, 1000);
            });
        }
    }
};

export default AuthService;
window.AuthService = AuthService;