let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('SoQuest 必要資訊', subtitle, message, { 'url': '' });
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
      const signature = $request.headers['signature'] || $request.headers['Signature'];
      const address = $request.headers['address'] || $request.headers['Address'];
      const apikey = $request.headers['Apikey'] || $request.headers['apikey'];
      const time = $request.headers['Time'] || $request.headers['time'];
      const sign = $request.headers['Sign'] || $request.headers['sign'];
      
      if (signature && address && apikey && time && sign) {
        const sig_save = $persistentStore.write(signature, 'SoQuestSignature');
        const adr_save = $persistentStore.write(address, 'SoQuestAddress');
        const sign_save = $persistentStore.write(sign, 'SoQuestSign');
        const time_save = $persistentStore.write(time, 'SoQuestTime');
        const api_save = $persistentStore.write(apikey, 'SoQuestApikey');
        if (sig_save && adr_save && sign_save && time_save && api_save) {
          return resolve();
        } else {
          console.log('Signature: '+ sig_save);
          console.log('\nAddress: '+ adr_save);
          console.log('\nSign: '+ sign_save);
          console.log('\nTime: '+ time_save);
          console.log('\nApi: '+ api_save);
          return reject(['保存失敗 ‼️', '儲存 signature, address, sign, time, apikey 發生錯誤']);
        }
      } else {
        return reject(['保存失敗 ‼️', '無法取得 signature, address, sign, time, apikey']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ SoQuest 取得 signature v20231125.1');
  try {
    await getToken();
    console.log('✅ SoQuest 必要資訊保存成功');
    surgeNotify(
      '保存成功 🍪',
      ''
    );
  } catch (error) {
    handleError(error);
  }
  $done({});
})();
