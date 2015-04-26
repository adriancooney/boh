var EventEmitter = require("events").EventEmitter;

/**
 * Create a new plugin.
 * @param {String} name   The unique name of the plugin.
 * @param {Function} runner The plugin runner (rule, callback).
 */
var Plugin = function(runner, options) {
	EventEmitter.call(this);
	options = options || {};
	this.runner = runner;
	this.debug = require("debug")("Plugin");
	this.log = this.emit.bind(this, "log");
	this.phase = options.phase || "building";
};

// Inherit from the EventEmitter
Plugin.prototype = Object.create(EventEmitter.prototype);

/**
 * Execute the plugin.
 * @param  {Object}   rule     Rule sent with { file, content }
 * @param  {Function} callback 
 */
Plugin.prototype.execute = function(rule, index, callback) {
	// Tell the outside world the plugin is starting
	this.emit("start", rule);

	this.debug("Starting execution.");

	try {
		rule.timeStart = Date.now();

		// Execute the plugin
		this.runner.call(this, rule, index, function(err, output) {
			// Add some perf information
			rule.timeEnd = Date.now();
			rule.duration = rule.timeEnd - rule.timeStart;

			if(err) {
				this.debug("Execution Error: ", err);
				this.emit("error", err);
			} else {
				rule.output = output;
				this.debug("Execution Complete.".green);
				this.emit("finish", rule);
			}

			callback(err, rule);
		}.bind(this))
	} catch (err) {
		// Add timing information on fail
		rule.timeEnd = Date.now();
		rule.duration = rule.timeEnd - rule.timeStart;

		// Emit and log the debug error
		this.debug("Execution Error: ", err);
		this.emit("error", err);

		// Continue with the callback
		callback(err);
	}
};

module.exports = Plugin;