let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('SoQuest signature', subtitle, message, { 'url': '' });
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
      if (signature && address) {
        const sig_save = $persistentStore.write(signature, 'SoQuestSignature');
        const adr_save = $persistentStore.write(address, 'SoQuestAddress');
        if (sig_save && adr_save) {
          return resolve();
        } else {
          return reject(['保存失敗 ‼️', '無法儲存 signature 或是 address']);
        }
      } else {
        return reject(['保存失敗 ‼️', '無法取得 signature 或是 address']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ SoQuest 取得 signature v20230411.1');
  try {
    await getToken();
    console.log('✅ signature 保存成功');
    surgeNotify(
      '保存成功 🍪',
      ''
    );
  } catch (error) {
    handleError(error);
  }
  $done({});
})();