var boh = require("../../../");

module.exports = new boh.Plugin(function(index, rule, callback) {
    this.log("Hello world from the bar plugin!");
    callback();
});