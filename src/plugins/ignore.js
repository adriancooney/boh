var path = require("path");

module.exports = [function run(rule, index, callback) {
    if(typeof rule.content === "string")
        rule.content = rule.content.split(",").map(function(s) { return s.trim(); })

    if(Array.isArray(rule.content) && rule.content.length)
        index.ignore(rule.content.map(function(pathname) {
            return path.resolve(path.dirname(rule.file), pathname);
        }));
    
    callback();
}, { phase: "indexing" }];