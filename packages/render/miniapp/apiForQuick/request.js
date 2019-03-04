const HTTP_OK_CODE = 200;
const JSON_TYPE_STRING = 'json';
// 上传
export function uploadFile({
    url,
    filePath,
    // 小米不支持
    name,
    header,
    // 小米不支持
    formData,
    success,
    fail,
    complete
}) {
    var request = require('@system.request');

    var data = [];
    Object.keys(formData).map(key => {
        let value = formData[key];
        let item = {
            value,
            name: key
        };
        data.push(item);
    });
    function successForMi({ code: statusCode, data }) {
        success({
            statusCode,
            data
        });
    }

    request.upload({
        url,
        header,
        data,
        files: [{ uri: filePath, name: name }],
        success: successForMi,
        fail,
        complete
    });
}

// 下载
export function downloadFile({ url, header, success, fail, complete }) {

    // 小米回调函数参数形式和微信不一致，故进行兼容
    function downloadSuccess({ uri: tempFilePath }) {
        success({
            statusCode: HTTP_OK_CODE,
            tempFilePath
        });
    }

    // 小米需要通过 token 来监听下载进度
    function downloadTaskStarted({ token }) {
        request.onDownloadComplete({
            token,
            success: downloadSuccess,
            fail,
            complete
        });
    }
    var request = require('@system.request');

    request.download({
        url,
        header,
        success: downloadTaskStarted,
        fail,
        complete
    });
}


// 网络请求
export function request({
    url,
    data,
    header,
    method,
    dataType = JSON_TYPE_STRING,
    // 小米不支持设置 responseType
    // responseType,
    success,
    fail,
    complete
}) {
    const fetch = require('@system.fetch');
    function onFetchSuccess({ code: statusCode, data, header: headers }) {
        if (dataType === JSON_TYPE_STRING) {
            try {
                data = JSON.parse(data);
            } catch (error) {
                fail && fail(error);
            }
        }

        success({
            statusCode,
            data,
            headers
        });
    }

    fetch.fetch({
        url,
        data,
        header,
        method,
        success: onFetchSuccess,
        fail,
        complete
    });
}
