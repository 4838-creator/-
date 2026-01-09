/**
 * 業務日報アプリ - フロントエンドロジック (Day List Version)
 */
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwxNP8MVrYbaciuQYsWu4Ekm-quMpJoUXg4ioEIzCAOiKyRANafbXTBh6-KilLn4J2E/exec";
// 時間割りの設定
const START_HOUR = 8;  // 08:00
const END_HOUR = 18;   // 18:00 (最後の枠は 17:00-18:00)

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);

    // 今日の日付をセット
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    document.getElementById('report-date').value = today;

    // 時間枠リスト生成
    generateTimeSlots();

    // フォーム送信処理
    const form = document.getElementById('report-form');
    form.addEventListener('submit', handleFormSubmit);
});

function updateTime() {
    // 時計表示の更新
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-time').textContent = timeStr;

    // 日付表示 (例: 2026/01/04 (日))
    const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
    const formattedDate = dateStr.replace(/\//g, '/'); // 必要に応じてフォーマット調整
    document.getElementById('current-date').textContent = formattedDate;
}

function generateTimeSlots() {
    const container = document.getElementById('time-slots-container');
    container.innerHTML = '';

    for (let h = START_HOUR; h < END_HOUR; h++) {
        // 例: 9 -> "09:00 - 10:00"
        const startStr = h.toString().padStart(2, '0') + ":00";
        const endStr = (h + 1).toString().padStart(2, '0') + ":00";
        const label = `${startStr} - ${endStr}`;
        const slotId = `slot-${h}`;

        const div = document.createElement('div');
        div.className = 'time-slot-item';
        div.innerHTML = `
            <div class="time-label">${label}</div>
            <textarea name="slot-${h}" data-time="${label}" placeholder="業務内容を入力..."></textarea>
        `;
        container.appendChild(div);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('submit-btn');

    // GAS URLチェック
    if (!GAS_API_URL || GAS_API_URL.includes("ここにGAS")) {
        alert("エラー: GASのURLが設定されていません。script.jsを確認してください。");
        return;
    }

    // データの収集
    const dateVal = document.getElementById('report-date').value;
    const textareas = document.querySelectorAll('.time-slot-item textarea');
    const reports = [];

    textareas.forEach(ta => {
        const content = ta.value.trim();
        if (content) {
            reports.push({
                timeSlot: ta.dataset.time,
                content: content
            });
        }
    });

    if (reports.length === 0) {
        alert("業務内容が入力されていません。少なくとも1つ入力してください。");
        return;
    }

    // ローディング開始
    btn.classList.add('loading');
    btn.disabled = true;

    const payload = {
        date: dateVal,
        reports: reports
    };

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`${reports.length}件の日報を送信しました！`);
            // フォームクリア? そのまま残す? -> 誤送信防止でクリアしてもいいが、
            // 修正して再送したい場合もあるので、クリアは確認後がいいかも。
            // ここでは一応クリアしないでおくが、完了マークをつけるなどできるとベスト。
            // 簡易的に全クリアする。
            if (confirm("送信完了しました。フォームをクリアしますか？")) {
                textareas.forEach(ta => ta.value = '');
            }
        } else {
            throw new Error(result.message || '不明なエラー');
        }

    } catch (error) {
        console.error('Submission Error:', error);
        alert("送信に失敗しました。\n" + error.message);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}
