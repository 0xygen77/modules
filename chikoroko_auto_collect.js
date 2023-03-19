let showNotification = false;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Chikoroko 自動收集兔子v2', subtitle, message, {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function preCheck() {
  return new Promise((resolve, reject) => {
    const chikoCookie = $persistentStore.read('ChikoCookie');
    
    if (!chikoCookie || chikoCookie.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 cookie']);
    }
    cookie = chikoCookie;
    return resolve();
  });
}

async function checkIn(id) {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://chikoroko.art/api/v1/drops/earn',
        headers: {
          'cookie': cookie,
          'origin': 'https://chikoroko.art',
          'referer': 'https://chikoroko.art/',
          'content-type': 'application/json',
          'Accept': '*/*',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
        },
        body: '{"id":' + id + '}',
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['領取失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            return resolve(response.status);
          } else {
            const obj = JSON.parse(data);
            if (obj.error.code >= 400) {
              console.log(id + " " + obj.error.message);
              return reject(['領取失敗 ‼️', '已領取或是查無該編號'])
            }
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
  console.log('ℹ️ Chikoroko 自動收集兔子v2 v20230319.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    let id = 66;
    await checkIn(id);
    console.log('✅ 領取成功');

    surgeNotify('領取成功 ✅', '');
  } catch (error) {
    handleError(error);
  }
  $done();
})();
