/* ── Login Modal ── */

(function () {
    'use strict';

    /* ── Element refs (resolved after DOM ready) ── */
    let loginOverlay, loginModal, loginBtn;
    let loginIsOpen = false;

    function getEls() {
        loginOverlay = document.getElementById('loginModalOverlay');
        loginModal   = document.getElementById('loginModal');
        loginBtn     = document.getElementById('loginSubmitBtn');
    }

    /* ── Open / Close ── */
    window.openLoginModal = function () {
        getEls();
        if (!loginOverlay || !loginModal) return;
        loginIsOpen = true;
        loginOverlay.style.pointerEvents = 'auto';
        loginOverlay.style.opacity       = '1';
        loginModal.style.opacity         = '1';
        loginModal.style.transform       = 'scale(1)';
        document.body.style.overflow     = 'hidden';
        resetLoginForm();
        setTimeout(() => {
            const u = document.getElementById('login-username');
            if (u) u.focus();
        }, 320);
    };

    window.closeLoginModal = function () {
        getEls();
        if (!loginOverlay || !loginModal) return;
        loginIsOpen = false;
        loginOverlay.style.opacity   = '0';
        loginModal.style.opacity     = '0';
        loginModal.style.transform   = 'scale(0.95)';
        setTimeout(() => {
            if (loginOverlay) loginOverlay.style.pointerEvents = 'none';
            document.body.style.overflow = '';
        }, 300);
    };

    /* ── Cross-modal helpers ── */
    window.switchToRegister = function () {
        window.closeLoginModal();
        setTimeout(() => {
            if (typeof window.openRegisterModal === 'function') window.openRegisterModal();
        }, 320);
    };

    window.switchToLogin = function () {
        if (typeof window.closeRegisterModal === 'function') window.closeRegisterModal();
        setTimeout(() => window.openLoginModal(), 320);
    };

    /* ── Password toggle ── */
    window.toggleLoginPassword = function () {
        const inp  = document.getElementById('login-password');
        const icon = document.getElementById('login-eye-icon');
        if (!inp || !icon) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        icon.innerHTML = show
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
    };

    /* ── Helpers ── */
    function showLoginErr(errId, msg) {
        const el = document.getElementById(errId);
        if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    }
    function hideLoginErr(errId) {
        const el = document.getElementById(errId);
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
    }
    function markLoginError(inputId, errId, msg) {
        const inp = document.getElementById(inputId);
        if (inp) inp.classList.add('reg-error');
        showLoginErr(errId, msg);
    }
    function clearLoginError(inputId, errId) {
        const inp = document.getElementById(inputId);
        if (inp) inp.classList.remove('reg-error');
        hideLoginErr(errId);
    }

    function resetLoginForm() {
        ['login-username', 'login-password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = ''; el.classList.remove('reg-error'); }
        });
        ['login-err-username', 'login-err-password', 'login-err-general'].forEach(hideLoginErr);
        const btn = document.getElementById('loginSubmitBtn');
        if (btn) { btn.disabled = false; btn.innerText = 'เข้าสู่ระบบ'; }
    }

    const loginSpinner = '<svg class="animate-spin inline mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    /* ── Init after DOM ready ── */
    function init() {
        getEls();

        if (!loginOverlay || !loginModal || !loginBtn) {
            console.warn('[login-modal] required elements not found');
            return;
        }

        /* ── Close on overlay click ── */
        loginOverlay.addEventListener('click', function (e) {
            if (e.target === loginOverlay) window.closeLoginModal();
        });

        /* ── Close on Escape ── */
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && loginIsOpen) window.closeLoginModal();
        });

        /* ── Clear errors on input ── */
        [['login-username', 'login-err-username'],
         ['login-password', 'login-err-password']].forEach(function (pair) {
            const el = document.getElementById(pair[0]);
            if (el) el.addEventListener('input', function () { clearLoginError(pair[0], pair[1]); });
        });

        /* ── Submit ── */
        loginBtn.addEventListener('click', async function () {
            const username = (document.getElementById('login-username').value || '').trim();
            const password = (document.getElementById('login-password').value || '');

            /* clear previous errors */
            ['login-username', 'login-password'].forEach(function (id) {
                const el = document.getElementById(id);
                if (el) el.classList.remove('reg-error');
            });
            hideLoginErr('login-err-general');

            /* validate */
            let valid = true;
            if (!username) {
                markLoginError('login-username', 'login-err-username', 'กรุณากรอก Username');
                valid = false;
            }
            if (!password) {
                markLoginError('login-password', 'login-err-password', 'กรุณากรอกรหัสผ่าน');
                valid = false;
            }
            if (!valid) return;

            /* loading state */
            loginBtn.disabled  = true;
            loginBtn.innerHTML = loginSpinner + 'กำลังตรวจสอบ...';

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    window.closeLoginModal();
                    setTimeout(function () {
                        if (typeof window.showToast === 'function') {
                            window.showToast('👋 ยินดีต้อนรับคุณ ' + data.user.username);
                        }
                        if (typeof window.checkAuth === 'function') {
                            window.checkAuth();
                        }
                    }, 350);
                } else {
                    showLoginErr('login-err-general', data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                }
            } catch (err) {
                showLoginErr('login-err-general', 'ไม่สามารถติดต่อ Server ได้ กรุณาลองใหม่');
            } finally {
                loginBtn.disabled  = false;
                loginBtn.innerText = 'เข้าสู่ระบบ';
            }
        });
    }

    /* Run init when DOM is ready */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
