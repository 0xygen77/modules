/*
 * GreenPoint (綠色點數) 每日簽到 - Surge 腳本
 * ------------------------------------------
 * API: POST /GpConsumerApp/Function/DailySignIn/RootList.aspx/SignIn
 * 驗證方式: Cookie (UUID + greenpointUUID)
 *
 * 使用方式 (搭配 greenpoint-capture-cookie.js 自動擷取 Cookie):
 * 1. 先部署 greenpoint-capture-cookie.js,讓 Surge 平常使用時自動把
 *    最新的 Cookie 存進 $persistentStore
 * 2. 本腳本執行時會優先讀取 $persistentStore 裡的 Cookie,
 *    只有在完全沒抓到過的情況下才會用下面的 FALLBACK_COOKIE 當備援
 * 3. 在 Surge 設定檔加入 [Script] 區塊,例如:
 *
 *    [Script]
 *    greenpoint-signin = type=cron, cronexp="0 9 * * *", script-path=./greenpoint-signin.js, timeout=30, tag=GreenPoint簽到
 *
 *    (script-path 可以是本機路徑,也可以是你自己架的 raw 檔案 URL)
 *
 * 4. 存檔後在 Surge 的「腳本」分頁裡手動執行一次測試,確認會跳出通知
 *
 * 備援 Cookie (選填):
 * - 如果從沒觸發過擷取腳本 (persistentStore 是空的),會用這組頂著,
 *   之後只要你正常開一次 App/網頁,擷取腳本就會自動覆蓋掉它
 */

// 備援用,平常不會用到,擷取腳本抓到值之後會自動取代
const FALLBACK_COOKIE = "UUID=你的UUID值; greenpointUUID=你的greenpointUUID值";
const COOKIE = $persistentStore.read("greenpoint_cookie") || FALLBACK_COOKIE;

if (!COOKIE || COOKIE.indexOf("你的UUID值") !== -1) {
  $notification.post(
    "GreenPoint 簽到腳本尚未取得 Cookie",
    "",
    "請先開一次 GreenPoint App 或網頁,讓擷取腳本抓到 Cookie 後再試"
  );
  $done();
} else {

const url = "https://sys.greenpoint.org.tw/GpConsumerApp/Function/DailySignIn/RootList.aspx/SignIn";

const options = {
  url: url,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "https://sys.greenpoint.org.tw",
    "Referer": "https://sys.greenpoint.org.tw/GpConsumerApp/Function/DailySignIn/RootList.aspx",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)",
    "Cookie": COOKIE
  },
  body: ""
};

$httpClient.post(options, function (error, response, data) {
  if (error) {
    $notification.post("GreenPoint 簽到失敗", "", "連線錯誤: " + String(error));
    $done();
    return;
  }

  try {
    const json = JSON.parse(data);
    const d = json.d || {};

    if (d.err === 0) {
      $notification.post(
        "GreenPoint 簽到成功 ✅",
        "",
        `獲得 ${d.points} 點,本週已簽到 ${d.CurrentWeekCheckIns} 天`
      );
    } else {
      // err 不是 0,常見情況是「今天已經簽過到」或 Cookie 過期
      $notification.post(
        "GreenPoint 簽到未成功",
        `err=${d.err}`,
        d.message && d.message.length ? d.message : "可能今天已簽到過,或 Cookie 已失效需更新"
      );
    }
  } catch (e) {
    $notification.post("GreenPoint 簽到腳本錯誤", "無法解析回應", data);
  }

  $done();
});

}
