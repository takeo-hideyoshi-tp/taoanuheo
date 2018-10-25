/* eslint no-console: 0 */

const path = require('path');
const cwd = process.cwd();
const queue = require('./queue');
const config = require('./config');
const utils = require('./utils');
const validateStyle = require('./validateStyle');

const isLess = (filePath) => {
    return /\.less$/.test(filePath);
};
const isCss = (filePath) => {
    return /\.css$/.test(filePath);
};
const isSass = (filePath) => {
    return /\.(scss|sass)$/.test(filePath);
};
const getDist = (filePath) => {
    let { name, dir } = path.parse(filePath);
    let relativePath = path.relative( path.join(cwd, config.sourceDir), dir);
    let distDir = path.join(cwd, config.buildDir , relativePath);
    let styleExt = config[config['buildType']].styleExt; //获取构建的样式文件后缀名
    let distFilePath = path.join(distDir, `${name}.${styleExt}`);
    return distFilePath;
};

var less = require('less');
/* eslint-disable */
const compileLess = (filePath, originalCode) => {
   
    less.render(
        originalCode,
        {
            filename: filePath
        }
    )
        .then(res => {
            let code = validateStyle(res.css);
            queue.push({
                code: code,
                path: getDist(filePath),
                type: 'css'
            });
        })
        .catch(err => {
            if (err) {
                console.log(err);
            }
        });
};

const renderSass = (filePath) => {
    let sass = require(path.join(cwd, 'node_modules', 'node-sass'));
    sass.render(
        {
            file: filePath
        },
        (err, res) => {
            if (err) throw err;
            let code = validateStyle(res.css.toString());
            queue.push({
                code: code,
                path: getDist(filePath),
                type: 'css'
            });
        }
    );
};
const compileSass = (filePath) => {
    try {
        require(path.join(cwd, 'node_modules', 'node-sass', 'package.json'));
    } catch (err) {
        utils.installer('node-sass')
    }
    renderSass(filePath);
};


module.exports = (data) => {
    let {id, originalCode} = data;
    if (isLess(id) || isCss(id)) {
        compileLess(id, originalCode);
    } else if (isSass(id)) {
        compileSass(id);
    }
};
