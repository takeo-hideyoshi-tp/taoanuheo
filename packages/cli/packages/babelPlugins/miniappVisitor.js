const t = require('@babel/types');
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const path = require('path');
const queue = require('../queue');
const utils = require('../utils');
const fs = require('fs-extra');
const config = require('../config');
const buildType = config['buildType'];
const quickhuaweiStyle = require('../quickHelpers/huaweiStyle');
const ignoreAttri = require('../quickHelpers/ignoreAttri');
const transformConfig = require('./transformConfig');
const quickFiles = require('../quickFiles');
const quickConfig = require('../quickHelpers/config');
/* eslint no-console: 0 */
const helpers = require(`../${config[buildType].helpers}/index`);
const deps = [];
//微信的文本节点，需要处理换行符
const inlineElement = {
    text: 1,
    span: 1,
    b: 1,
    strong: 1,
    s: 1,
    em: 1,
    bdo: 1,
    q: 1
};

let cache = {};
if (buildType == 'quick') {
    //快应用不需要放到Component/Page方法中
    utils.createRegisterStatement = function (className, path, isPage) {
        /**
         * placeholderPattern
         * Type: RegExp | false Default: /^[_$A-Z0-9]+$/
         * 
         * A pattern to search for when looking for Identifier and StringLiteral nodes
         * that should be considered placeholders. 'false' will disable placeholder searching
         * entirely, leaving only the 'placeholderWhitelist' value to find placeholders.
         * 
         * isPage: false 时 templateString = console.log(nanachi)
         * 此时如果传入后面的 {CLASSNAME: t.identifier(className)} 
         * 会抛出异常信息 Error: Unknown substitution "CLASSNAME" given
         */
        var templateString = isPage ?
            'CLASSNAME = React.registerPage(CLASSNAME,ASTPATH)' :
            'console.log(nanachi)';
        return isPage ? template(templateString)({
            CLASSNAME: t.identifier(className),
            ASTPATH: t.stringLiteral(path)
        }) : template(templateString)();
    };
}

function registerPageOrComponent(name, path, modules) {
    if (name == modules.className) {
        path.insertBefore(modules.registerStatement);
    }
}
/**
 * JS文件转译器
 */
