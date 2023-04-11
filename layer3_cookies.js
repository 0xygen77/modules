let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Layer3 Cookies', subtitle, message, { 'url': '' });
};

function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) {
      surgeNotify(error[0], error[1]);
    }
  } else {
    console.log(`❌ ${error}`);
    if (showNotification) {
      surgeNotify(error);
    }
  }
}

async function getToken() {
  return new Promise((resolve, reject) => {
    try {
      const cookie = $request.headers['cookie'] || $request.headers['Cookie'];
      if (cookie) {
        let split_cookie = cookie.split("; ")
        let saveRefresh = false;
        let saveAccess = false;
        for (var i = 0; i < split_cookie.length; i++) {
            if (split_cookie[i].startsWith("layer3_refresh_token=")) {
                refreshToken = split_cookie[i].split('layer3_refresh_token=')[1];
                saveRefresh = $persistentStore.write(refreshToken, 'Layer3RefreshToken');
            } else if (split_cookie[i].startsWith("layer3_access_token=")) {
                accessToken = split_cookie[i].split('layer3_access_token=')[1];
                saveAccess = $persistentStore.write(accessToken, 'Layer3AccessToken');
            }
        }
        if (saveRefresh && saveAccess) {
          return resolve();
        } else {
          return reject(['保存失敗 ‼️', '無法儲存 Cookie']);
        }
      } else {
        return reject(['保存失敗 ‼️', '無法取得 Cookie']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ Layer3 取得 Cookie v20230411.1');
  try {
    await getToken();
    console.log('✅ Cookie 保存成功');
    surgeNotify(
      '保存成功 🍪',
      ''
    );
  } catch (error) {
    handleError(error);
  }
  $done({});
})();