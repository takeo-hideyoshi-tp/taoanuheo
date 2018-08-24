const path = require('path');
const cwd = process.cwd();

const log = console.log;
module.exports = (nPath, modules, name)=>{


    let aliasField = require( path.join(cwd, 'package.json') ).mpreact.alias;
    if(!aliasField) return;

    let importValue = nPath.node.source.value;
    let {dir, base} = path.parse(importValue);
    let from = path.dirname(path.join(cwd, modules.current) );
    let to = '';
    let target = '';
    let relativePath = '';
    
    //如果是相对引用，保留
    if(/^(\.|\/)/.test(dir)){
        modules.importComponents[name] = importValue;
        return;
    }

    if(!dir){
        to = path.dirname( path.join(cwd, aliasField[base]) );
        target = path.parse( aliasField[base] ).name;
      
    }else{
       let aliasKeys = Object.keys(aliasField);
       //遍历查找是否匹配引用路径是否匹配，如 @components/A/B是否匹配@components
       for(let i = 0; i < aliasKeys.length; i++){
           
           if(new RegExp(`^${aliasKeys[i]}`).test(dir)){
              to =  path.join(cwd, aliasField[aliasKeys[i]]);
              target = path.join( dir.replace(`${aliasKeys[i]}\/`, ''), base );
              break;
           }
       }
    }

    relativePath = path.relative(from, to);
    let val = path.join(relativePath, target);
    nPath.node.source.value = val;

    //重点，保持所有引入的组件名及它们的路径，用于<import />
    modules.importComponents[name] = val;

}