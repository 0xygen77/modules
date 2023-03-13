let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('Chikoroko 取得 cookies', subtitle, message, { 'url': '' });
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
        const save = $persistentStore.write(cookie, 'ChikoCookie');
        if (save) {
          const csrf = cookie.split('csrftoken=')[1].split('; ')[0];
          $persistentStore.write(csrf, 'ChikoCsrf');
          return resolve();
        } else {
          return reject(['保存失敗 ‼️', '無法儲存 cookies']);
        }
      } else {
        return reject(['保存失敗 ‼️', '無法取得 cookies']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ Chikoroko 取得 cookies v20230313.1');
  try {
    await getToken();
    console.log('✅ Cookies 保存成功');
    surgeNotify(
      '保存成功 🍪',
      ''
    );
  } catch (error) {
    handleError(error);
  }
  $done({});
})();