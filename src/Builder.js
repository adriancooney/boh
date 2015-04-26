var boh = require("./boh"),
	async = require("async"),
	EventEmitter = require("events").EventEmitter;

var Builder = EventEmitter;

/**
 * Run boh on an {boh.Index}. This means, run
 * all the build rules.
 * @param  {String} directory /path/to/directory
 * @return {EventEmitter} -> events { "start" -> (rules, index), "build" -> see .buildRule, "finish" -> (output) }
 */
Builder.prototype.build = function(index, values, callback) {
	var debug = require("debug")("boh:build");
	if(typeof values === "function") callback = values, values = undefined;

	// Collect all the rules from the index into a single array
	var rules = Object.keys(index.rules).reduce(function(rules, file) {
		return rules.concat(index.rules[file]);
	}, []);

	// Add a reference to the emitter and create the output store
	var emitter = this, output = [], phase = "building";

	debug("Starting the build process.");

	async.eachSeries(rules, function(rule, callback) {
		// Check if the path isn't ignored
		if(index.ignoring(rule.file)) return callback();

		var relative = index.relative(rule.file);

		// Find the plugin, if it exists
		var plugin = boh.getPlugin(phase, rule.name);

		// If the plugin doesn't exist, fail
		if(!plugin) {
			var err = new Error("Plugin " + rule.name + " does not exist.")
			err.code = "PLUGIN_NOT_FOUND";
			
			emitter.emit("error", err, rule);
			return callback();
		}

		// Emit the plugin and rule
		emitter.emit("rule", plugin, rule);

		// Format the rule content
		rule.content = JSON.parse(boh.format(JSON.stringify(rule.content), {
			"this": rule.file
		}));

		debug("Running".bold + " %s:%s.", relative.yellow, rule.name.cyan);

		plugin.execute(rule, index, function(err, built) {

			// Remove any listeners
			plugin.removeAllListeners();

			// Save the output regardless if it errored or not
			output.push(err || built);
			
			// Continue onto the next
			callback();
		});
	}, function(err) {
		// Emit the `finish` event
		emitter.emit("finish", output);

		if(err && callback) callback(err);
		else if(callback) callback(undefined, output);
	});
};

module.exports = Builder;