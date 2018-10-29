export var aliApis = function(api) {
  return {
    // 交互
    showModal: function _(a) {
      a.cancelButtonText = a.cancelText;
      a.confirmButtonText = a.confirmText;
      // 没有取消按钮
      if(a.showCancel === false) {
        a.buttonText = a.confirmText
        return api.alert(a);

      }
      return api.confirm(a);
    },
    showActionSheet: function _(a) {
      a.items = a.itemList;
      return api.showActionSheet(a);
    },
    showToast: function _(a) {
      a.content = a.title;
      a.type = a.icon;
      return api.showToast(a);
    },
    showLoading: function _(a) {
      a.content = a.title;
      return api.showLoading(a);
    },
    // 导航类
    setNavigationBarTitle: function _(a) {
      return api.setNavigationBar(a);
    },
    setNavigationBarColor: function _(a) {
      return api.setNavigationBar(a);
    },
    // 图片保存到本地
    saveImageToPhotosAlbum: function _(a) {
      a.url = a.filePath;
      return api.saveImage(a);
    },

    // 图片预览
    previewImage: function _(a) {
      let index = a.urls.indexOf(a.current || a.urls[0]);
      a.current = index;
      return api.previewImage(a);
    },

    // 文件
    getFileInfo: function _(a) {
      a.apFilePath = a.filePath;
      return api.getFileInfo(a);
    },
    getSavedFileInfo: function _(a) {
      a.apFilePath = a.filePath;
      return api.getSavedFileInfo(a);
    },
    removeSavedFile: function _(a) {
      a.apFilePath = a.filePath;
      return api.removeSavedFile(a);
    },
    saveFile: function _(a) {
      a.apFilePath = a.tempFilePath;
      let fn = a['success'];
      a['success'] = res => {
        res.savedFilePath = res.apFilePath;
        fn && fn(res);
      };
      return api.saveFile(a);
    },
    // 位置
    openLocation: function _(a) {
      a.latitude = a.latitude + '';
      a.longitude = a.longitude + '';
      return api.openLocation(a);
    },

    // 数据缓存
    getStorageSync: function _(a) {
      if (a == null) throw new Error('key 不能是 undefined或者是空')
      var res = api.getStorageSync({key: a});
      return res.data || '';
    },
    setStorageSync: function _(a1, a2) {
      if (a1 == null) throw new Error('key 不能是 undefined或者是空')
      var k = {};
      k.key = a1;
      k.data = a2;
      return api.setStorageSync(k);
    },
    // 上传
    uploadFile: function _(a) {
      a.fileName = a.name;
      return api.uploadFile(a);
    },
    // 下载
    downloadFile: function _(a) {
      let fn = a['success'];
      a['success'] = res => {
        res.tempFilePath = res.apFilePath;
        fn && fn(res);
      };
      return api.downloadFile(a);
    },
    // 图片
    chooseImage: function _(a) {
      let fn = a['success'];
      a['success'] = res => {
        res.tempFilePaths = res.apFilePaths;
        fn && fn(res);
      };
      return api.chooseImage(a);
    },
    // 剪切板
    getClipboardData: function _(a) {
      let fn = a['success'];
      a['success'] = res => {
        res.data = res.text;
        fn && fn(res);
      };
      return api.getClipboard(a);
    },
    setClipboardData: function _(a) {
      a.text = a.data;
      return api.setClipboard(a);
    },
    // 打电话
    makePhoneCall: function _(a) {
      a.number = a.phoneNumber;
      return api.makePhoneCall(a);
    },

    // 扫码
    scanCode: function _(a) {
      a.hideAlbum = a.onlyFromCamera;
      a.type = (a.scanType && a.scanType[0].slice(0, -4)) || 'qr';
      let fn = a['success'];
      a['success'] = res => {
        res.result = res.code;
        fn && fn(res);
      };

      return api.scan(a);
    },

    // 屏幕亮度
    setScreenBrightness: function _(a) {
      a.brightness = a.value;
      return api.setScreenBrightness(a);
    }
  };
};
