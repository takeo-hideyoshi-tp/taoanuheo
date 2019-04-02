const path = require('path');
const postcss = require('postcss');
const utils = require('../../../packages/utils/index');
const quickFiles = require('../../../packages/quickFiles');
const fs = require('fs');

class StyleParser {
    constructor({
        code,
        map,
        meta,
        filepath,
        platform,
        type
    }) {
        this.code = code || fs.readFileSync(filepath, 'utf-8');
        this.map = map;
        this.meta = meta;
        this.filepath = filepath;
        this.type = type;
        this.platform = platform;
        this.relativePath = path.relative(path.resolve(process.cwd(), 'source'), filepath);
        this._postcssPlugins = [];
        this._postcssOptions = {};
        this.parsedCode = '';
        this.extraModules = [];
    }
    
    async parse() {
        const res = await new Promise((resolve, reject) => {
            postcss(this._postcssPlugins).process(this.code, this._postcssOptions).then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            });
        });
        const deps = utils.getDeps(res.messages);
        if (deps) {
            this.extraModules = deps.map(d => d.file);
        }
        this.parsedCode = res.css;
        return res;
    }
    getExtraFiles() {
        return [{
            type: 'css',
            path: this.relativePath,
            code: this.parsedCode,
        }];
    }
    getExportCode() {
        let res = `module.exports=${JSON.stringify(this.parsedCode)};`;
        this.extraModules.forEach(module => {
            res = `import '${module}';\n` + res;
        });
        return res;
    }
}

module.exports = StyleParser;