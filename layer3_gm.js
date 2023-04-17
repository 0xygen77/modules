let showNotification = true;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Layer3 自動 GM', subtitle, message, {
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
        url: 'https://layer3.xyz/api/trpc/gm.addGm?batch=1',
        headers: {
          'cookie': cookie,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'content-type': 'application/json',
        },
        body: '{"0":{"json":{"timezoneOffset":-480,"markXpActivityAsSeen":true}}}',
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['GM 失敗 ‼️', '連線錯誤']);
        } else {
          const obj = JSON.parse(data);
          console.log(`Response Data: ${JSON.stringify(obj)}`);
          if (response.status === 200) {
            const gmDays = obj[0].result.data.json;
            console.log(`GM Days: ${gmDays}`);
            return resolve(gmDays);
          } else if (response.status === 401) {
            return reject(['認證失敗 ‼️', "請重新拿取 cookies 或是手動 refresh token"])
          } else {
            return reject(['GM 失敗 ‼️', obj[0].error.json.message])
          }
        }
      });
    } catch (error) {
      return reject(['GM 失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ Layer3 自動 GM v20230417.2');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    const result = await checkIn();
    console.log('✅ GM 成功');
    console.log(`ℹ️ 目前已連續 GM ${result} 天`);
    
    surgeNotify(
      `GM 成功，目前已連續 GM ${result} 天`
    );
  } catch (error) {
    handleError(error);
  }
  $done();
})();
