var fs = require("fs"),
	path = require("path"),
	EventEmitter = require("events").EventEmitter,
	async = require("async"),
	boh = require("./boh"),
	Index = require("./Index"),
	debug = require("debug")("boh:index");

var Indexer = EventEmitter;

Indexer.prototype.index = function(directory, options, callback) {
	var index = new Index(directory),
		self = this;

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

	self.emit("start", options);

	(function dive(directory, callback) {
		async.waterfall([
			fs.readdir.bind(fs, directory), // Read the directory

			// Iterate over each entry in the directory
			function(entries, callback) {
				async.eachSeries(entries, function(entry, callback) {
					entry = path.join(directory, entry);

					// Make sure this path is included and not being ignored
					if(index.ignoring("indexing", entry)) {
						debug(("Ignoring " + entry).blue);
						self.emit("ignoring", entry);
						return callback();
					}

					async.waterfall([
						// Check the type of entry (dir or file?)
						fs.stat.bind(fs, entry),

						function(stat, callback) {
							// If it's a directory, recurse down
							if(stat.isDirectory()) {
								self.emit("directory", entry);
								debug(entry.red);

								// Add it to the index
								index.addDirectory(entry);

								// And go again.
								return dive(entry, callback);
							} else {
								// We have a file
								debug(entry.yellow);
								
								// Add it to the index
								self.addFileToIndex(index, entry, callback);
							}
						}
					], callback);
				}, callback);
			}
		], callback);
	})(directory, function(err) {
		if(err) return callback(err);

		// Print out the index
		index.toString().split("\n").forEach(function(line) { debug(line); });

		self.emit("finish");

		callback(null, index);
	});
};

Indexer.prototype.addFileToIndex = function(index, entry, callback) {
	var self = this;

	// Add it to the index
	index.addFile(entry);

	// Get the rules from the file
	async.waterfall([
		//Extract the rules from the head of the file
		boh.extractRulesFromFile.bind(null, entry),

		function(rules, callback) {
			if(rules.length) {
				debug("%s rules found.", rules.map(function(rules) {
					return ("\"" + rules.rule + "\"").blue;
				}).join(", ").replace(/,\s*([^,]+)$/, " and $1"));

				// Check to see if any of the rules are run at
				// the indexing phase. If any are applied, remove
				// them.
				async.filter(rules, function(rule, filterCallback) {
					var plugin = boh.getPlugin("indexing", rule.name)

					if(plugin && plugin.phase === "indexing") {
						// Emit the plugin and rule
						self.emit("rule", plugin, rule);

						// Format the rule content
						rule.content = boh.format(rule.content, {
							"this": rule.file
						});

						debug("Running".bold + " %s:%s.", index.relative(rule.file).yellow, rule.name.cyan);

						plugin.execute(rule, index, function(err, built) {

							// Remove any listeners
							plugin.removeAllListeners();
							
							// I think it's fucking ridiculous async doesn't allow
							// passing errors in it's filter function. It's to keep
							// it in line with fs.exists API callback style of truthy
							// value as the first parameter. First of all, fs.exists
							// "will be deprecated." (IT'S WRITTEN IN THE DAMN DOCS)
							// Secondly, ONE function in the ENTIRE NODE.JS API uses
							// this callback style so you decide to throw out the
							// callback style of THE REST OF THE ENTIRE ASYNC API?
							if(err) callback(err);
							else filterCallback(false);
						});
					} else filterCallback(true);
				}, function(rules) {
					self.emit("file", entry, rules);

					// Add entry to the index
					index.addRules(entry, rules);

					callback();
				});
			} else callback();
		}
	], callback);
};

module.exports = Indexer;