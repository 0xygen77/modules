let showNotification = true;
let token = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('SoQuest 自動簽到', subtitle, message, {
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
    const soquestSignature = $persistentStore.read('SoQuestSignature');
    
    if (!soquestSignature || soquestSignature.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 SoQuest Signature']);
    }

    const soquestAddress = $persistentStore.read('SoQuestAddress');
    
    if (!soquestAddress || soquestAddress.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 SoQuest Address']);
    }

    signature = soquestSignature;
    address = soquestAddress;
    return resolve();
  });
}

async function checkIn() {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://api.sograph.xyz/api/user/check/in',
        headers: {
          'address': address,
          'signature': signature,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['簽到失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            if (obj.message === 'Signed in today') {
              return reject(['簽到失敗 ‼️', '今日已經簽到'])
            } else if (obj.message === 'Please login') {
              return reject(['簽到失敗 ‼️', '請重新拿取 signature'])
            } else {
              return resolve(['簽到成功 ✅', obj]);
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
  console.log('ℹ️ SoQuest 自動簽到 v20230411.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    await checkIn();
    console.log('✅ 簽到成功');

    surgeNotify('簽到成功 ✅', '');
  } catch (error) {
    handleError(error);
  }
  $done();
})();
