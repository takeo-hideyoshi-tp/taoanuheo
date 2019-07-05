const template = require('@babel/template').default;

const importedPagesTemplatePrefixCode = template(`
import ReactDOM from 'react-dom';
import PageWrapper from '@internalComponents/PageWrapper';
import calculateRem from '@internalComponents/HOC/calculateRem';
import Loadable from 'react-loadable';
import QunarDefaultLoading from '@qunar-default-loading';
`)();

const buildAsyncImport = template(
    `
  const PAGE_NAME = Loadable({
    loader: () => import('IMPORT_PATH'),
    loading: QunarDefaultLoading,
    delay: 300
  });`,
    {
        plugins: ['dynamicImport']
    }
);

const domRender = template(`
window.onload = function (){
    const Wrapper = calculateRem(CLASS_NAME);
    ReactDOM.render( <Wrapper />, document.querySelector("#app" ))
};`,
{
    plugins: ['jsx']
});

const pageWrapper = template(`
    return <PageWrapper app={this} path={this.state.path}  query={this.state.query} config={this.state.config} showBackAnimation={this.state.showBackAnimation}/>
`, {
    plugins: ['jsx']
});
let CLASS_NAME = 'Global';

const temp = `window.addEventListener('popstate', function ({
    state
  }) {
    const pages = React.getCurrentPages();
    const pathname = state.url.split('?')[0];
    const index = pages.findIndex(page => page.props.path === pathname );
    if (index > -1) {
        React.__navigateBack({
            delta: pages.length - 1 - index
        })
    } else {
        if (React.__isTab(pathname)) {
            React.api.switchTab({
                url: state.url
            });
        } else {
            React.api.navigateTo({
                url: state.url
            });
        }
    }
});
React.registerApp(this);
this.onLaunch();
`;
let registerTemplate = temp;


module.exports = function ({ types: t }) {
    const importedPages = t.arrayExpression();
    let pageIndex = 0;
    return {
        visitor: {
            Program: {
                enter(astPath) {
                    const exportDefaultNode = astPath.node.body.find(node => {
                        return node.type === 'ExportDefaultDeclaration'
                    });
                    CLASS_NAME = exportDefaultNode.declaration.arguments[0].callee.name;
                },
                exit(astPath) {
                    astPath.node.body.unshift(...importedPagesTemplatePrefixCode);
                    astPath.node.body.push(domRender({
                        CLASS_NAME: t.identifier(CLASS_NAME)
                    }));
                }
            },
            ImportDeclaration(astPath) {
                if (astPath.get('specifiers').length !== 0) {
                    return;
                }
                const node = astPath.node;
                const importPath = node.source.value;
                if (!/pages/.test(importPath)) {
                    return;
                }
                const PAGE_NAME = `PAGE_${pageIndex++}`;
                registerTemplate += `React.registerPage(${PAGE_NAME}, '${importPath.replace(/^\./, '')}')\n`;
                const pageItem = t.stringLiteral(importPath.replace(/^\./, ''));
                
                importedPages.elements.push(pageItem);
                astPath.replaceWith(buildAsyncImport({
                    PAGE_NAME,
                    IMPORT_PATH: importPath
                }));
                // astPath.node.specifiers.push(t.importDefaultSpecifier(t.identifier(PAGE_NAME)));
            },
            ClassProperty(astPath) {
                if (
                    astPath.get('key').isIdentifier({
                        name: 'config'
                    })
                    && astPath.get('value').isObjectExpression()
                ) {
                    astPath.traverse({
                        ObjectProperty: property => {
                            const { key, value } = property.node;
                            let name;

                            if (t.isIdentifier(key)) name = key.name;
                            if (t.isStringLiteral(key)) name = key.value;

                            if (name === 'iconPath' || name === 'selectedIconPath') {
                                if (t.isStringLiteral(value)) {
                                    property
                                        .get('value')
                                        .replaceWith(
                                            t.callExpression(t.identifier('require'), [
                                                t.stringLiteral(
                                                    `@${value.value.replace(/^(\.?\/)/, '')}`
                                                )
                                            ])
                                        );
                                }
                            }
                        }
                    });

                    // 注入pages属性
                    astPath.get('value').node.properties.push(t.objectProperty(t.identifier('pages'), importedPages));
                }
            },
            ClassBody(astPath) {
                registerTemplate += `const pathname = location.pathname.replace(/^\\/web/, '');
                const search = location.search;
                if (React.__isTab(pathname)) {
                  React.api.redirectTo({
                    url: pathname + search
                  });
                } else {
                  React.api.redirectTo({
                    url: ${CLASS_NAME}.config.pages[0]
                  });
              
                  if (${CLASS_NAME}.config.pages.some(page => page === pathname)) {
                    if (pathname !== ${CLASS_NAME}.config.pages[0]) {
                      React.api.navigateTo({
                        url: pathname + search
                      });
                    }
                  }
                }`;
                

                const registerApp = template(registerTemplate, {
                    placeholderPattern: false
                });
                let find = false;
                astPath.get('body').forEach(p => {
                    if (p.type === 'ClassMethod' && p.node.key.name === 'componentWillMount') {
                        find = true;
                        p.node.body.body.push(...registerApp());
                    }
                });
                if (!find) {
                    astPath.node.body.push(
                        t.classMethod('method', t.identifier('componentWillMount'),
                            [], 
                            t.blockStatement(
                                registerApp()
                            )
                        )
                    );
                }
                astPath.node.body.push(
                    t.classMethod('method', t.identifier('render'),
                        [], 
                        t.blockStatement(
                            [
                                pageWrapper()
                            ]
                        )
                    )
                );
            },
            ExportDefaultDeclaration(astPath) {
                astPath.remove();
            }
        },
        post: function(){ 
            pageIndex = 0;
            registerTemplate = temp;
        }
    };
};
