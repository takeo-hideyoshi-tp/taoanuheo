#!/usr/bin/env node
'use strict';
const chalk = require('chalk');
const semver = require('semver');
const program = require('commander');

if (semver.lt(process.version, '8.6.0')) {
    // eslint-disable-next-line
    console.log(
        chalk`nanachi only support {green.bold v8.6.0} or later (current {green.bold ${
            process.version
        }}) of Node.js`
    );
    process.exit(1);
}

program
    .name('nanachi')
    .usage('<command>')
    .version(require('../package.json').version, '-v, --version')
    .option('-b, --beta', 'sync React lib');
    

program.command('init <project-name>').description('初始化项目');

program
    .command('watch:[wx|ali|bu|quick|tt]')
    .description('监听[ 微信小程序 | 支付宝小程序 | 百度智能小程序 | 快应用 | 头条小程序]')
    .option('--beta', '同步React');

program
    .command('build:[wx|ali|bu|quick|tt]')
    .description('构建[ 微信小程序 | 支付宝小程序 | 百度智能小程序 | 快应用 | 头条小程序]')
    .option('--beta', '同步React');
    

program.parse(process.argv);
if (program.args.length === 0) program.help();

const config = require('../packages/config');
const args = program.args;
const option = program.rawArgs[program.rawArgs.length-1];



function getBuildType(args) {
    let type = args[0].split(':')[1];
    type = !type ? 'wx' : type.toLowerCase();
    return type;
}

/* eslint-disable */
if (args[0] === 'init' && typeof args[1] === 'undefined') {
    console.error('请指定项目名称');
    console.log(
        `  ${chalk.cyan(program.name())} init ${chalk.green(
            '<project-name>'
        )}\n`
    );
    console.log('例如:\n');
    console.log(
        `  ${chalk.cyan(program.name())} init ${chalk.green('nanachi-app')}`
    );
    process.exit(1);
}

let buildType = getBuildType(args);
/* eslint-disable */
if (!config[buildType]) {
    let type = args[0].split(':');
    console.log(chalk.red('请检查命令是否正确'));
    console.log(chalk.green(`nanachi ${type[0]}:[wx|bu|ali|quick|tt]`));
    process.exit(1);
}

process.env.ANU_ENV = buildType;


config['buildType'] = buildType;

let command = args[0];
if (/\:/.test(command)) {
    //<watch|build>:
    command = command.split(':')[0];
}

if(
    program.rawArgs[program.rawArgs.length-1] == '-c' ||
    program.rawArgs[program.rawArgs.length-1] == '--compress'
){
    config['compress'] = true;
}

switch (command) {
    case 'watch':
        require('../packages/index')('watch', { buildType, option });
        break;
    case 'build':
        require('../packages/index')('build', { buildType, option });
        break;
    case 'init':
        require('../packages/init')(args[1]);
        break;
    case 'web-start':
        require('mini-html5/runkit/run');
        break;
    case 'web-build':
        require('mini-html5/runkit/build');
        break;
    default:
        console.log(chalk.green('初始化项目: nanachi init <project-name>'));
}
