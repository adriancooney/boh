var boh = require("../boh"),
	path = require("path");

module.exports = new boh.Plugin(function run(rule, index, callback) {

	// Format the script
	var script = boh.format(rule.content, {
		"this": rule.file
	});

	// Log the input
	script.split("\n")
		.map(function(l) { return l.trim(); })
		.filter(function(l) { return !!l.trim(); })
		.forEach(function(l) {
			this.log("> " + l);
		}, this);

	// Execute the script
	boh.execute(path.dirname(rule.file), script, function(err, stdout, stderr) {
		if(err) {
			err.message = err.message.replace(/Command failed: [^:]+/, "Command failed: " + index.relative(rule.file));
			callback(err);
		} else {
			// Spit out the stdout to debug
			stdout.split("\n")
				.filter(function(l) { return !!l.trim(); })
				.forEach(function(l) { this.log(("< " + l)); }, this);

			callback(null, stdout);
		}
	}.bind(this));
});