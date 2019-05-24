const path = require('path');
const buildType = process.env.ANU_ENV;

module.exports = function(modules, json) {
    
    if (modules.componentType !== 'App') {
        return json;
    }
    let configJson = {};
    try {
        configJson = require( path.join(process.cwd(), 'source', `${buildType}Config.json` ));
    } catch (err) {
       
    }

    if (buildType != 'quick') {
        delete configJson.subPackages;
        delete configJson.subpackages;
    }
    

    Object.assign(json, configJson);
    return json;
}