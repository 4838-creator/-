/**
 * 業務日報アプリ - Google Apps Script バックエンドコード
 * v3.3 (区切り線・後入れ版)
 * 
 * このコードをスプレッドシートの「拡張機能 > Apps Script」にコピペしてください。
 */

function doPost(e) {
    try {
        // リクエストボディを取得 (JSON形式)
        // 期待するデータ: { "date": "2024-xx-xx", "reports": [ { "timeSlot": "...", "content": "..." }, ... ] }
        const postData = JSON.parse(e.postData.contents);

        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const dateStr = postData.date; // ユーザーが指定した日付

        // 複数の日報データをループして追加
        if (postData.reports && Array.isArray(postData.reports)) {
            postData.reports.forEach(report => {
                sheet.appendRow([
                    dateStr,           // A列: 日付
                    report.timeSlot,   // B列: 対象時間帯
                    report.content     // C列: 業務内容
                ]);
            });

            // データの後に区切り線を入れる
            sheet.appendRow(["-----------", "-----------", "-----------"]);

            return createResponse({ status: 'success', message: `${postData.reports.length} rows added` });
        } else {
            // 古い形式への後方互換性などが必要ならここに書くが、今回はエラーにする
            return createResponse({ status: 'error', message: 'No reports data found' });
        }

    } catch (error) {
        return createResponse({ status: 'error', message: error.toString() });
    }
}

/**
 * CORS対応のJSONレスポンスを作成するヘルパー関数
 */
function createResponse(data) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}
