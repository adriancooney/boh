var boh = require("../boh"),
    fs = require("fs"),
    async = require("async"),
    path = require("path");

module.exports = new boh.Plugin(function run(rule, index, callback) {
    if(typeof rule.content === "string")
        rule.content = rule.content.split(",").map(function(s) { return s.trim(); })

    if(Array.isArray(rule.content) && rule.content) 
        index.linkRelative(rule.file, rule.content);

    callback();
}, { phase: "indexing" });