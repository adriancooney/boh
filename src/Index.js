var micromatch = require("micromatch"),
	path = require("path");

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
Index.prototype.addFile = function(path) {
	this.files.push(path);
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