const StyleParser = require('./StyleParser');
const { MAP } = require('../../../consts/index');
const calculateAlias = require('../../../packages/utils/calculateAlias');


class SassParser extends StyleParser {
    constructor(props) {
        super(props);
        
        this._postcssPlugins = [
            require('stylelint')({
                configFile: require.resolve(`../../../config/stylelint/.stylelint-${this.platform}.config.js`)
            }),
            require('../../../packages/postcssPlugins/postcssPluginReport'),
            require('postcss-import')({
                resolve: function(importer, baseDir){
                    //如果@import的值没有文件后缀
                    if (!/\.s[ca]ss$/.test(importer)) {
                        importer = importer + '.scss';
                    }
                    //处理alias路径
                    return calculateAlias(props.filepath, importer);
                },
                plugins: this.platform !== 'h5' ? [
                    require('../../../packages/postcssPlugins/postCssPluginRemoveRules') // 删除import文件的所有rules，保留@mixins、$variables、@functions等
                ] : []
            }),
            require('@csstools/postcss-sass'),
            ...this.platform !== 'h5' ? [
                require('../../../packages/postcssPlugins/postcssPluginAddImport')({
                    extName: MAP[this.platform]['EXT_NAME'][this.type],
                    type: this.type
                }), // 添加@import规则，小程序可以解析原有依赖
            ] : [
                require('../../../packages/postcssPlugins/postCssPluginRpxToRem')
            ],
            require('../../../packages/postcssPlugins/postCssPluginFixNumber'), // 数字精度插件
            require('../../../packages/postcssPlugins/postCssPluginValidateStyle'),
            require('../../../packages/postcssPlugins/postcssPluginTransformKeyFrames'),
            require('../../../packages/postcssPlugins/postcssPluginRemoveComments')
        ];
        this._postcssOptions = {
            from: this.filepath,
            syntax: require('postcss-scss')
        };
    }
}

module.exports = SassParser;