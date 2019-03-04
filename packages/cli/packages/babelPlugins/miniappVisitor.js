const t = require('@babel/types');
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const path = require('path');
const queue = require('../queue');
const utils = require('../utils');
const fs = require('fs-extra');
const deps = [];
const config = require('../config');
const buildType = config['buildType'];
const quickFiles = require('../quickFiles');
const quickConfig = require('../quickHelpers/config');
/* eslint no-console: 0 */
const helpers = require(`../${buildType}Helpers/index`);
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
    utils.createRegisterStatement = function(className, path, isPage) {
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
        var templateString = isPage
            ? 'CLASSNAME = React.registerPage(CLASSNAME,ASTPATH)'
            : 'console.log(nanachi)';
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
            let modules = utils.getAnu(state);
            let methodName = astPath.node.key.name;
            modules.walkingMethod = methodName;
            if (methodName !== 'constructor') {
                //快应用要转换onLaunch为onCreate
                if (buildType == 'quick' && modules.componentType === 'App') {
                    if (methodName === 'onLaunch') {
                        methodName = 'onCreate';
                    }
                    let dist = path.join(
                        process.cwd(),
                        'dist',
                        'components',
                        'PageWrapper',
                        'index.ux'
                    );
                    if (!cache[dist]) {
                        // 补丁 queue的占位符, 防止同步代码执行时间过长产生的多次构建结束的问题
                        const placeholder = {
                            code: '',
                            path: dist,
                            type: 'ux'
                        };
                        queue.push(placeholder);
                        // 补丁 END

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
                modules.thisMethods.push(fn);
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

            helpers.render.enter(
                astPath,
                '有状态组件',
                modules.className,
                modules
            );
        },
        exit(astPath, state) {
            var modules = utils.getAnu(state);
            const methodName = astPath.node.key.name;
            if (methodName === 'render') {
                //当render域里有赋值时, BlockStatement下面有的不是returnStatement,
                //而是VariableDeclaration
                helpers.render.exit(
                    astPath,
                    '有状态组件',
                    modules.className,
                    modules
                );
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

        if (/\.(less|scss|sass|css)$/.test(path.extname(source))) {
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

            //将配置对象生成JSON文件
            if (!/App|Page|Component/.test(modules.componentType)) {
                return;
            }
            var json = modules.config;
            
            //将app.js中的import语句变成pages数组
            if (modules.componentType === 'App') {
                json.pages = modules.pages;
                delete modules.pages;
            }

            helpers.configName(json, modules.componentType);
            
            var keys = Object.keys(modules.usedComponents),
                usings;
            if (keys.length) {
                usings = json.usingComponents || (json.usingComponents = {});
                keys.forEach(function(name) {
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
                if (Object.keys(json).length) {
                    var a = template('0,' + JSON.stringify(json, null, 4))();
                    var keyValue = t.ObjectProperty(
                        t.identifier('config'),
                        a.expression.expressions[1]
                    );
                    modules.thisMethods.push(keyValue);
                }
                return;
            } else {
                if (modules.componentType === 'Component') {
                    json.component = true;
                }
            }
           
            //只有非空才生成json文件
            if (Object.keys(json).length) {
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

    ExportNamedDeclaration: {
        exit(astPath) {
            //生成 module.exports.default = ${name};
            let declaration = astPath.node.declaration || { type: '{}' };
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
                        astPath.node.specifiers.map(function(el) {
                            return utils.exportExpr(el.local.name);
                        })
                    );
                    break;
            }
        }
    },
    // ClassProperty: {
    //     exit(astPath, state) {
    //         let key = astPath.node.key.name;
    //         let modules = utils.getAnu(state);
    //         if (key === 'config') {
    //             //将配置对象生成JSON文件
    //             if (!/App|Page|Component/.test(modules.componentType)) {
    //                 return;
    //             }
    //             try {
    //                 var json = eval('0,' + generate(astPath.node.value).code);

    //                 Object.assign(modules.config, json);
    //             } catch (e) {
    //                 /**/
    //             }
    //         } else if (astPath.node.static) {
    //             var keyValue = t.ObjectProperty(
    //                 t.identifier(key),
    //                 astPath.node.value
    //             );
    //             modules.staticMethods.push(keyValue);
    //         } else {
    //             if (key == 'globalData' && modules.componentType === 'App') {
    //                 //globalData中插入平台buildType
    //                 astPath.node.value.properties.push(
    //                     t.objectProperty(
    //                         t.identifier('buildType'),
    //                         t.stringLiteral(config.buildType)
    //                     )
    //                 );
    //                 var thisMember = t.assignmentExpression(
    //                     '=',
    //                     t.memberExpression(
    //                         t.identifier('this'),
    //                         t.identifier(key)
    //                     ),
    //                     astPath.node.value
    //                 );
    //                 modules.thisProperties.push(thisMember);
    //             }
    //         }
    //         astPath.remove();
    //     }
    // },
    MemberExpression: {
        exit(astPath, state) {
            const member = generate(astPath.node).code;
            let modules = utils.getAnu(state);
            // visitor 中的 ClassProperty 没有访问, 使用 MemberExpression 解析静态属性
            if (member.includes(`${modules.className}.`)) {
                var keyValue = t.ObjectProperty(
                    t.identifier(astPath.node.property.name),
                    astPath.parentPath.get('right').node
                );
                modules.staticMethods.push(keyValue);
                astPath.findParent(t.isExpressionStatement).remove();
            }
        }
    },
    // visitor 中的 ClassProperty 没有访问, 
    // 使用 AssignmentExpression 解析 config 和 globalData
    AssignmentExpression:{
        exit(astPath, state) {
            const member = generate(astPath.get('left').node).code;
            const isObj = t.isObjectExpression(astPath.get('right').node);
            let modules = utils.getAnu(state);
            // 判断格式是否为： this.config = {}
            if (member === 'this.config' && isObj){
                if (/App|Page|Component/.test(modules.componentType)) {
                    try {
                        var json = eval('0,' + generate(astPath.get('right').node).code);
                        Object.assign(modules.config, json);
                    } catch (e) {
                        console.log('eval json error', e);
                    }
                }
            }
            // 判断格式是否为： this.globalData = {}
            if (member === 'this.globalData' && isObj && modules.componentType === 'App') {
                // 如果没有 buildType 属性, 在 globalData 中插入平台buildType
                if (!generate(astPath.get('right').node).code.includes('buildType')){
                    astPath.get('right').node.properties.push(
                        t.objectProperty(
                            t.identifier('buildType'),
                            t.stringLiteral(config.buildType)
                        )
                    );
                    var thisMember = t.assignmentExpression(
                        '=',
                        t.memberExpression(
                            t.identifier('this'),
                            t.identifier('globalData')
                        ),
                        astPath.get('right').node
                    );
                    modules.thisProperties.push(thisMember);
                }
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

            if (callee.property && callee.property.name == 'render') {
                var p = astPath,
                    checkIndex = 4,
                    d;
                while (p.type != 'JSXElement') {
                    if (p.type === 'JSXExpressionContainer') {
                        d = p;
                    }
                    p = p.parentPath;

                    if (checkIndex-- == 0) {
                        break;
                    }
                }
                if (p.type === 'JSXElement' && d) {
                    //<React.renderProps />
                    var renderProps = utils.createElement(
                        'React.toRenderProps',
                        [],
                        []
                    );
                    var arr = p.node.children;
                    var json = modules.config;
                    if (!json.usingComponents) {
                        json.usingComponents = {
                            'anu-render': '/components/RenderProps/index'
                        };
                    } else {
                        json.usingComponents['anu-render'] =
                            '/components/RenderProps/index';
                    }
                    var index = arr.indexOf(d.node);
                    if (index !== -1) {
                        //插入React.toRenderProps标签
                        arr.splice(index, 0, renderProps);
                    }
                }
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
        enter: function(astPath, state) {
            let nodeName = astPath.node.name.name;
            if (nodeName === 'span' && buildType === 'quick'){
                //如果是快应用，<text><span></span></text>不变， <div><span></span></div>变<div><text></text></div>
                let p = astPath.parentPath.findParent(function(parent){
                    return  parent.type === 'JSXElement';
                });
                
                let parentTagName = p && utils.getNodeName(p.node);
                if (parentTagName === 'text'|| parentTagName === 'a'){
                    return;
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
            if (bag) {
                deps[nodeName] ||
                    (deps[nodeName] = {
                        set: new Set()
                    });
                astPath.componentName = nodeName;

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
    JSXClosingElement: function(astPath) {
        var tagName = utils.getNodeName(astPath.parentPath.node);
        astPath.node.name.name = tagName;
    },
    JSXAttribute: {
        enter: function(astPath, state) {
            let attrName = astPath.node.name.name;
            let attrValue = astPath.node.value;
            let parentPath = astPath.parentPath;
            let modules = utils.getAnu(state);

            let srcValue = attrValue && attrValue.value;
            //处理静态资源@assets/xxx.png别名
            if (attrName === 'src' && srcValue && /^(@assets)/.test(srcValue)) {
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

            if (t.isJSXExpressionContainer(attrValue)) {
                let modules = utils.getAnu(state);
                let attrs = parentPath.node.attributes;
                let expr = attrValue.expression;
                let nodeName = parentPath.node.name.name;
                if (
                    /^(?:on|catch)[A-Z]/.test(attrName) &&
                    !/[A-Z]/.test(nodeName)
                ) {
                    var prefix = attrName.charAt(0) == 'o' ? 'on' : 'catch';
                    var eventName = attrName.replace(prefix, '');
                    var otherEventName = utils.getEventName(
                        eventName,
                        nodeName,
                        buildType
                    );
                    if (otherEventName !== eventName) {
                        astPath.node.name.name = prefix + otherEventName;
                        eventName = otherEventName;
                    }

                    //事件存在的标签，必须添加上data-eventName-uid, data-class-uid, data-instance-uid
                    var name = `data-${eventName.toLowerCase()}-uid`;
                    attrs.push(
                        utils.createAttribute(
                            name,
                            utils.createDynamicAttributeValue(
                                'e',
                                astPath,
                                modules.indexArr
                            )
                            //  "e" + utils.createUUID(astPath)
                        )
                    );
                    //以下标签，如果绑定了事件，我们会加上data-beacon-uid，实现日志自动上传
                    if (
                        !attrs.setClassCode &&
                        !attrs.some(function(el) {
                            return el.name.name == 'data-beacon-uid';
                        })
                    ) {
                        //自动添加
                        attrs.push(
                            utils.createAttribute('data-beacon-uid', 'default')
                        );
                    }
                    attrs.setClassCode = true;
                } else if (attrName === 'style') {
                    //将动态样式封装到React.toStyle中
                    var styleType = expr.type;
                    var MemberExpression = styleType === 'MemberExpression';
                    var isIdentifier = styleType === 'Identifier';
                    if (
                        isIdentifier ||
                        MemberExpression ||
                        styleType === 'ObjectExpression'
                    ) {
                        var ii = modules.indexArr
                            ? modules.indexArr.join('+\'-\'+')
                            : '';
                        var styleRandName =
                            `'style${utils.createUUID(astPath)}'` +
                            (ii ? ' +' + ii : '');
                        //Identifier 处理形如 <div style={formItemStyle}></div> 的style结构
                        //MemberExpression 处理形如 <div style={this.state.styles.a}></div> 的style结构
                        //ObjectExpression 处理形如 style={{ width: 200, borderWidth: '1px' }} 的style结构
                        var styleName = isIdentifier
                            ? expr.name
                            : generate(expr).code;
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
                } else if (attrName == 'render') {
                    var type = expr.type;
                    if (
                        type === 'FunctionExpression' ||
                        type == 'ArrowFunctionExpression'
                    ) {
                        var uuid = 'render' + utils.createUUID(astPath);
                        attrs.push(utils.createAttribute('renderUid', uuid));
                        parentPath.renderProps = attrValue;
                        parentPath.renderUid = uuid;
                        modules.is = [];
                    }
                } else if (buildType === 'quick') {
                    if (attrName == 'hidden') {
                        //在快应用下hidden={a}变成show={!a}
                        astPath.node.name.name = 'show';
                        attrValue.expression = t.unaryExpression(
                            '!',
                            expr,
                            true
                        );
                    } 
                }
            }
        },
        exit(astPath, state) {
            let attrName = astPath.node.name.name;
            if (attrName == 'render' && astPath.parentPath.renderProps) {
                let attrValue = astPath.parentPath.renderProps;
                let fragmentUid = astPath.parentPath.renderUid;
                delete astPath.parentPath.renderProps;
                let modules = utils.getAnu(state);
                let subComponents = {};
                modules.is.forEach(function(a) {
                    subComponents[a] = path.join('..', a, 'index');
                });

                helpers.render.exit(
                    {
                        node: attrValue.expression
                    },

                    'RenderProps',
                    fragmentUid,
                    {
                        sourcePath: path.join(
                            process.cwd(),
                            config.sourceDir,
                            'components',
                            'RenderProps',
                            'index.js'
                        ),
                        componentType: 'Component',
                        importComponents: subComponents,
                        usedComponents: modules.usedComponents
                    }
                );
            }
        }
    },

    JSXText(astPath) {
        //去掉内联元素内部的所有换行符
        if (astPath.parentPath.type == 'JSXElement') {
          
            var parentTagName = utils.getNodeName(astPath.parentPath.node);
            var value = astPath.node.value.trim();
            if (value === '') {
                astPath.remove();
                return;
            }
            if (
                /quick|wx/.test(config.buildType) &&
                inlineElement[parentTagName]
            ) {
                astPath.node.value = value;
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
