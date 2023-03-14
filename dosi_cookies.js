let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('DOSI Cookies', subtitle, message, { 'url': '' });
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
        const save = $persistentStore.write(cookie, 'DOSICookie');
        if (save) {
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
  console.log('ℹ️ DOSI 取得 Cookie v20230314.1');
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