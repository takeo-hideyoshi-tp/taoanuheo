/*!
输出命令行提示与选择模板
*/
/* eslint-disable */
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const cwd = process.cwd();
const inquirer = require('inquirer');

function checkAppName(appName){
    let appPath = path.join(cwd, appName);
    let {validForNewPackages, warnings} = validateProjectName( path.parse(appName).base );
    if (!validForNewPackages) {
        console.log(chalk.red('Error: 项目名称不能包含大写字母'));
        process.exit(1);
    }
    return appPath;
}

const askTemplate = () => {
    const q = [];
    const list = [
        {
            name: '去哪儿',
            value: 'qunar'
        },
        {
            name: '网易云音乐',
            value: 'music'
        },
        {
            name: '拼多多',
            value: 'pdd'
        },
        {
            name: '默认模板',
            value: 'helloNanachi'
        }
    ];
    q.push({
        type: 'list',
        name: 'appTplName',
        message: '请选择模板',
        choices: list
    });
    return inquirer.prompt(q);
};

function copyTemplate(data){
    let { appTplName, appPath} = data;
    let tplSrc = path.join( __dirname, '..', 'templates',  appTplName);
    let appName = path.basename(appPath);
    if (fs.existsSync(appPath)) {
        console.log(chalk.red(`目录 ${appName} 已存在\n`));
        process.exit(1);
    }

    fs.ensureDirSync(appPath);
    fs.copySync(tplSrc, appPath);
    console.log(
        `\n项目 ${chalk.green(appName)} 创建成功, 路径: ${chalk.green(
            appPath
        )}\n`
    );

    console.log(chalk.green('nanachi watch'));
    console.log(`  实时构建项目, 
                   \t或使用nanachi watch:ali 构建支付宝小程序
                   \t或使用nanachi watch:tt 构建头条小程序
                   \t或使用nanachi watch:quick 构建快应用
                   \t或使用nanachi watch:bu 构建百度智能小程序
                   \t或使用nanachi watch:h5 构建h5`);
    console.log();
    console.log(chalk.green('nanachi build'));
    console.log(`  构建项目(构建出错的情况下，修复后需要强制全量构建), 
                   \t或使用nanachi build:ali 构建支付宝小程序
                   \t或使用nanachi build:tt 构建头条小程序
                   \t或使用nanachi build:quick 构建快应用
                   \t或使用nanachi build:bu 构建百度智能小程序
                   \t或使用nanachi build:h5 构建h5`);
    console.log();
    console.log(
        chalk.magenta(
            '请敲入下面两行命令，享受您的开发之旅' +
                chalk.magenta.bold('(npm i可改成yarn)')
        )
    );
    console.log();
    console.log(`  cd ${ path.relative(cwd, appPath) } && npm i `);
    console.log('  nanachi watch');
    console.log();
}

async function init(appName){
    const appPath = checkAppName(appName);
    const { appTplName } = await askTemplate();
    copyTemplate({ appPath, appTplName})
}

module.exports = init;
