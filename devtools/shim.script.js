var fs = require("fs");
var path = require("path");


var dir1 = path.join(__dirname, "../dist/ReactShim.js");
var str = fs.readFileSync(dir1, "utf-8");
var text = str
  .replace(/Object\.freeze/g, "extend")
  .replace(/\/\/freeze_start[\s\S]+?freeze_end/, "")
  .replace(/\/\/innerMap_start[\s\S]+?innerMap_end/, "")
  .replace("new innerMap", "new Map")
  .replace(/\/\/splice([\s\S]+?)\[\]/, "var queue = this.list.splice(0)")
  .replace(/_pendingCallbacks\.forEach[\s\S]+?0/g,`_pendingCallbacks.splice(0)\.forEach(function(fn){
         fn.call(instance);
     })`)

fs.writeFileSync(dir1, text, { encoding: "utf8" });
console.log("对ReactShim瘦身完毕");

var dir2 = path.join(__dirname, "../dist/React.js");
var str = fs.readFileSync(dir2, "utf-8");
var text2 = str
  .replace(/Object\.freeze/g, "extend")
  .replace(/\/\/freeze_start([\s\S]+?)freeze_end/, "");

fs.writeFileSync(dir2, text2, { encoding: "utf8" });
console.log("对React瘦身完毕");

var dir3 = path.join(__dirname, "../dist/ReactIE.js");
var str = fs.readFileSync(dir3, "utf-8");
var text3 = str
  .replace(/Object\.freeze/g, "extend")
  .replace(/\/\/freeze_start([\s\S]+?)freeze_end/, "");

fs.writeFileSync(dir3, text3, { encoding: "utf8" });
console.log("对ReactIE瘦身完毕");