module.exports = {
    ClassDeclaration: helpers.classDeclaration,
    //babel 6 没有ClassDeclaration，只有ClassExpression
    ClassExpression: helpers.classDeclaration,
    ClassMethod: {
        enter(astPath, state) {
            if (!astPath.node){
                return;
            }
            let modules = utils.getAnu(state);
            let methodName = astPath.node.key.name;
            modules.walkingMethod = methodName;
            if (methodName !== 'constructor') {
                //快应用要转换onLaunch为onCreate
                if (buildType == 'quick' && modules.componentType === 'App') {
                    if (methodName === 'onLaunch') {
                        methodName = 'onCreate';
                    }else if (methodName === 'onHide') {
                        methodName = 'onDestroy';
                    }
                    let dist = path.join(
                        process.cwd(),
                        'dist',
                        'components',
                        'PageWrapper',
                        'index.ux'
                    );
                    if (!cache[dist]) {
                        // // 补丁 queue的占位符, 防止同步代码执行时间过长产生的多次构建结束的问题
                        // const placeholder = {
                        //     code: '',
                        //     path: dist,
                        //     type: 'ux'
                        // };
                        // queue.push(placeholder);
                        // // 补丁 END

                        queue.push({
                            code: fs.readFileSync(
                                path.resolve(
                                    __dirname,
                                    '../quickHelpers/PageWrapper.ux'
                                )
                            ),
                            path: dist,
                            type: 'ux'
                        });
                        cache[dist] = true;
                    }
                }
                let fn = utils.createMethod(astPath, methodName);
                let isStaticMethod = astPath.node.static;
                if (methodName === 'render') {
                    helpers.render.enter(
                        astPath,
                        '有状态组件',
                        modules.className,
                        modules
                    );
                } else {
                    astPath.remove();
                }
                if (isStaticMethod) {
                    // 处理静态方法
                    modules.staticMethods.push(fn);
                } else {
                    modules.thisMethods.push(fn);
                }
            } else {
                let node = astPath.node;
                modules.ctorFn = t.functionDeclaration(
                    t.identifier(modules.className),
                    node.params,
                    node.body,
                    node.generator,
                    false
                );
            }
           
        },
        exit(astPath, state) {
            let methodName = astPath.node.key.name;
            if (methodName === 'render') {
                let modules = utils.getAnu(state);
                //当render域里有赋值时, BlockStatement下面有的不是returnStatement,
                //而是VariableDeclaration
                helpers.render.exit(
                    astPath,
                    '有状态组件',
                    modules.className,
                    modules
                );
                //在render的前面加入var h = React.createElement;
                astPath.node.body.body.unshift(
                    template(utils.shortcutOfCreateElement())()
                );
            }
        }
    },

    FunctionDeclaration: {
        //enter里面会转换jsx中的JSXExpressionContainer
        exit(astPath, state) {
            //函数声明转换为无状态组件
            let modules = utils.getAnu(state);
            let name = astPath.node.id.name;
            if (
                /^[A-Z]/.test(name) && //组件肯定是大写开头
                modules.componentType === 'Component' &&
                !modules.parentName &&
                !modules.registerStatement //防止重复进入
            ) {
                //需要想办法处理无状态组件
                modules.className = name;
                helpers.render.exit(astPath, '无状态组件', name, modules);
                modules.registerStatement = utils.createRegisterStatement(
                    name,
                    name
                );
            }

            if (
                astPath.parentPath.type === 'ExportDefaultDeclaration' &&
                modules.componentType === 'Component'
            ) {
                astPath.node.body.body.unshift(
                    template(utils.shortcutOfCreateElement())()
                );
            }
        }
    },
    ImportDeclaration(astPath, state) {
        let node = astPath.node;
        let modules = utils.getAnu(state);
        let source = node.source.value;
        let specifiers = node.specifiers;

        if (modules.componentType === 'App') {
            //收集页面上的依赖，构成app.json的pages数组或manifest.json中routes数组
            if (/\/pages\//.test(source)) {
                var pages = modules.pages || (modules.pages = []);
                pages.push(source.replace(/^\.\//, ''));
                astPath.remove(); //移除分析依赖用的引用
            }
        }
        if(modules.componentType === 'Component'){
            //这时还没有解析到函数体或类结构，不知道当前组件叫什么名字
            var segments = modules.current.match(/[\w\.]+/g)
            modules.className = segments[segments.length-2]
        }
        if (/\.(less|scss|sass|css)$/.test(path.extname(source))) {
            if(modules.componentType === 'Component'){
                if (/\/pages\//.test(source)) {
                    throw '"'+modules.className+'"组件越级不能引用pages下面的样式\n\t'+source
                }
            }
            astPath.remove();
        }

        specifiers.forEach(item => {
            //重点，保持所有引入的组件名及它们的路径，用于<import />
            if (/\.js$/.test(source)) {
                source = source.replace(/\.js$/, '');
            }
            modules.importComponents[item.local.name] = {
                astPath: astPath,
                source: source
            };
        });
    },

    Program: {
        exit(astPath, state){
            var modules = utils.getAnu(state);
            /**
             * 将生成 JSON 文件的逻辑从 ExportDefaultDeclaration 移除
             * 放入 Program，确保在 babel 的 ast 树解析的最后才执行生成 JSON 文件的逻辑
             */
            if (!/App|Page|Component/.test(modules.componentType)) {
                return;
            }
            var json = modules.config;

            //将app.js中的import语句变成pages数组
            if (modules.componentType === 'App') {
                json.pages = modules.pages;
                delete modules.pages;
            }
            //支付宝在这里会做属性名转换
            helpers.configName(json, modules.componentType);
       
            var keys = Object.keys(modules.usedComponents),
                usings;
            if (keys.length) {
                usings = json.usingComponents || (json.usingComponents = {});
                keys.forEach(function (name) {
                    usings[name] = modules.usedComponents[name];
                });
            }
            if (buildType == 'quick') {
                var obj = quickFiles[modules.sourcePath];
                if (obj) {
                    quickConfig(json, modules, queue, utils);
                    obj.config = Object.assign({}, json);
                }
                // delete json.usingComponents;
                return;
            } else {
                if (modules.componentType === 'Component') {
                    json.component = true;
                }
            }

            //只有非空才生成json文件
            if (Object.keys(json).length) {
                //配置分包
                json = require('../utils/setSubPackage')(modules, json);
                
                //merge ${buildType}Config.json
                json = require('../utils/mergeConfigJson')(modules, json);
                
                
                queue.push({
                    path: utils.updatePath(
                        modules.sourcePath,
                        config.sourceDir,
                        'dist',
                        'json'
                    ),
                    code: JSON.stringify(json, null, 4),
                    type: 'json'
                });
            }
        }
    },
    ExportDefaultDeclaration: {
        exit(astPath, state) {
            var modules = utils.getAnu(state);
            if (/Page|Component/.test(modules.componentType)) {
                let declaration = astPath.node.declaration;
                if (declaration.type == 'FunctionDeclaration') {
                    //将export default function AAA(){}的方法提到前面
                    astPath.insertBefore(declaration);
                    astPath.node.declaration = declaration.id;
                }
                //延后插入createPage语句在其同名的export语句前
                registerPageOrComponent(declaration.name, astPath, modules);
            }
        }
    },

    ExportNamedDeclaration: {
        exit(astPath) {
            //生成 module.exports.default = ${name};
            let declaration = astPath.node.declaration || {
                type: '{}'
            };
            switch (declaration.type) {
                case 'Identifier':
                    astPath.replaceWith(utils.exportExpr(declaration.name));
                    break;
                case 'VariableDeclaration':
                    var id = declaration.declarations[0].id.name;
                    declaration.kind = 'var'; //转换const,let为var
                    astPath.replaceWithMultiple([
                        declaration,
                        utils.exportExpr(id)
                    ]);
                    break;
                case 'FunctionDeclaration':
                    astPath.replaceWithMultiple([
                        declaration,
                        utils.exportExpr(declaration.id.name)
                    ]);
                    break;
                case '{}':
                    astPath.replaceWithMultiple(
                        astPath.node.specifiers.map(function (el) {
                            return utils.exportExpr(el.local.name);
                        })
                    );
                    break;
            }
        }
    },
    ThisExpression:{
        exit(astPath,state){
            let modules = utils.getAnu(state);
            if ( modules.walkingMethod == 'constructor' ){
                var expression = astPath.parentPath.parentPath;
                if (expression.type === 'AssignmentExpression'){
                    var right = expression.node.right;
                    if (!t.isObjectExpression(right)){
                        return;
                    }
                    //将  this.config 变成 static config
                    var propertyName = astPath.container.property.name;
                    if ( propertyName === 'config' && !modules.configIsReady ){     
                        //对配置项进行映射                 
                        transformConfig(modules, expression, buildType);                      
                        var staticConfig = template(`${modules.className}.config = %%CONFIGS%%;`,{
                            syntacticPlaceholders: true
                        })({
                            CONFIGS: right
                        }) ;
                        var classAstPath =  expression.findParent(function (parent) {
                            return parent.type === 'ClassDeclaration';
                        });
                        classAstPath.insertAfter(staticConfig);
                        expression.remove();
                    }
                    // 为this.globalData添加buildType
                    if ( propertyName === 'globalData'){
                        if (modules.componentType === 'App'){
                            var properties = right.properties;
                            var hasBuildType = properties.some(function(el){
                                return el.key.name === 'buildType';
                            });
                            if (!hasBuildType){
                                properties.push( t.objectProperty(
                                    t.identifier('buildType'),
                                    t.stringLiteral(buildType)
                                ));
                                if(buildType === 'quick'){
                                    properties.push( t.objectProperty(
                                        t.identifier('__quickQuery'),
                                        t.objectExpression([])
                                    ));
                                }
                            }
                        }
                    }
                }
               
            }
           
        }
    },
    MemberExpression(astPath,state){
        //处理 static config = {}
        if (astPath.parentPath.type === 'AssignmentExpression'){
            let modules = utils.getAnu(state);
            if (!modules.configIsReady &&
                astPath.node.object.name === modules.className &&
                astPath.node.property.name === 'config'
            ){ 
                transformConfig(modules, astPath.parentPath, buildType);
            }
        }
    },
    
    CallExpression: {
        enter(astPath, state) {
            let node = astPath.node;
            let args = node.arguments;
            let callee = node.callee;
            let modules = utils.getAnu(state);
            //移除super()语句
            if (modules.walkingMethod == 'constructor') {
                if (callee.type === 'Super') {
                    astPath.remove();
                    return;
                }
            }
            //     app.js export default App(new Demo())转换成
            //     export default React.registerApp(new Demo())
            if (
                modules.componentType == 'App' &&
                buildType == 'quick' &&
                callee.type === 'Identifier' &&
                callee.name === 'App'
            ) {
                callee.name = 'React.registerApp';
                return;
            }
            //处理循环语
            if (utils.isLoopMap(astPath)) {
                //添加上第二参数
                if (!args[1] && args[0].type === 'FunctionExpression') {
                    args[1] = t.identifier('this');
                }
                //为callback添加参数
                let params = args[0].params;
                if (!params[0]) {
                    params[0] = t.identifier('j' + astPath.node.start);
                }
                if (!params[1]) {
                    params[1] = t.identifier('i' + astPath.node.start);
                }
                var indexName = args[0].params[1].name;
                if (modules.indexArr) {
                    modules.indexArr.push(indexName);
                } else {
                    modules.indexArr = [indexName];
                }
                modules.indexName = indexName;
            }
        },
        exit(astPath, state) {
            let modules = utils.getAnu(state);
            if (utils.isLoopMap(astPath)) {
                var indexArr = modules.indexArr;
                if (indexArr) {
                    indexArr.pop();
                    if (!indexArr.length) {
                        delete modules.indexArr;
                        modules.indexName = null;
                    } else {
                        modules.indexName = indexArr[indexArr.length - 1];
                    }
                }
            }
        }
    },

    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝处理JSX＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    JSXElement(astPath) {
        let node = astPath.node;
        let nodeName = utils.getNodeName(node);
        if (buildType == 'quick' && !node.closingElement) {
            node.openingElement.selfClosing = false;
            node.closingElement = t.JSXClosingElement(
                // [babel 6 to 7] The case has been changed: jsx and ts are now in lowercase.
                t.jsxIdentifier(nodeName)
            );
        }
    },
    JSXOpeningElement: {
        enter: function (astPath, state) {
            let nodeName = astPath.node.name.name;
            if (nodeName === 'span' && buildType === 'quick') {
                //如果是快应用，<text><span></span></text>不变， <div><span></span></div>变<div><text></text></div>
                let p = astPath.parentPath.findParent(function (parent) {
                    return parent.type === 'JSXElement';
                });

                let parentTagName = p && utils.getNodeName(p.node);
                if (parentTagName === 'text' || parentTagName === 'a') {
                    return;
                }
            }
            
            if (buildType !== 'quick' && nodeName === 'text') {
                //  iconfont 各小程序匹配 去掉小程序下 <text>&#xf1f3;</text>
                var children = astPath.parentPath.node.children;
                if (children.length === 1){
                    let iconValue = t.isJSXText(children[0]) ? children[0].extra.raw : '';
                    let iconReg = /\s*&#x/i;
                    if (iconReg.test(iconValue)) {
                        children.length = 0;
                    }
                }
            }

            let modules = utils.getAnu(state);
            nodeName = helpers.nodeName(astPath, modules) || nodeName;
            let bag = modules.importComponents[nodeName];
            if (!bag) {
                var oldName = nodeName;
                //button --> Button
                nodeName = helpers.nodeName(astPath, modules) || oldName;
                if (oldName !== oldName) {
                    bag = modules.importComponents[nodeName];
                }
            }
            if (buildType === 'quick') {
                ignoreAttri(astPath, nodeName);
            }


            if (bag) {
                //好像不支持render props后，它就没有用了
                // deps[nodeName] ||
                //     (deps[nodeName] = {
                //         set: new Set()
                //     });
                // astPath.componentName = nodeName;

                try {
                    bag.astPath.remove();
                    bag.astPath = null;
                } catch (err) {
                    // eslint-disable-next-line
                }

                let useComponentsPath = utils.getUsedComponentsPath(bag, nodeName, modules);

                modules.usedComponents['anu-' + nodeName.toLowerCase()] = useComponentsPath;
                astPath.node.name.name = 'React.useComponent';

                // eslint-disable-next-line
                var attrs = astPath.node.attributes;
                // ?？？这个还有用吗
                modules.is && modules.is.push(nodeName);
                attrs.push(
                    t.JSXAttribute(
                        // [babel 6 to 7] The case has been changed: jsx and ts are now in lowercase.
                        t.jsxIdentifier('is'),
                        t.jSXExpressionContainer(t.stringLiteral(nodeName))
                    )
                );

                attrs.push(
                    utils.createAttribute(
                        'data-instance-uid',
                        utils.createDynamicAttributeValue(
                            'i',
                            astPath,
                            modules.indexArr || ['0']
                        )
                    )
                );
            } else {
                if (nodeName != 'React.useComponent') {
                    helpers.nodeName(astPath, modules);
                }
            }
        }
    },
    JSXClosingElement: function (astPath) {
        var tagName = utils.getNodeName(astPath.parentPath.node);
        astPath.node.name.name = tagName;
    },
    JSXAttribute: {
        enter: function (astPath, state) {
            let attrName = astPath.node.name.name;
            let attrValue = astPath.node.value;
            let parentPath = astPath.parentPath;
            let modules = utils.getAnu(state);

          
            //处理静态资源@assets/xxx.png别名
            if (t.isStringLiteral(attrValue)) {
                let srcValue = attrValue && attrValue.value;
                if (attrName === 'src' && /^(@assets)/.test(srcValue)) {
                    let realAssetsPath = path.join(
                        process.cwd(),
                        srcValue.replace(/@/, '')
                    );
                    let relativePath = path.relative(
                        path.dirname(modules.sourcePath),
                        realAssetsPath
                    );
                    astPath.node.value.value = relativePath;
                }
                // 快应用下 string类型的行内样式 rpx 会换算成px
                if (attrName === 'style' && buildType == 'quick') {
                    let value = quickhuaweiStyle(attrValue, true);
                    astPath.node.value = t.stringLiteral(value.slice(1, -1));
                }
            } else if (t.isJSXExpressionContainer(attrValue)) {
                let attrs = parentPath.node.attributes;
                let expr = attrValue.expression;
                let nodeName = parentPath.node.name.name;

                if (attrName === 'style') {
                    //将动态样式封装到React.toStyle中
                    var styleType = expr.type;
                    var MemberExpression = styleType === 'MemberExpression';
                    var isIdentifier = styleType === 'Identifier';
                    // 华为编辑器行内样式特殊处理

                    // if (config.huawei) {
                    //     if (styleType === 'ObjectExpression') {
                    //         let code = quickhuaweiStyle(expr);
                    //         astPath.node.value = t.stringLiteral(code);
                    //         return;
                    //     }
                    // }
                    if (
                        isIdentifier ||
                        MemberExpression ||
                        styleType === 'ObjectExpression'
                    ) {
                        var ii = modules.indexArr ?
                            modules.indexArr.join('+\'-\'+') :
                            '';
                        var styleRandName =
                            `'style${utils.createUUID(astPath)}'` +
                            (ii ? ' +' + ii : '');
                        //Identifier 处理形如 <div style={formItemStyle}></div> 的style结构
                        //MemberExpression 处理形如 <div style={this.state.styles.a}></div> 的style结构
                        //ObjectExpression 处理形如 style={{ width: 200, borderWidth: '1px' }} 的style结构


                        var styleName = isIdentifier ?
                            expr.name :
                            generate(expr).code;
                        attrs.push(
                            utils.createAttribute(
                                'style',
                                t.jSXExpressionContainer(
                                    t.identifier(
                                        `React.toStyle(${styleName}, this.props, ${styleRandName})`
                                    )
                                )
                            )
                        );
                        astPath.remove();
                    }
                } else if (attrName == 'hidden') {
                    if (buildType === 'quick') {
                        //在快应用下hidden={a}变成show={!a}
                        astPath.node.name.name = 'show';
                        attrValue.expression = t.unaryExpression(
                            '!',
                            expr,
                            true
                        );
                    }
                } else if (
                    /^(?:on|catch)[A-Z]/.test(attrName) &&
                    !/[A-Z]/.test(nodeName)
                ) {
                    //如果这是普通标签上的事件名
                    var prefix = attrName.charAt(0) == 'o' ? 'on' : 'catch';
                    var eventName = attrName.replace(prefix, '');
                    var otherEventName = utils.getEventName(
                        eventName,
                        nodeName,
                        buildType
                    );
                    //改事件名， onTap与onClick, onChange与onInput
                    if (otherEventName !== eventName) {
                        astPath.node.name.name = prefix + otherEventName;
                        eventName = otherEventName;
                    }

                    //事件存在的标签，必须添加上data-eventName-uid, data-beacon-uid
                    var name = `data-${eventName.toLowerCase()}-uid`;
                    attrs.push(
                        utils.createAttribute(
                            name,
                            utils.createDynamicAttributeValue(
                                'e',
                                astPath,
                                modules.indexArr
                            )
                        )
                    );
                    //data-beacon-uid是用于实现日志自动上传
                    if (
                        !attrs.setClassCode &&
                        !attrs.some(function (el) {
                            return el.name.name == 'data-beacon-uid';
                        })
                    ) {
                        //自动添加
                        attrs.push(
                            utils.createAttribute('data-beacon-uid', 'default')
                        );
                    }
                    attrs.setClassCode = true;

                }
            }
        }
    },

    JSXText(astPath) {
        //去掉内联元素内部的所有换行符
        if (astPath.parentPath.type == 'JSXElement') {
            var textNode = astPath.node;
            var value = textNode.extra.raw = textNode.extra.rawValue.trim();
            if (value === '') {
                astPath.remove();
                return;
            }
            var parentTagName = utils.getNodeName(astPath.parentPath.node);
            if (
                /quick|wx/.test(config.buildType) &&
                inlineElement[parentTagName]
            ) {
                textNode.value = value;
            }
        }
    },
    JSXExpressionContainer(astPath) {
        var expr = astPath.node.expression; //充许在JSX这样使用注释 ｛/** comment **/｝
        if (expr && expr.type == 'JSXEmptyExpression') {
            if (expr.innerComments && expr.innerComments.length) {
                astPath.remove();
            }
        }
    }
};