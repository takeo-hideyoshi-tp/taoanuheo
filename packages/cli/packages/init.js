const utils = require('./utils/index');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const spawn = require('cross-spawn');
const Handlebars = require('handlebars');
const inquirer = require('inquirer');
const ownRoot = path.join(__dirname, '..');
const exists = fs.existsSync;

const ignore = new Set(['.DS_Store']);

const pkgJsonTemplate = {
    license: 'MIT',
    version: '1.0.0',
    name: '{{appName}}',
    mpreact: {
        alias: {
            '@react': 'src/ReactWX.js',
            '@components': 'src/components'
        }
    },
    devDependencies: {
        'babel-generator': '^6.26.1',
        'babel-jest': '^22.4.3',
        'babel-plugin-istanbul': '^4.1.1',
        'babel-plugin-module-resolver': '^3.1.1',
        'babel-plugin-syntax-async-generators': '^6.13.0',
        'babel-plugin-syntax-class-properties': '^6.13.0',
        'babel-plugin-transform-class-properties': '^6.24.1',
        'babel-plugin-transform-decorators-legacy': '^1.3.5',
        'babel-plugin-transform-es2015-classes': '^6.24.1',
        'babel-plugin-transform-es2015-modules-commonjs': '^6.26.2',
        'babel-plugin-transform-object-rest-spread': '^6.26.0',
        'babel-plugin-transform-react-jsx': '^6.24.1',
        'babel-plugin-transform-react-jsx-source': '^6.22.0',
        'babel-plugin-transform-runtime': '^6.23.0',
        'babel-preset-es2015': '^6.24.1',
        'babel-preset-react': '^6.24.1',
        'babel-preset-stage-0': '^6.24.1',
        'babel-runtime': '^6.26.0',
        'babel-template': '^6.26.0',
        'babel-traverse': '^6.26.0',
        'babel-types': '^6.26.0'
    },
    'dependencies': {
        'weapp-async-await': '^1.0.1'
    }
};

const init = appName => {
    checkNameIsOk(appName)
        .then(() => {
            return ask();
        })
        .then(res => {
            if (res.css === 'scss') {
                pkgJsonTemplate['devDependencies']['node-sass'] = '^4.9.3';
            }

            writeDir(appName);
        })
        .catch(err => {
            // eslint-disable-next-line
            console.log(err);
        });
};

const checkNameIsOk = appName => {
    return new Promise(resolve => {
        let absoluteAppNamePath = path.resolve(appName);
        let baseName = path.basename(absoluteAppNamePath);
        const checkNameResult = validateProjectName(baseName);
        if (!checkNameResult.validForNewPackages) {
            // eslint-disable-next-line
            console.log();
            // eslint-disable-next-line
            console.log(
                chalk.bold.red(
                    `命名规范遵循npm package命名规范\nERR_MSG : ${
                        checkNameResult.warnings[0]
                    }`
                )
            );
            // eslint-disable-next-line
            console.log();
            process.exit(1);
        } else {
            resolve({
                ok: true,
                appName: absoluteAppNamePath
            });
        }
    });
};

const ask = () => {
    const q = [];
    const css = [
        {
            name: 'Less',
            value: 'less'
        },
        {
            name: 'Sass',
            value: 'scss'
        }
    ];

    q.push({
        type: 'list',
        name: 'css',
        message: '请选择 CSS 预处理器 (Less/Sass)',
        choices: css
    });

    return inquirer.prompt(q);
};

const writePkgJson = appName => {
    let template = Handlebars.compile(JSON.stringify(pkgJsonTemplate));
    let data = {
        appName: path.basename(appName)
    };
    let result = JSON.parse(template(data));
    fs.writeFileSync(
        path.join(appName, 'package.json'),
        JSON.stringify(result, null, 4)
    );
};

const writeDir = appName => {
    if (exists(appName)) {
        // eslint-disable-next-line
        console.log();
        // eslint-disable-next-line
        console.log(chalk.bold.red(`目录 ${appName} 已存在,请检查!`));
        // eslint-disable-next-line
        console.log();
        process.exit(1);
    }

    //复制模板
    fs.ensureDirSync(appName);
    const templates = fs.readdirSync(
        path.join(ownRoot, 'packages', 'template')
    );
    templates.forEach(item => {
        if (ignore.has(item)) return;
        let src = path.join(ownRoot, 'packages', 'template', item);
        let dest = path.join(appName, item);
        fs.copySync(src, dest);
    });

    /**
     * 换行符了解一下？？？
     */
    // eslint-disable-next-line
    console.log(
        `\n项目 ${chalk.green(appName)} 创建成功, 路径: ${chalk.green(
            appName
        )}\n`
    );

    //写入package.json
    writePkgJson(appName);
    // console.log();
    /**
     * 换行符了解一下？？？
     */
    // eslint-disable-next-line
    console.log(chalk.green('\n开始安装依赖,请稍候...\n'));
    // console.log();
    //安装依赖
    install(appName);
};

const install = projectRoot => {
    let bin = '';
    let option = ['install'];
    process.chdir(projectRoot);
    if (utils.useYarn()) {
        bin = 'yarn';
    } else if (utils.useCnpm()) {
        bin = 'cnpm';
    } else {
        bin = 'npm';
    }

    var result = spawn.sync(bin, option, { stdio: 'inherit' });
    if (!result.error) {
        /* eslint-disable */
        console.log(chalk.green('依赖安装完毕!🍺'));
        console.log();
        console.log(chalk.green('mpreact start'));
        console.log('  启动服务');
        console.log();
        console.log(chalk.green('mpreact build'));
        console.log('  构建服务');
        console.log();
        console.log(chalk.magenta('请敲入下面两行命令，享受您的开发之旅!'));
        console.log();
        console.log(`  cd ${projectRoot}`);
        console.log('  mpreact start');
        console.log();
    } else {
        console.log(chalk.red('依赖安装出错，请自行安装!'));
        console.log();
    }
    /* eslint-enable */
};

module.exports = init;
