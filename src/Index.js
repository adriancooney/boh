var path = require("path"),
	boh = require("./boh"),
	micromatch = require("micromatch"),
	async = require("async"),
	debug = require("debug")("boh:index");

/**
 * An index class to describe the file structure.
 */
var Index = function(root) {
	this.root = root;
	this.directories = [];
	this.files = [];
	this.rules = {};
	this.links = {};
	this.ignores = {};
};

/**
 * Add a directory to the index.
 * @param {String} path Directory path.
 */
Index.prototype.addDirectory = function(path) {
	this.directories.push(path);
};

/**
 * Add a file to the index.
 * @param {String} path Path to the file.
 */
Index.prototype.addFile = function(entry, callback) {
	var self = this;

	// Push the file
	this.files.push(entry);

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

						// Format the rule content
						rule.content = boh.format(rule.content, {
							"this": rule.file
						});

						debug("Running".bold + " %s:%s.", self.relative(rule.file).yellow, rule.name.cyan);

						plugin.execute(rule, self, function(err, built) {
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
					// Add entry to the index
					self.addRules(entry, rules);

					callback(null, entry, rules);
				});
			} else callback();
		}
	], callback);
};

/**
 * Add rules to the index.
 * @param {String} file  Path to the file where the rules originated from.
 * @param {Array} rules Rules.
 */
Index.prototype.addRules = function(file, rules) {
	this.rules[file] = rules;
};

/**
 * RULE: Enable one file to cover or include another file.
 * @param  {String} owner /path/to/owner/file
 * @param  {String} file  /path/to/file
 */
Index.prototype.link = function(owner, pathname) {
	if(Array.isArray(pathname)) pathname.forEach(this.link.bind(this, owner));
	else {
		var file = path.resolve(path.dirname(owner), pathname);
		this.links[file] = owner;
	}
};

/**
 * Ignore paths during different phases.
 * @param  {String} phase    The phase at which to ignore e.g. building, indexing
 * @param  {String|Array} pathspec The paths to ignore.
 */
Index.prototype.ignore = function(phase, pathspec) {
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
Index.prototype.ignoring = function(phase, pathname) {
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
Index.prototype.getRulesForFile = function(file) {
	if(this.rules[file]) return this.rules[file];
	else if(this.links[file]) return this.rules[this.links[file]];
};

/**
 * Find a specific rule for a file.
 * @param  {String} file /path/to/file
 * @param  {String} rule Rule name.
 * @return {Object}      Rule object. See .extractRulesFromHeader.
 */
Index.prototype.getRuleForFile = function(file, rule) {
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
Index.prototype.toString = function(fullPath) {
	var tab = "    ";
	return "Stats -> Directories: " + this.directories.length + ", files: " + this.files.length + "\n" +
		(this.directories.length ? "Directories:\n" + this.directories.map(function(dir) { return tab + (fullPath ? file : this.relative(dir)).red; }, this).join("\n") + "\n" : "") +
		(this.files.length ? "Files:\n" + this.files.map(function(file) { return tab + (fullPath ? file : this.relative(file)).yellow; }, this).join("\n") + "\n" : "") +
		(Object.keys(this.ignores).length ? "Ignoring:\n" + tab + Object.keys(this.ignores).reduce(function(pathspecs, phase) {
			this.ignores[phase].forEach(function(p) { p = this.relative(p + (" [" + phase + "]").black); if(pathspecs.indexOf(p) === -1) pathspecs.push(p); }, this);
			return pathspecs;
		}.bind(this), []).join("\n" + tab) + "\n" : "") + 
		(Object.keys(this.links).length ? "Links:\n" + Object.keys(this.links).map(function(file) { 
			return tab + (fullPath ? file : this.relative(file)).yellow + " -> " + 
				(fullPath ? file : this.relative(this.links[file])); 
		}, this).join("\n") + "\n" : "") +
		(Object.keys(this.rules).length ? "Rules:\n" + Object.keys(this.rules).map(function(file) {
			return tab + (fullPath ? file : this.relative(file)).bold + "\n" +
				this.rules[file].map(function(rule) {
					return tab + tab + rule.name.red + ":\n" +
						(typeof rule.content !== "string" ? JSON.stringify(rule.content, null, 2) : rule.content).split("\n").map(function(line) {
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
Index.prototype.relative = function(file) {
	return path.relative(this.root, file);
};

module.exports = Index;