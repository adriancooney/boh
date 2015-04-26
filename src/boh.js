var fs = require("fs"),
	os = require("os"),
	path = require("path"),
	cp = require("child_process"),
	EventEmitter = require("events").EventEmitter,
	debug = require("debug")("boh"),
	colors = require("colors"),
	async = require("async"),
	micromatch = require("micromatch");

var boh = {};

/**
 * Identifier for boh to act on at the start of a header comment block.
 * @type {String}
 */
const BOH_IDENTIFIER = "!boh";

/**
 * Boh plugin prefix.
 * @type {String}
 */
const BOH_PLUGIN_PREFIX = "boh-";

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
	if(string.match(boh.headerRegex || (boh.headerRegex = new RegExp("^(?:\\/|\\*|#)+\\s*" + BOH_IDENTIFIER)))) {
		// Remove the BOH_IDENTIFIER
		string = string.replace(BOH_IDENTIFIER, "");

		// Split the string line by line
		return string.split("\n").reduce(function(state, line, index, values) {
			if(state.extracting && (
				line.match(/^\s*(\/\/)(.*)$/)  || // "//"
				line.match(/^\s*(\/\*)(.*)$/) || // "/*"
				line.match(/^\s*(#)(.*)$/) || // "#"
				(state.commentType === "/*" && line.match(/^\s*\*(?!\/)(.*)$/)) || // Match " * " (comment block)
				(state.commentType === "/*" && line.match(/^(.*)$/)) // Comment block without and prefix
			)) {

				var $1 = RegExp.$1, $2 = RegExp.$2, contents;

				if(($1 && $2) || $1 == "/*") { // If we have two matches, we have a comment type and some content
					state.commentType = $1;
					contents = $2;
				} else if($1) { // If we have just one match, it's just content
					contents = $1
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
 * 		 links: User.js"
 * 		-> [{ rule: "build", content: "browserify"}, { rule: "links", content: "User.js"}]
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
		},

		function(rules, callback) {
			// Add a reference to the file the rules was extracted from
			rules.forEach(function(rule) {
				rule.file = file;
			});

			callback(null, rules);
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
	options = Object.keys(options || {}).reduce(function(object, option) {
		object[option] = options[option];
		return object;
	}, {
		ignore: ["**/node_modules/*", "**/.git/*", "**/.sass-cache/*"]
	});

	// Push the ignores
	index.ignore("indexing", options.ignore);

	debug("Building index for %s.", directory);
	debug("Ignoring %s.", options.ignore.join(", ").magenta);

	(function dive(directory, callback) {
		async.waterfall([
			fs.readdir.bind(fs, directory), // Read the directory

			// Iterate over each entry in the directory
			function(entries, callback) {
				async.eachSeries(entries, function(entry, callback) {
					entry = path.join(directory, entry);

					// Make sure this path is included and not being ignored
					if(index.ignoring(entry)) {
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
				}, callback);
			}
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
	this.links = {};

	this.ignores = {
		building: [],
		indexing: []
	};
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
};

/**
 * RULE: Enable one file to cover or include another file.
 * @param  {String} owner /path/to/owner/file
 * @param  {String} file  /path/to/file
 */
boh.Index.prototype.link = function(owner, file) {
	file = path.resolve(path.dirname(owner), file);
	debug("%s links %s.", owner.red, file.blue);

	this.links[file] = owner;
};

/**
 * Ignore paths during different phases.
 * @param  {String} phase    The phase at which to ignore e.g. building, indexing
 * @param  {String|Array} pathspec The paths to ignore.
 */
boh.Index.prototype.ignore = function(phase, pathspec) {
	if(!this.ignores[phase]) this.ignores[phase] = [];
	if(Array.isArray(pathspec)) pathspec.forEach(this.ignore.bind(this, phase));
	else this.ignores[phase].push(pathspec);
}

/**
 * Test whether the index is ignoring a path at a specific phase.
 * @param  {String} phase    The phase name e.g. building, indexing
 * @param  {String} pathname The path to test against.
 * @return {Boolean}         Whether or not the index is ignoring the path.
 */
boh.Index.prototype.ignoring = function(phase, pathname) {
	return micromatch.any(pathname, this.ignores[phase] || [], { dot: true });
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
	else if(this.links[file]) return this.rules[this.links[file]];
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
boh.Index.prototype.toString = function(fullPath) {
	var tab = "    ";
	return "Stats -> Directories: " + this.directories.length + ", files: " + this.files.length + "\n" +
		(this.directories.length ? "Directories:\n" + this.directories.map(function(dir) { return tab + (fullPath ? file : this.relative(dir)).red; }, this).join("\n") + "\n" : "") +
		(this.files.length ? "Files:\n" + this.files.map(function(file) { return tab + (fullPath ? file : this.relative(file)).yellow; }, this).join("\n") + "\n" : "") +
		(Object.keys(this.links).length ? "Links:\n" + Object.keys(this.links).map(function(file) { return tab + (fullPath ? file : this.relative(file)).yellow + "->" + (fullPath ? file : this.relative(this.links[file])); }, this).join("\n") + "\n" : "") +
		(Object.keys(this.rules).length ? "Rules:\n" + Object.keys(this.rules).map(function(file) {
			return tab + (fullPath ? file : this.relative(file)).bold + "\n" +
				this.rules[file].map(function(rule) {
					return tab + tab + rule.rule.red + ":\n" +
						rule.content.split("\n").map(function(line) {
							return tab + tab + tab + line.trim();
						}).join("\n");
				}).join("\n");
		}, this).join("\n") : "");
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
	// This regex may be a little hard to understand but the extra slash 
	// is because of the double quotes. It really translates to (with $ as prefix):
	// 		/(\\)?\$([a-zA-Z_0-9]+)/
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
		filename = path.join(os.tmpdir(), Math.floor(Math.random() * 1000000) + "");

	// Create the script file in directory.
	async.waterfall([
		// Now were using os.tmpdir() to get the
		// temporary directory but I'm leaving this in till
		// it's os.tmpdir() is tested fully.
		// 
		// Make sure the temp directory exists
		// function(callback) {
		// 	fs.stat(TEMP_DIR, function(err, stat) {
		// 		if(err && err.code === "ENOENT")
		// 			async.series([
		// 				fs.mkdir.bind(fs, TEMP_DIR),
		// 				fs.chown.bind(fs, TEMP_DIR, process.getuid(), process.getgid())
		// 			], callback);
		// 		else if(err) callback(err);
		// 		else callback();
		// 	})
		// },

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

boh.Builder = EventEmitter;
boh.Builder.prototype = Object.create(EventEmitter.prototype);

/**
 * Run boh on an {boh.Index}. This means, run
 * all the build rules.
 * @param  {String} directory /path/to/directory
 * @return {EventEmitter} -> events { "start" -> (rules, index), "build" -> see .buildRule, "finish" -> (output) }
 */
boh.Builder.prototype.build = function(index, values, callback) {
	var debug = require("debug")("boh:build");
	if(typeof values === "function") callback = values, values = undefined;

	// Collect all the rules from the index into a single array
	var rules = Object.keys(index.rules).reduce(function(rules, file) {
		return rules.concat(index.rules[file]);
	}, []);

	// Add a reference to the emitter and create the output store
	var emitter = this, output = [];

	debug("Starting the build process.");

	// Only loop over the build rules. nextTick to give them time to bind events
	async.eachSeries(rules, function(rule, callback) {
		var relative = index.relative(rule.file);

		// Find the plugin, if it exists
		var plugin = boh.getPlugin(rule.rule);

		// If the plugin doesn't exist, fail
		if(!plugin) {
			var err = new Error("Plugin " + rule.rule + " does not exist.")
			err.code = "PLUGIN_NOT_FOUND";
			
			emitter.emit("error", err, rule);
			return callback();
		}

		// Emit the plugin and rule
		emitter.emit("rule", plugin, rule);

		// Format the rule content
		rule.content = boh.format(rule.content, {
			"this": rule.file
		});

		debug("Running".bold + " %s:%s.", relative.yellow, rule.rule.cyan);

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
 * Find all the "boh-" in the package.json and globally.
 * @param {String} base The base directory to begin the search.
 * @param {Function} callback (err, plugins)
 */
boh.findPlugins = function(base, callback) {
	if(typeof base === "function") callback = base, base = undefined;

	// Get the package.json
	async.waterfall([
		function(callback) {
			boh.getPackageJSON(base, function(err, packageJSON) {
				// Require the node modules
				if(err) callback(err);
				else if(packageJSON.dependencies) callback(null, Object.keys(packageJSON.dependencies).filter(isPlugin));
			});
		},

		function(plugins, callback) {
			if(process.env.NODE_PATH) fs.readdir(process.env.NODE_PATH, function(err, entries) {
				if(err) callback(err);
				else callback(null, plugins.concat(entries.filter(isPlugin)))
			});
			else callback(plugins);
		}
	], callback);

	function isPlugin(dependency) { return dependency.substr(0, BOH_PLUGIN_PREFIX.length) === BOH_PLUGIN_PREFIX; }
};

/**
 * Require plugins from a list.
 * @param  {Array} plugins Array of plugins.
 * @param  {Function} callback (err)
 * @return {EventEmitter}         
 */
boh.requirePlugins = function(plugins, callback) {
	var ee = new EventEmitter();

	// Allow us to return the emitter
	process.nextTick(function() {
		plugins.forEach(function(plugin) {
			debug("Loading plugin %s.", plugin);

			try {
				var pluginName = plugin.replace(BOH_PLUGIN_PREFIX, ""),
					pluginExport = require(plugin);

				pluginExport.pluginName = pluginName;
				pluginExport.debug = require("debug")("boh:plugin:" + name);

				boh.registerPlugin(pluginName, pluginExport);
				ee.emit("plugin:loaded", plugin);
			} catch(err) {
				ee.emit("plugin:error", plugin, err);
			}
		});

		// Run the callback out here by itself, require is synchronous
		callback();
	});

	return ee;
};

/**
 * Traverse up the directory structure and find the package.json
 * @param {String} dir The package to begin the search.
 * @param {Function} callback
 * @return {Object} package.json
 */
boh.getPackageJSON = function(dir, callback) {
	if(typeof dir === "function") callback = dir, dir = undefined;

	// If there is no directory, assume the current directory
	if(!dir) dir = process.cwd();

	debug("Checking for package.json in %s", dir);

	// Read the current directory
	fs.readdir(dir, function(err, entries) {
		if(err) callback(err);
		else if(entries.indexOf("package.json") !== -1) debug("package.json found in %s", dir.magenta), callback(null, require(path.join(dir, "package.json")));
		else if(dir === "/") callback(null, undefined);
		else boh.getPackageJSON(path.resolve(dir, ".."), callback);
	})
};

/**
 * Create a new plugin.
 * @param {String} name   The unique name of the plugin.
 * @param {Function} runner The plugin runner (rule, callback).
 */
boh.Plugin = function(runner) {
	EventEmitter.call(this);
	this.runner = runner;
	this.debug = require("debug")("boh:plugin");
	this.log = this.emit.bind(this, "log");
};

// Inherit from the EventEmitter
boh.Plugin.prototype = Object.create(EventEmitter.prototype);

/**
 * Execute the plugin.
 * @param  {Object}   rule     Rule sent with { file, content }
 * @param  {Function} callback 
 */
boh.Plugin.prototype.execute = function(rule, index, callback) {
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

module.exports = boh;

// Require the packaged plugins in plugins/ and manually register them
fs.readdirSync(path.join(__dirname, "plugins")).forEach(function(plugin) {
	var pluginExport = require("./plugins/" + plugin),
		pluginName = plugin.replace(".js", "");

	plugin.pluginName = pluginName;
	plugin.debug = require("debug")("boh:plugin:" + pluginName);
	boh.registerPlugin(pluginName, pluginExport);
});
