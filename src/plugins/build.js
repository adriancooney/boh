var boh = require("../boh"),
    path = require("path");

module.exports = new boh.Plugin(function run(rule, index, callback) {
    var script = rule.content;

    if(Array.isArray(script)) script = script.join("\n");
    else if(typeof script !== "string") throw new Error("The build rule requires a script string or array of commands.");

    // Log the input
    script.split("\n")
        .map(function(l) { return l.trim(); })
        .filter(function(l) { return !!l.trim(); })
        .forEach(function(l) {
            this.log("> " + l);
        }, this);

    // Execute the script
    boh.execute(path.dirname(rule.file), script, function(err, stdout, stderr) {
        if(err) callback(err);
        else {
            // Spit out the stdout
            stdout.split("\n")
                .filter(function(l) { return !!l.trim(); })
                .forEach(function(l) { this.log(("< " + l)); }, this);

            callback(null, stdout);
        }
    }.bind(this));
});