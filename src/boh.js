var fs = require("fs"),
	path = require("path"),
	cp = require("child_process"),
	EventEmitter = require("events").EventEmitter,
	debug = require("debug")("boh"),
	colors = require("colors"),
	async = require("async"),
	map = require("fn.map"),
	micromatch = require("micromatch");

var boh = {};

/**
 * Identifier for boh to act on at the start of a string.
 * @type {String}
 */
const BOH_INDENTIFIER = "!boh";

/**
 * Directory for temporarily placeing scripts while the run.
 * @type {String}
 */
const TEMP_DIR = "/tmp/boh";

/**
 * Extract the contents of the header comment. It should account for all
 * comment styles (or at least the most common). Examples:
 *
 * 		// build: sass $this
 * 		
 * 		/* build: sass $this <asterisk>/
 * 		
 * 		# build: sass $this
 *
 * And also any multiline variations.
 * 
 * 		// build:
 * 		//     sass $this
 * 		//     uglify $this
 *
 *      /*
 *       * build: 
 *       *     sass $this
 *       *     uglify $this
 *       <asterisk>/
 *
 *      # build:
 *      #     sass $this
 *      #	  uglify $this
 * 		
 * @param  {String} string String with comment header.
 * @return {String}        Contents of comment.
 */
boh.extractHeader = function(string) {
	// Ensure we have our boh token and that the file begins with the build rule.
	if(string.match(boh.headerRegex || (boh.headerRegex = new RegExp("^(?:\\/|\\*|#)+\\s*" + BOH_INDENTIFIER)))) {

		// Split the string line by line
		return string.split("\n").reduce(function(state, line) {
			if(state.extracting && (
				line.match(/^\s*(\/\/)(.+)$/)  || // "//"
				line.match(/^\s*(\/\*)(.+)$/) || // "/*"
				line.match(/^\s*(#)(.+)$/) || // "#"
				(state.commentType === "/*" && line.match(/^\s*\*(?!\/)(.+)$/)) || // Match " * " (comment block)
				(state.commentType === "/*" && line.match(/^(.*)$/)) // Comment block without and prefix
			)) {

				var contents;

				if(RegExp.$1 && RegExp.$2) { // If we have two matches, we have a comment type and some content
					state.commentType = RegExp.$1;
					contents = RegExp.$2;
				} else if(RegExp.$1) { // If we have just one match, it's just content
					contents = RegExp.$1
				}

				if(contents) {
					// Replace any closing tags that may be in the line when the comment type is /**/
					if(state.commentType === "/*" && contents.match(/\*\//)) {
						// Check if it's JUST a */
						if(contents.match(/^\s*\*\/\s*$/)) {
							// If it is, don't bother push anything
							contents = false;
						} else {
							// Otherwise delete the closing comment tag 
							contents = contents.replace(/\*\/.*/, "");
						}

						state.extracting = false; // Comment is closed, were done
					}

					// Push the contents
					if(contents !== false) state.contents.push(contents);
				}
			}

			return state;
		}, { contents: [], extracting: true }).contents.join("\n");
	}
};

/**
 * Extract rules from a string. Example:
 *
 * 		"build: browserify" -> [{ rule: "build", content: "browserify"}]
 *
 * 		"build:
 * 			browserify
 * 			uglify"
 * 		-> [{ rule: "build", content: "    browserify\n    uglify" }]
 *
 * 		"build: browserify
 * 		 includes: User.js"
 * 		-> [{ rule: "build", content: "browserify"}, { rule: "includes", content: "User.js"}]
 * 		
 * @param  {String} string String with rules.
 * @return {Array}         [{ rule {String}, content {String} }]
 */
boh.extractRules = function(string) {
	var state = string.split("\n").reduce(function(state, line, i) {
		if(line.match(/\s*(\w+):(.*)/)) { // Match <word>:<anything..+>
			// Save the multiline if any
			if(state.multiline) {
				state.rules.push({ rule: state.multilineRule, content: state.multilineContent.join("\n") });
				state.multiline = false;
			}

			if(!RegExp.$2.trim()) { // Remember, matches empty string!
				// Start a multiline match
				state.multiline = true;
				state.multilineRule = RegExp.$1;
				state.multilineContent = [];
			} else if(RegExp.$2) {
				// We have content on the same line, that's our rule
				state.rules.push({ rule: RegExp.$1, content: RegExp.$2 })
			}
		} else if(state.multiline) {
			// If were currently in an multiline rule, push the line to it
			state.multilineContent.push(line);
		}

		return state;
	}, { rules: [] });

	// Make sure we don't leave a multiline rule hanging!
	if(state.multiline) state.rules.push({ rule: state.multilineRule, content: state.multilineContent.join("\n") });

	return state.rules;
};

/**
 * Extract the rules from a header comment. See .extractHeader and .extractRules.
 * @param  {String} string String with header e.g. contents of a file.
 * @return {Array}        [{ rule {String}, content {String} }]
 */
boh.extractRulesFromHeader = function(string) {
	string = boh.extractHeader(string);
	if(string) return boh.extractRules(string);
	else return [];
};

/**
 * Find rules in the header of a file.
 * @param  {String}   file     /path/to/file
 * @param  {Function} callback (err, rules)
 */
boh.extractRulesFromFile = function(file, callback) {
	async.waterfall([
		fs.readFile.bind(fs, file, "utf8"), // Read the contents of the file. Little dissapointed I'm buffering the whole thing. Streams, Adrian, streams.

		function(contents, callback) {
			callback(null, boh.extractRulesFromHeader(contents));
		}
	], callback);
};

/**
 * Build the boh index from a directory.
 * @param  {String} directory /path/to/directory
 * @param  {Function} callback (err, index {Index})
 */
boh.buildIndex = function(directory, options, callback) {
	var debug = require("debug")("boh:index"), // Override debug
		index = new boh.Index(directory);

	if(typeof options === "function") callback = options, options = null;

	// Merge the options
	options = Object.keys(options).reduce(function(object, option) {
		object[option] = options[option];
		return object;
	}, {
		ignore: ["**/node_modules/*", "**/.git/*", "**/.sass-cache/*"]
	});

	debug("Building index for %s.", directory);
	debug("Ignoring %s.", options.ignore.join(", ").magenta);

	(function dive(directory, callback) {
		async.waterfall([
			fs.readdir.bind(fs, directory), // Read the directory

			// Iterate over each entry in the directory
			map(async.eachSeries, async, map.$1, function(entry, callback) {
				entry = path.join(directory, entry);

				// Make sure this path is included and not being ignored
				if(micromatch.any(entry, options.ignore, { dot: true })) {
					debug(("Ignoring " + entry).blue);
					return callback();
				}

				// Check the type of entry (dir or file?)
				async.waterfall([
					fs.stat.bind(fs, entry), // Stat the entry

					function(stat, callback) {
						// If it's a directory, recurse down
						if(stat.isDirectory()) {
							debug(entry.red);

							// Add it to the index
							index.addDirectory(entry);

							// And go again.
							return dive(entry, callback);
						} else {
							// We have a file
							debug(entry.yellow);
							
							// Add it to the index
							index.addFile(entry);

							async.waterfall([
								//Extract the rules from the head of the file
								boh.extractRulesFromFile.bind(null, entry),

								function(rules, callback) {
									if(rules.length) {
										debug("%s rules found.", rules.map(function(rules) {
											return ("\"" + rules.rule + "\"").blue;
										}).join(", ").replace(/,\s*([^,]+)$/, " and $1"));

										// Add it to the index
										index.addRules(entry, rules);

										// And continue
										callback();
									} else callback();
								}
							], callback);
						}
					}
				], callback);
			}, map.$2)
		], callback);
	})(directory, function(err) {
		if(err) callback(err);
		else {
			// Print out the index
			index.toString().split("\n").forEach(function(line) { debug(line); });

			callback(null, index);
		}
	});
};

/**
 * An index class to describe the file structure.
 */
boh.Index = function(root) {
	this.root = root;
	this.directories = [];
	this.files = [];
	this.rules = {};

	// Different rule applications
	this.includes = {};
};

/**
 * Add a directory to the index.
 * @param {String} path Directory path.
 */
boh.Index.prototype.addDirectory = function(path) {
	this.directories.push(path);
};

/**
 * Add a file to the index.
 * @param {String} path Path to the file.
 */
boh.Index.prototype.addFile = function(path) {
	this.files.push(path);
};

/**
 * Add rules to the index.
 * @param {String} file  Path to the file where the rules originated from.
 * @param {Array} rules Rules.
 */
boh.Index.prototype.addRules = function(file, rules) {
	this.rules[file] = rules;

	// Loop over the rules and apply any if required
	// during index creation.
	rules.forEach(function(rule) {
		switch(rule.rule) {
			case "includes":
				rule.content.split(",") // Comma separated paths
					.map(function(path) { return path.trim(); }) // Trim them down
					.forEach(this.include.bind(this, file));
			break;
		}
	}, this);
};

/**
 * RULE: Enable one file to cover or include another file.
 * @param  {String} owner /path/to/owner/file
 * @param  {String} file  /path/to/file
 */
boh.Index.prototype.include = function(owner, file) {
	file = path.resolve(path.dirname(owner), file);
	debug("%s includes %s.", owner.red, file.blue);

	this.includes[file] = owner;
};

/**
 * Return the rules associated with a file. If the file
 * is included by another file, then those rules from
 * the parent file will be returned.
 * 
 * @param  {String} file /path/to/file
 * @return {Array}      Array of rules. See .extractRulesFromHeader.
 */
boh.Index.prototype.getRulesForFile = function(file) {
	if(this.rules[file]) return this.rules[file];
	else if(this.includes[file]) return this.rules[this.includes[file]];
};

/**
 * Find a specific rule for a file.
 * @param  {String} file /path/to/file
 * @param  {String} rule Rule name.
 * @return {Object}      Rule object. See .extractRulesFromHeader.
 */
boh.Index.prototype.getRuleForFile = function(file, rule) {
	return this.getRulesForFile(file).reduce(function(find, value) {
		if(find !== false) return find;
		else if(value.rule === rule) return rule;
		else return false;
	});
};

/**
 * Convert to a string.
 * @return {String} 
 */
boh.Index.prototype.toString = function() {
	var tab = "    ";
	return "Stats -> Directories: " + this.directories.length + ", files: " + this.files.length + "\n" +
		(this.directories.length ? "Directories:\n" + this.directories.map(function(dir) { return tab + dir.red; }).join("\n") + "\n" : "") +
		(this.files.length ? "Files:\n" + this.files.map(function(file) { return tab + file.yellow; }).join("\n") + "\n" : "") +
		(Object.keys(this.rules).length ? "Rules:\n" + Object.keys(this.rules).map(function(file) {
			return tab + file.bold + "\n" +
				this.rules[file].map(function(rule) {
					return tab + tab + rule.rule.red + ":\n" +
						rule.content.split("\n").map(function(line) {
							return tab + tab + tab + line.trim();
						}).join("\n");
				}).join("\n");
		}, this).join("\n") : "")
};

/**
 * Return the filepath relative to the root of this index.
 * @param  {[type]} file [description]
 * @return {[type]}      [description]
 */
boh.Index.prototype.relative = function(file) {
	return path.relative(this.root, file);
};

/**
 * Expand variables in a string to values.
 * @param  {String} string String which contain variables.
 * @param  {Object} values Key/value store of variables and their values
 * @param  {String} prefix The variable prefix (default $)
 * @return {String}        Formatted string.
 */
boh.format = function(string, values, prefix) {
	if(!prefix) prefix = "$";
	if(!values) throw new Error("Please provide an object or array of values.");

	var i = 0;
	return string.replace(new RegExp("(\\\\)?\\" + prefix + "([a-zA-Z_0-9]+)", "g"), function(match, u, name) {
		if(u === "\\") return match.replace("\\", "");
		else {
			if(Array.isArray(values)) return values[i++];
			else return values[name];
		}
	});
};

/**
 * Execute a script with a cwd.
 * @param  {String}   cwd      Current working directory for the script.
 * @param  {String}   script   Script content.
 * @param  {Function} callback 
 */
boh.execute = function(cwd, script, callback) {
	var debug = require("debug")("boh:execute"),
		filename = path.join(TEMP_DIR, Math.floor(Math.random() * 1000000) + "");

	// Create the script file in directory.
	async.waterfall([
		// Make sure the temp directory exists
		function(callback) {
			fs.stat(TEMP_DIR, function(err, stat) {
				if(err && err.code === "ENOENT")
					async.series([
						fs.mkdir.bind(fs, TEMP_DIR),
						fs.chown.bind(fs, TEMP_DIR, process.getuid(), process.getgid())
					], callback);
				else if(err) callback(err);
				else callback();
			})
		},

		// Create the script in the directory
		fs.writeFile.bind(fs, filename, script),

		// Chmod +x
		fs.chmod.bind(fs, filename, 0755),

		// Run the script
		cp.execFile.bind(cp, filename, {
			cwd: cwd,
			uid: process.getuid()
		})
	], function(err, stdout, stderr) {
		// Remove the tmp file, regardless of output
		fs.unlink(filename, function(uerr) {
			if(uerr) debug("Unable to unlink temporary script %s.", uerr);

			if(err) callback(err);
			else callback(null, stdout, stderr)
		});
	});
};

/**
 * Run boh on an {boh.Index}. This means, run
 * all the build rules.
 * @param  {String} directory /path/to/directory
 * @return {EventEmitter} -> events { "start" -> (rules, index), "build" -> see .buildRule, "finish" -> (output) }
 */
boh.build = function(index, values, callback) {
	var debug = require("debug")("boh:build");
	if(typeof values === "function") callback = values, values = undefined;

	// Find all the rules and add a reference to the file
	var rules = Object.keys(index.rules).reduce(function(rules, file) {
		index.rules[file].forEach(function(rule) {
			rule.file = file;
		});

		return rules.concat(index.rules[file]);
	}, []);

	// Notify and save the output
	var emitter = new EventEmitter(), output = [];

	debug("Starting the build process.");

	// Only loop over the build rules. nextTick to give them time to bind events
	process.nextTick(async.eachSeries.bind(async, rules, function(rule, callback) {
		var plugin = boh.executeRule(index, rule, function(err, built) {
			if(err && err.code === "PLUGIN_NOT_FOUND") emitter.emit("error", err, rule);

			// Save the output
			output.push(built);

			callback();
		});

		// Build each rule
		if(plugin) emitter.emit("rule", plugin, rule);
	}, function(err) {
		// Emit the `finish` event
		emitter.emit("finish", output);

		if(err && callback) callback(err);
		else if(callback) callback(null, output);
	}));

	return emitter;
};

/**
 * Execute an individual rule.
 * @param  {boh.Index}   index    The index the rule was taken from.
 * @param  {Object}   rule        { file, build }
 * @param  {Function} callback
 * @return {EventEmitter} -> events { "start" -> (input), "error" -> (err), "finish" -> (stdout) }
 */
boh.executeRule = function(index, rule, callback) {
	var relative = index.relative(rule.file);

	// Find the plugin, if it exists
	var plugin = boh.getPlugin(rule.rule);

	// If the plugin doesn't exist, fail
	if(!plugin) {
		var err = new Error("Plugin " + rule.rule + " does not exist.")
		err.code = "PLUGIN_NOT_FOUND";
		return callback(err);
	}

	debug("Running".bold + " %s:%s.", relative.yellow, rule.rule.cyan);

	// Execute.
	plugin.execute(rule, index, callback);

	return plugin;
};

/**
 * Boh plugin store.
 * @type {Object}
 */
boh.plugins = {};

/**
 * Register a new boh plugin.
 * @param  {String} name   The name of the plugin.
 * @param  {boh.Plugin} plugin The actual plugin.
 */
boh.registerPlugin = function(name, plugin) {
	debug("Registering plugin %s.", name);
	boh.plugins[name] = plugin;
};

/**
 * Get a plugin by name,
 * @param  {String} name The name of the plugin.
 * @return {boh.Plugin}
 */
boh.getPlugin = function(name) {
	return boh.plugins[name];
};

/**
 * Create a new plugin.
 * @param {String} name   The unique name of the plugin.
 * @param {Function} runner The plugin runner (rule, callback).
 */
boh.Plugin = function(name, runner) {
	EventEmitter.call(this);
	this.pluginName = name;
	this.runner = runner;
	this.debug = require("debug")("boh:plugin:" + name);
	this.log = this.emit.bind(this, "log");

	// Register the plugin
	boh.registerPlugin(name, this);
};

// Inherit from the EventEmitter
boh.Plugin.prototype = Object.create(EventEmitter.prototype);

/**
 * Execute the plugin.
 * @param  {Object}   rule     Rule sent with { file, content }
 * @param  {Function} callback 
 */
boh.Plugin.prototype.execute = function(rule, index, callback) {
	process.nextTick(this.emit.bind(this, "start", rule));

	this.debug("Starting execution.");
	this.runner.call(this, rule, index, function(err, output) {
		if(err) {
			this.debug("Error:", err);
			this.emit("error", err);
		} else {
			rule.output = output;
			this.emit("finish", rule);
		}

		this.removeAllListeners();
		if(callback) callback(err, rule);
	}.bind(this))
};

module.exports = boh;

// Require the default plugins
require("./plugins");