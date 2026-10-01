/* ── Register Modal ── */

const overlay      = document.getElementById('registerModalOverlay');
const modal        = document.getElementById('registerModal');
const submitBtn    = document.getElementById('regSubmitBtn');
const otpBtn       = document.getElementById('regOtpBtn');
const step1        = document.getElementById('regStep1');
const step2        = document.getElementById('regStep2');

let isOpen = false;

/* ── Open / Close ── */
function openRegisterModal() {
    isOpen = true;
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity       = '1';
    modal.style.opacity         = '1';
    modal.style.transform       = 'scale(1)';
    document.body.style.overflow = 'hidden';
    showStep1();
    resetForm();
    setTimeout(() => document.getElementById('reg-username').focus(), 320);
}

function closeRegisterModal() {
    isOpen = false;
    overlay.style.opacity       = '0';
    modal.style.opacity         = '0';
    modal.style.transform       = 'scale(0.95)';
    setTimeout(() => {
        overlay.style.pointerEvents  = 'none';
        document.body.style.overflow = '';
    }, 300);
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeRegisterModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeRegisterModal(); });

/* ── Step navigation ── */
function showStep1() {
    step1.classList.remove('hidden');
    step2.classList.add('hidden');
}

function showStep2(email) {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    document.getElementById('reg-otp-hint').textContent =
        'เราได้ส่งรหัสยืนยัน 6 หลักไปที่ ' + email + ' แล้ว';
    document.getElementById('reg-otp').value = '';
    setTimeout(() => document.getElementById('reg-otp').focus(), 100);
}

function backToRegForm() {
    showStep1();
    hideErr('reg-err-otp');
    document.getElementById('reg-otp').classList.remove('reg-error');
}

/* ── Helpers ── */
function showErr(errId, msg) {
    const el = document.getElementById(errId);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideErr(errId) {
    const el = document.getElementById(errId);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
}
function markError(inputId, errId, msg) {
    const inp = document.getElementById(inputId);
    if (inp) inp.classList.add('reg-error');
    showErr(errId, msg);
}
function clearError(inputId, errId) {
    const inp = document.getElementById(inputId);
    if (inp) inp.classList.remove('reg-error');
    hideErr(errId);
}

function resetForm() {
    ['reg-username', 'reg-email', 'reg-password', 'reg-otp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.classList.remove('reg-error'); }
    });
    ['reg-err-username', 'reg-err-email', 'reg-err-password', 'reg-err-otp'].forEach(hideErr);
    resetBtns();
}

function resetBtns() {
    submitBtn.disabled   = false;
    submitBtn.innerText  = 'สมัครสมาชิกตอนนี้';
    otpBtn.disabled      = false;
    otpBtn.innerText     = 'ยืนยันและสมัครสมาชิก';
}

const spinnerHTML = '<svg class="animate-spin inline mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

/* ── Clear errors on input ── */
[['reg-username', 'reg-err-username'],
 ['reg-email',    'reg-err-email'],
 ['reg-password', 'reg-err-password'],
 ['reg-otp',      'reg-err-otp']].forEach(([inp, err]) => {
    const el = document.getElementById(inp);
    if (el) el.addEventListener('input', () => clearError(inp, err));
});

/* ── Password toggle ── */
function toggleRegPassword() {
    const inp  = document.getElementById('reg-password');
    const icon = document.getElementById('reg-eye-icon');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    icon.innerHTML = show
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
}

/* ── Step 1: Request OTP ── */
submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    ['reg-username', 'reg-email', 'reg-password'].forEach(id =>
        document.getElementById(id).classList.remove('reg-error'));

    let valid = true;
    if (!username || username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9]+$/.test(username)) {
        markError('reg-username', 'reg-err-username', 'Username ต้องมี 3-30 ตัวอักษร (a-z, A-Z, 0-9 เท่านั้น)');
        valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markError('reg-email', 'reg-err-email', 'กรุณากรอกอีเมลที่ถูกต้อง');
        valid = false;
    }
    if (!password || password.length < 3 || password.length > 32) {
        markError('reg-password', 'reg-err-password', 'รหัสผ่านต้องมี 3-32 ตัวอักษร');
        valid = false;
    }
    if (!valid) return;

    submitBtn.disabled  = true;
    submitBtn.innerHTML = spinnerHTML + 'กำลังสร้างบัญชี...';

    try {
        const res  = await fetch('/auth/request-otp', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'ไม่สามารถส่งอีเมลได้');
        showStep2(email);
    } catch (err) {
        markError('reg-email', 'reg-err-email', err.message || 'ไม่สามารถติดต่อ Server ได้');
    } finally {
        submitBtn.disabled  = false;
        submitBtn.innerText = 'สมัครสมาชิกตอนนี้';
    }
});

/* ── Step 2: Confirm OTP + Register ── */
otpBtn.addEventListener('click', async () => {
    const otp      = document.getElementById('reg-otp').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    document.getElementById('reg-otp').classList.remove('reg-error');

    if (!otp || otp.length < 4) {
        markError('reg-otp', 'reg-err-otp', 'กรุณากรอกรหัส OTP ให้ครบ');
        return;
    }

    otpBtn.disabled  = true;
    otpBtn.innerHTML = spinnerHTML + 'กำลังบันทึกข้อมูล...';

    try {
        const res    = await fetch('/auth/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, otp })
        });
        const result = await res.json();

        if (res.ok && result.success) {
            closeRegisterModal();
            setTimeout(() => {
                if (typeof showToast === 'function') showToast('🎉 สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ ECO');
                if (typeof checkAuth  === 'function') checkAuth();
            }, 350);
        } else {
            markError('reg-otp', 'reg-err-otp', result.message || 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่');
        }
    } catch (err) {
        markError('reg-otp', 'reg-err-otp', err.message || 'ไม่สามารถติดต่อ Server ได้');
    } finally {
        otpBtn.disabled  = false;
        otpBtn.innerText = 'ยืนยันและสมัครสมาชิก';
    }
});
