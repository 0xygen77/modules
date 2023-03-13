let showNotification = false;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Chikoroko 自動收集兔子', subtitle, message, {
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
    const chikoCookie = $persistentStore.read('ChikoCookie');
    const chikoCsrf = $persistentStore.read('ChikoCsrf');
    
    if (!chikoCookie || chikoCookie.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 cookie']);
    }
    if (!chikoCsrf || chikoCsrf.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 csrf']);
    }
    cookie = chikoCookie;
    csrf = chikoCsrf;
    return resolve();
  });
}

async function checkIn() {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://chikoroko.art/toy/add/',
        headers: {
          'cookie': cookie,
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1'
        },
        body: 'csrfmiddlewaretoken=' + csrf + '&pk=1603'
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['領取失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            return resolve(response.status);
          } else {
            return reject(['領取失敗 ‼️', response.status]);
          }
        }
      });
    } catch (error) {
      return reject(['領取失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ Chikoroko 自動領兔子 v20230313.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    await checkIn();
    console.log('✅ 領取成功');

    //surgeNotify('領取成功 ✅', '');
  } catch (error) {
    handleError(error);
  }
  $done();
})();
