let showNotification = true;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Layer3 Token Refresh ', subtitle, message, {
    'url': ''
  });
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

async function preCheck() {
  return new Promise((resolve, reject) => {
    const layer3RefreshToken = $persistentStore.read('Layer3RefreshToken');
    const layer3AccessToken = $persistentStore.read('Layer3AccessToken');
    
    if (!layer3RefreshToken || layer3RefreshToken.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 refresh token']);
    } else if (!layer3AccessToken || layer3AccessToken.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 access token']);
    }
    
    const layer3Cookie = "layer3_refresh_token=" + layer3RefreshToken + "; layer3_access_token=" + layer3AccessToken
    cookie = layer3Cookie;
    return resolve();
  });
}

async function checkIn() {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://layer3.xyz/api/renew-token',
        headers: {
          'cookie': cookie,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['Token refresh 失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            const saveAccess = $persistentStore.write(obj.accessToken, 'Layer3AccessToken');
            if (saveAccess) {
              return resolve(['Refresh Token 保存成功 ✅']);
            } else {
              return reject(['Refresh Token 保存失敗 ‼️', obj])
            }
          } else {
            const obj = JSON.parse(data);
            return reject(['Token refresh 失敗 ‼️', obj])
          }
        }
      });
    } catch (error) {
      return reject(['Token refresh 失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ Layer3 refresh token v20230314.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    await checkIn();
    console.log('✅ Token refresh 成功');

    surgeNotify('Token refresh 成功 ✅', '');
  } catch (error) {
    handleError(error);
  }
  $done();
})();