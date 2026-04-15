let currentUsername = null;

async function checkAuth() {
    const guestLinks    = document.getElementById('guestLinks');
    const userLinks     = document.getElementById('userLinks');
    const displayUsername = document.getElementById('displayUsername');
    const mobileAuthLinks = document.getElementById('mobileAuthLinks');
    const mobileUserInfo  = document.getElementById('mobileUserInfo');
    const mobileDisplayUsername = document.getElementById('mobileDisplayUsername');

    try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            currentUsername = data.user.username;

            // Desktop: swap guest → user panel
            if (guestLinks) guestLinks.classList.add('hidden');
            if (userLinks)  userLinks.classList.remove('hidden');
            if (displayUsername) displayUsername.innerText = currentUsername;

            // Mobile: swap auth links → user info
            if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
            if (mobileUserInfo)  mobileUserInfo.classList.remove('hidden');
            if (mobileDisplayUsername) mobileDisplayUsername.innerText = currentUsername;

            await loadCurrentCoins(currentUsername);
            await loadTransactionHistory(currentUsername);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้อง Login ก่อนเติมเงิน',
                confirmButtonColor: '#0070eb',
                background: '#001028',
                color: '#fff'
            }).then(() => { window.location.href = '/pages/login.html'; });
        }
    } catch (e) {
        console.error('Auth check error:', e);
        if (guestLinks) guestLinks.classList.remove('hidden');
        if (userLinks)  userLinks.classList.add('hidden');
    }
}

async function loadCurrentCoins(username) {
    try {
        const res  = await fetch(`/api/get-coin/${encodeURIComponent(username)}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && typeof data.coin === 'number') {
            const coin = data.coin;
            const el1 = document.getElementById('currentCoins');
            const el2 = document.getElementById('displayCoin');
            const el3 = document.getElementById('mobileDisplayCoin');
            if (el1) el1.innerText = coin;
            if (el2) el2.innerText = coin;
            if (el3) el3.innerText = coin;
        }
    } catch (e) { console.error('Load coins error:', e); }
}

async function loadTransactionHistory(username) {
    const tbody = document.getElementById('historyTableBody');
    try {
        const res  = await fetch(`/api/topup/history/${encodeURIComponent(username)}`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.history.length > 0) {
            document.getElementById('historyCount').innerText = `${data.history.length} รายการ`;
            tbody.innerHTML = data.history.map(tx => {
                const date   = new Date(tx.created_at).toLocaleString('th-TH', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });
                const masked     = tx.voucher_code
                    ? '****-****-****-' + tx.voucher_code.slice(-4).toUpperCase()
                    : '-';
                const statusBadge = getStatusBadge(tx.status);

                return `
                <tr class="border-b border-gray-100 dark:border-white/5
                           hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td class="px-5 py-3 text-sm text-gray-500 dark:text-white/60">${date}</td>
                    <td class="px-5 py-3">
                        <span class="font-mono text-xs text-gray-400 dark:text-white/50 tracking-wider">${masked}</span>
                    </td>
                    <td class="px-5 py-3 text-right">
                        <span class="font-bold text-green-600 dark:text-green-400">+${tx.coins_received}</span>
                        <span class="text-gray-400 dark:text-white/40 text-xs"> Coins</span>
                    </td>
                    <td class="px-5 py-3 text-center">${statusBadge}</td>
                </tr>`;
            }).join('');
        } else {
            document.getElementById('historyCount').innerText = '0 รายการ';
            tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-10 text-gray-400 dark:text-white/40 text-sm">
                    📭 ยังไม่มีประวัติการเติมเงิน
                </td>
            </tr>`;
        }
    } catch (e) {
        console.error('Load history error:', e);
        tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-10 text-red-500 dark:text-red-400 text-sm">
                ⚠️ โหลดประวัติไม่สำเร็จ
            </td>
        </tr>`;
    }
}

function getStatusBadge(status) {
    const map = {
        pending: '<span class="px-2.5 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded-full">รอดำเนินการ</span>',
        success: '<span class="px-2.5 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">สำเร็จ</span>',
        failed:  '<span class="px-2.5 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">ล้มเหลว</span>'
    };
    return map[status]
        || `<span class="px-2.5 py-1 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/60 text-xs font-medium rounded-full">${status}</span>`;
}

// Voucher input auto-format
document.getElementById('voucherCode').addEventListener('input', function () {
    let val = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (val.length > 16) val = val.slice(0, 16);
    const parts = val.match(/.{1,4}/g) || [];
    this.value = parts.join('-');
});

// Redeem form submit
document.getElementById('topupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUsername) {
        Swal.fire({
            icon: 'warning', title: 'กรุณาเข้าสู่ระบบ',
            confirmButtonColor: '#0070eb', background: '#001028', color: '#fff'
        });
        return;
    }

    const voucherInput = document.getElementById('voucherCode');
    const cleanCode    = voucherInput.value.trim().replace(/-/g, '');

    if (cleanCode.length !== 16) {
        Swal.fire({
            icon: 'error', title: 'รหัสไม่ถูกต้อง',
            text: 'กรุณากรอกรหัส Voucher 16 หลัก',
            confirmButtonColor: '#0070eb', background: '#001028', color: '#fff'
        });
        return;
    }

    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline"
             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>กำลังดำเนินการ...`;

    try {
        const res  = await fetch('/api/topup/redeem', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voucherCode: cleanCode })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            // Update all coin displays
            const el1 = document.getElementById('currentCoins');
            const el2 = document.getElementById('displayCoin');
            const el3 = document.getElementById('mobileDisplayCoin');
            if (el1) el1.innerText = data.newBalance;
            if (el2) el2.innerText = data.newBalance;
            if (el3) el3.innerText = data.newBalance;

            Swal.fire({
                icon: 'success',
                title: 'เติมเงินสำเร็จ!',
                html: `คุณได้รับ <strong>${data.coins} Coins</strong><br>ยอดคงเหลือ: <strong>${data.newBalance} Coins</strong>`,
                confirmButtonColor: '#0070eb',
                background: '#001028',
                color: '#fff'
            });
            voucherInput.value = '';
            await loadTransactionHistory(currentUsername);
        } else {
            Swal.fire({
                icon: 'error', title: 'เติมเงินไม่สำเร็จ',
                text: data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่',
                confirmButtonColor: '#0070eb', background: '#001028', color: '#fff'
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'warning', title: 'เชื่อมต่อล้มเหลว',
            text: 'ไม่สามารถเชื่อมต่อกับ Server ได้ กรุณาลองใหม่ภายหลัง',
            confirmButtonColor: '#0070eb', background: '#001028', color: '#fff'
        });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `
            <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>ยืนยันเติมเงิน`;
    }
});

async function logoutProcess() {
    try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch (e) { }
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', (e) => { e.preventDefault(); logoutProcess(); });

    const mobileBtnLogout = document.getElementById('mobileBtnLogout');
    if (mobileBtnLogout) mobileBtnLogout.addEventListener('click', (e) => { e.preventDefault(); logoutProcess(); });
});
