const SYSTEM_ID = $argument;

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";

if (!SYSTEM_ID) {
  $notification.post(
    "GreenPoint 簽到腳本尚未設定",
    "",
    "請在 Surge 設定檔的 argument 帶入 SYSTEM_ID"
  );
  $done();
} else {
  getNewCode();
}

// Step 1: 呼叫 ApiEncryptionNo4New 拿新的動態碼
function getNewCode() {
  const options = {
    url: "https://sys.greenpoint.org.tw/GpConsumerConnectNew/CombinedAccountSet/ApiEncryptionNo4New",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "User-Agent": UA
    },
    "auto-cookie": false,
    body: JSON.stringify({ systemId: SYSTEM_ID })
  };

  $httpClient.post(options, function (error, response, data) {
    if (error) {
      $notification.post("GreenPoint 登入失敗", "取得動態碼時連線錯誤", String(error));
      $done();
      return;
    }

    try {
      const json = JSON.parse(data);
      if (json.ResultCode !== "0000" || !json.Message) {
        $notification.post(
          "GreenPoint 登入失敗",
          "沒有拿到動態碼 (ResultCode=" + json.ResultCode + ")",
          "回應: " + data
        );
        $done();
        return;
      }

      const code = parseInt(json.Message, 10) + 168;
      refreshCookieAndSignIn(code);
    } catch (e) {
      $notification.post("GreenPoint 登入失敗", "無法解析動態碼回應", String(e));
      $done();
    }
  });
}

// Step 2: 組 id, 呼叫 Login.aspx 拿新 Cookie
function refreshCookieAndSignIn(code) {
  try {
    const rawId = SYSTEM_ID + "-" + code;
    const encodedId = base64Encode(rawId);

    const loginUrl =
      "https://sys.greenpoint.org.tw/GpConsumerApp/Function/Login.aspx?id=" +
      encodeURIComponent(encodedId) +
      "&platform=iOS&isFromPush=N";

    const loginOptions = {
      url: loginUrl,
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      "auto-redirect": false,
      "auto-cookie": false
    };

    $httpClient.get(loginOptions, function (error, response, data) {
      try {
        if (error) {
          $notification.post("GreenPoint 登入失敗", "Login.aspx 連線錯誤", String(error));
          $done();
          return;
        }

        const cookie = extractCookie(response && response.headers);

        if (!cookie) {
          $notification.post(
            "GreenPoint 登入失敗",
            "沒拿到新 Cookie",
            "回應狀態: " + (response ? response.status : "無回應") + "。可能是動態碼演算法失效,建議改用被動擷取方案 (greenpoint-capture-cookie.js)"
          );
          $done();
          return;
        }

        warmUpAndSignIn(cookie);
      } catch (innerErr) {
        $notification.post("GreenPoint 登入失敗", "Login 階段發生例外", String(innerErr));
        $done();
      }
    });
  } catch (err) {
    $notification.post("GreenPoint 登入失敗", "組 id 階段發生例外", String(err));
    $done();
  }
}

// Step 3: 先 GET 簽到頁暖機,讓伺服器端 session 就緒
function warmUpAndSignIn(cookie) {
  try {
    const options = {
      url: "https://sys.greenpoint.org.tw/GpConsumerApp/Function/DailySignIn/RootList.aspx",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cookie": cookie
      },
      "auto-cookie": false
    };

    $httpClient.get(options, function (error, response, data) {
      try {
        // 暖機失敗不阻斷流程,直接嘗試簽到
        signIn(cookie, 0);
      } catch (innerErr) {
        $notification.post("GreenPoint 簽到失敗", "暖機 callback 發生例外", String(innerErr));
        $done();
      }
    });
  } catch (err) {
    $notification.post("GreenPoint 簽到失敗", "暖機階段發生例外", String(err));
    $done();
  }
}

function extractCookie(headers) {
  if (!headers) return null;
  const parts = [];
  for (const key in headers) {
    if (key.toLowerCase() !== "set-cookie") continue;
    const value = headers[key];
    const list = Array.isArray(value) ? value : [value];
    for (const v of list) {
      parts.push(v.split(";")[0].trim());
    }
  }
  return parts.length ? parts.join("; ") : null;
}

// Surge 部分版本沒有內建 $base64,自帶簡易 base64 encode
function base64Encode(str) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
    const c3 = i < str.length ? str.charCodeAt(i++) : NaN;
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const e3 = isNaN(c2) ? 64 : (((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6));
    const e4 = isNaN(c3) ? 64 : c3 & 63;
    output += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
  }
  return output;
}

// Step 4: 簽到
function signIn(cookie, retryCount) {
  try {
    const url = "https://sys.greenpoint.org.tw/GpConsumerApp/Function/DailySignIn/RootList.aspx/SignIn";

    const options = {
      url: url,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://sys.greenpoint.org.tw",
        "Referer": "https://sys.greenpoint.org.tw/GpConsumerApp/Function/DailySignIn/RootList.aspx",
        "User-Agent": UA,
        "Cookie": cookie
      },
      "auto-cookie": false,
      body: ""
    };

    $httpClient.post(options, function (error, response, data) {
      if (error) {
        $notification.post("GreenPoint 簽到失敗", "連線錯誤", String(error));
        $done();
        return;
      }

      try {
        const json = JSON.parse(data);
        const d = json.d || {};
        const TRANSIENT_ERRS = [4, 5, 9, -1];

        if (d.err === 0) {
          $notification.post(
            "GreenPoint 簽到成功 ✅",
            "",
            `獲得 ${d.points} 點,本週已簽到 ${d.CurrentWeekCheckIns} 天`
          );
        } else if (d.err === 3) {
          $notification.post("GreenPoint 今日已簽到", "", "不用重複執行");
        } else if (d.err === 1) {
          $notification.post(
            "GreenPoint 簽到失敗",
            "err=1 沒有此會員",
            "動態碼演算法可能失效了,建議改用被動擷取方案 (greenpoint-capture-cookie.js)"
          );
        } else if (d.err === 2) {
          $notification.post("GreenPoint 簽到失敗", "err=2 沒有此特約商", "");
        } else if (TRANSIENT_ERRS.indexOf(d.err) !== -1) {
          if (retryCount < 2) {
            setTimeout(function () { signIn(cookie, retryCount + 1); }, 5000);
            return;
          } else {
            $notification.post("GreenPoint 簽到失敗", `err=${d.err} 系統忙碌中`, "已自動重試 2 次仍失敗");
          }
        } else {
          $notification.post("GreenPoint 簽到未知錯誤", `err=${d.err}`, d.message || data);
        }
      } catch (e) {
        $notification.post("GreenPoint 簽到失敗", "無法解析回應", data);
      }

      $done();
    });
  } catch (outerErr) {
    $notification.post("GreenPoint 簽到失敗", "簽到階段發生例外", String(outerErr));
    $done();
  }
}
