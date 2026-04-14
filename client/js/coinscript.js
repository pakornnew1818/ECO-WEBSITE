document.addEventListener('DOMContentLoaded', async () => {
    try {
        const meRes = await fetch('/auth/me', { credentials: 'include' });
        if (!meRes.ok) return;
        const { user } = await meRes.json();

        const coinRes = await fetch(`/api/get-coin/${user.username}`, { credentials: 'include' });
        const data = await coinRes.json();
        if (data.success && typeof data.coin === 'number') {
            document.getElementById('displayCoin').innerText = data.coin;
        } else {
            document.getElementById('displayCoin').innerText = "0";
        }
    } catch (err) {
        const coinDisplay = document.getElementById('displayCoin');
        if (coinDisplay) coinDisplay.innerText = "เชื่อมต่อข้อมูลล้มเหลว";
    }
});
