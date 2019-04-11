const StyleParser = require('./StyleParser');
const utils = require('../../../packages/utils/index');
const { MAP } = require('../../../consts/index');

class LessParser extends StyleParser {
    constructor(props) {
        super(props);
        this._postcssPlugins = [
            require('postcss-import')({
                resolve: function(importer, baseDir){
                    //如果@import的值没有文件后缀
                    if (!/\.less$/.test(importer)) {
                        importer = importer + '.less';
                    }
                    //处理alias路径
                    return utils.resolveStyleAlias(importer, baseDir);
                },
                plugins: [
                    require('../../../packages/postcssPlugins/postCssPluginRemoveRules') // 删除import文件的所有rules，保留@mixins、$variables、@functions等
                ]
            }),
            require('../../../packages/postcssPlugins/postcssPluginLessParser'),
            require('../../../packages/postcssPlugins/postcssPluginAddImport')({
                extName: MAP[this.platform]['EXT_NAME'][this.type],
                type: this.type,
            }),
            require('../../../packages/postcssPlugins/postCssPluginFixNumber'),
            require('../../../packages/postcssPlugins/postCssPluginValidateStyle'),
            require('../../../packages/postcssPlugins/postcssPluginRemoveComments')
        ];
        this._postcssOptions = {
            from: this.filepath,
            parser: require('postcss-less')
        };
    }
}

module.exports = LessParser;