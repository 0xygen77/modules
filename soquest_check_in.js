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
    
    const soquestTime = $persistentStore.read('SoQuestTime');
    
    if (!soquestTime || soquestTime.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 SoQuest Time']);
    }
    
    const soquestSign = $persistentStore.read('SoQuestSign');
    
    if (!soquestSign || soquestSign.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 SoQuest Sign']);
    }
    
    const soquestApikey = $persistentStore.read('SoQuestApikey');
    
    if (!soquestApikey || soquestApikey.length === 0) {
      return reject(['檢查失敗 ‼️', '找不到 SoQuest Apikey']);
    }

    signature = soquestSignature;
    address = soquestAddress;
    time = soquestTime;
    sign = soquestSign;
    api = soquestApikey;
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
          'apikey': api,
          'sign': sign,
          'time': time,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        },
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['簽到失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            console.log(`Response Data: ${JSON.stringify(obj)}`);
            if (obj.message === 'Signed in today') {
              return reject(['簽到失敗 ‼️', '今日已經簽到'])
            } else if (obj.message === 'Please login') {
              return reject(['簽到失敗 ‼️', '請重新拿取 signature'])
            } else if (obj.message === 'OK') {
              const checkInScore = obj.data.score;
              console.log(`Check In Score: ${checkInScore}`);
              return resolve(checkInScore);
            } else {
              return reject(['簽到失敗 ‼️', obj])
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
  console.log('ℹ️ SoQuest 自動簽到 v20231125.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    const result = await checkIn();
    console.log('✅ 簽到成功');
    console.log(`ℹ️ 獲得 👉 ${result} 積分 💎`);
    
    surgeNotify(
      '領取成功 ✅',
      `獲得 👉 ${result} 積分 💎`
    );
  } catch (error) {
    handleError(error);
  }
  $done();
})();
