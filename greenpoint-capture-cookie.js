/*
 * GreenPoint Cookie 自動擷取腳本
 * ------------------------------------------
 * 用途: 當你平常打開 GreenPoint App / 網站時,順手把當下有效的
 *       UUID / greenpointUUID Cookie 存進 Surge 的持久化儲存空間,
 *       讓簽到腳本 (greenpoint-signin.js) 可以自動讀取最新值,
 *       不用手動更新。
 *
 * 型態: type=http-request (在請求「送出前」攔截,不會擋住原本的請求)
 *
 * 建議掛在這個 pattern (只要打 sys.greenpoint.org.tw 底下任何頁面/API
 * 且帶有這兩個 cookie 就會被抓到,例如平常開簽到頁、會員中心都會觸發):
 *
 *   ^https?:\/\/sys\.greenpoint\.org\.tw\/GpConsumerApp\/
 */

const cookie = $request.headers["Cookie"] || $request.headers["cookie"];

if (cookie && cookie.indexOf("UUID=") !== -1 && cookie.indexOf("greenpointUUID=") !== -1) {
  const old = $persistentStore.read("greenpoint_cookie");
  if (old !== cookie) {
    $persistentStore.write(cookie, "greenpoint_cookie");
    $persistentStore.write(new Date().toString(), "greenpoint_cookie_updated_at");
    console.log("[GreenPoint] Cookie 已更新: " + cookie);
  }
}

// 一定要呼叫 $done({}) 讓原本的請求原封不動繼續送出,
// 這支腳本只是「偷看」不修改請求
$done({});
