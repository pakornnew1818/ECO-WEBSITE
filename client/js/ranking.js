async function loadRanking() {
    try {
        const res = await fetch('/api/ranking');
        const data = await res.json();

        if (!data.success) return;

        const rankingList = document.getElementById('rankingList');

        rankingList.innerHTML = '';

        data.ranking.forEach((player, index) => {

            const li = document.createElement('li');

            li.innerHTML = `
                <div>
                    ${index + 1}
                </div>

                <div>
                    <p>${player.name}</p>
                    <p>Lv.${player.level}</p>
                </div>
            `;

            rankingList.appendChild(li);
        });

    } catch (error) {
        console.error('Ranking error:', error);
    }
}