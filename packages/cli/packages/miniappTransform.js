/* eslint-disable no-console */
/*!
 * 生成js文件, ux文件
 */
let babel = require('@babel/core');
let path = require('path');
let config = require('./config');
let quickFiles = require('./quickFiles');
let queue = require('./queue');
let mergeUx = require('./quickHelpers/mergeUx');
let utils = require('./utils');


let isReact = function(sourcePath){
    return /^(React)/.test( path.basename(sourcePath) );
};

function transform(sourcePath, resolvedIds, originalCode) {

    //跳过 React 编译
    if ( isReact(sourcePath) ) {
        queue.push({
            code: originalCode,
            type: 'js',
            path: utils.updatePath(sourcePath, config.sourceDir, 'dist') 
        });
       
        return;
    }

    babel.transformFile(
        sourcePath,
        {
            babelrc: false,
            comments: false,
            plugins: [
                /**
                 * [babel 6 to 7] 
                 * v6 default config: ["plugin", { "loose": true }]
                 * v7 default config: ["plugin"]
                 */
                [
                    require('@babel/plugin-proposal-class-properties'),
                    { loose: true }
                ],
                require('@babel/plugin-syntax-jsx'),
                [
                    /**
                     * [babel 6 to 7] 
                     * In anticipation of the new decorators proposal implementation,
                     * we've decided to make it the new default behavior.
                     * This means that to continue using the current decorators syntax/behavior,
                     * you must set the legacy option as true.
                     */
                    require('@babel/plugin-proposal-decorators'),
                    {
                        legacy: true
                    }
                ],
                require('@babel/plugin-proposal-object-rest-spread'),
                require('@babel/plugin-transform-template-literals'),
                ...require('./babelPlugins/transformMiniApp')(sourcePath),
                ...require('./babelPlugins/transformEnv'),
                ...require('./babelPlugins/injectRegeneratorRuntime'),
                require('./babelPlugins/transformIfImport'),
                require('./babelPlugins/trasnformAlias')( {sourcePath,resolvedIds} )
            ]
        },
        async function(err, result) {
            if (err) {
                //eslint-disable-next-line
                console.log(sourcePath, '\n', err);
                process.exit(1);
            }
            //处理中文转义问题
            result.code = utils.decodeChinise(result.code);
            let queueData = {
                code: result.code,
                path: utils.updatePath(sourcePath, config.sourceDir, 'dist'),
                type: 'js'
            };

            if (config.buildType == 'quick' && quickFiles[sourcePath] ) {

                // 补丁 queue的占位符, 防止同步代码执行时间过长产生的多次构建结束的问题
                const placeholder = {
                    code: '',
                    path: utils.updatePath(sourcePath, config.sourceDir, 'dist', 'ux')
                };
                queue.push(placeholder);
                // 补丁 END
                
                //ux处理
                let {code, type} = await mergeUx({
                    sourcePath: sourcePath,
                    result: result
                });
                let distPath = utils.updatePath(sourcePath, config.sourceDir, 'dist',  type == 'ux' ? 'ux' : 'js');
                
                queueData = {
                    code: code,
                    path: distPath
                };
            } 

            queue.push(queueData);

        }
    );
}

module.exports = transform;

// https://github.com/NervJS/taro/tree/master/packages/taro-cli
// https://blog.csdn.net/liangklfang/article/details/54879672
// https://github.com/PepperYan/react-miniapp/blob/master/scripts/transform.js
// https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/README.md
