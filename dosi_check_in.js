let showNotification = true;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('DOSI 自動簽到', subtitle, message, {
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
    const dosiCookie = $persistentStore.read('DOSICookie');
    
    if (!dosiCookie || dosiCookie.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 cookie']);
    }
    cookie = dosiCookie;
    return resolve();
  });
}

async function checkIn() {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://citizen.dosi.world/api/citizen/v1/events/check-in',
        headers: {
          'cookie': cookie,
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1',
          'referer': 'https://citizen.dosi.world/bonus'
        },
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['領取失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            console.log(`Response Data: ${JSON.stringify(obj)}`);
            if (obj.success === true) {
              const totalAmount = obj.totalAmount;
              return resolve(totalAmount);
            }
          }
          if (response.status === 500) {
            const obj = JSON.parse(data);
            console.log(`Response Data: ${JSON.stringify(obj)}`);
            if (obj.statusMessage === 'Fail to register check-in event due to check-in is already processed.') {
              return reject(['簽到失敗 ‼️', '今日已經簽到'])
            }
          } else {
            return reject(['簽到失敗 ‼️', response.status]);
          }
        }
      });
    } catch (error) {
      return reject(['簽到失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ DOSI 自動簽到 v20230314.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    const reward = await checkIn();
    console.log('✅ 簽到成功');
    console.log('ℹ️ 獲得 👉 ${reward} 💎');

    surgeNotify(
      '簽到成功 ✅',
      `獲得 👉 ${reward} DON 💎`
    );
  } catch (error) {
    handleError(error);
  }
  $done();
})();
