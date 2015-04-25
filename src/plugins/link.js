var boh = require("../boh"),
	path = require("path");

module.exports = new boh.Plugin(function run(rule, index, callback) {
	setTimeout(callback, 5000);
});