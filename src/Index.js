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
    this.ignored = [];
    this.rules = {};
    this.links = {};
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
    if(this.files.indexOf(entry) === -1) this.files.push(entry);

    // Get the rules from the file
    async.waterfall([
        //Extract the rules from the head of the file
        boh.extractRulesFromFile.bind(null, entry),

        function(rules, callback) {
            if(rules.length) {
                debug("%s rules found.", rules.map(function(rules) {
                    return ("\"" + rules.name + "\"").blue;
                }).join(", ").replace(/,\s*([^,]+)$/, " and $1"));

                // Check to see if any of the rules are run at
                // the indexing phase. If any are applied, remove
                // them.
                async.filter(rules, function(rule, filterCallback) {
                    var plugin = boh.getPlugin("indexing", rule.name)

                    if(plugin && plugin.phase === "indexing") {
                        debug("Running".bold + " %s:%s.", self.relative(rule.file).yellow, rule.name.cyan);

                        plugin.run(rule, self, function(err, built) {
                            // Remove any listeners
                            plugin.removeAllListeners();
                            
                            // I think it's absolutely ridiculous async doesn't allow
                            // passing errors in it's filter function. It's to keep
                            // it in line with fs.exists API callback style of truthy
                            // value as the first parameter. First of all, fs.exists
                            // "will be deprecated." (IT'S WRITTEN IN THE DAMN DOCS)
                            // Secondly, ONE function in the ENTIRE NODE.JS API uses
                            // this callback style so you decide to throw out the
                            // callback style of THE REST OF THE ENTIRE ASYNC API?
                            // Sorry for the rant, I think I'm getting a little 
                            // annoyed I have to reached an indentation of 8
                            // (async, I love you really. Forever.)
                            if(err) callback(err);
                            else filterCallback(false);
                        });
                    } else filterCallback(true);
                }, function(rules) {
                    // Add entry to the index
                    self.addRules(entry, rules);

                    // Purge the index
                    self.purge();

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
 * Link one file to another.
 * @param  {String} owner /path/to/owner/file (Warning: has to be a file!)
 * @param  {String|Array} pathname  glob or array of globs
 */
Index.prototype.link = function(owner, link) {
    if(Array.isArray(link)) link.forEach(this.link.bind(this, owner));
    else {
        if(this.links[link] && this.links[link].indexOf(owner) === -1) this.links[link].push(owner);
        else this.links[link] = [owner];
    }
};

/**
 * Link a file relative to the owner file's
 * directory. So linking "/a/b/c/d.js" with
 * "../src/" will link "/a/b/src/" -> "/a/b/c/d.js".
 * @param  {String} owner    /path/to/owner/file
 * @param  {String|Array} pathname glob or array of globs
 */
Index.prototype.linkRelative = function(owner, pathname) {
    return this.link(owner, (Array.isArray(pathname) ? pathname : [pathname]).map(function(pathname) {
        return this.relative(owner, pathname)
    }, this));
};

/**
 * Given a path, find if it links to another path. For example,
 * if I `index.link("src/**", "a/b.js")`, `src/a.js`, `src/b/c.js`
 * and `src/foo.css` should all link to `a/b.js`.
 * @param  {String} pathname The pathname.
 * @return {Array} Array of links to the path.
 */
Index.prototype.findLinks = function(pathname) {
    if(Object.keys(this.links).some(function(link) {
        // Test the link, if it matches, return
        if(micromatch.isMatch(pathname, link, { dot: true })) {
            // Grab the links
            pathname = this.links[link];
            // Stop the loop
            return true;
        }
    }, this)) return pathname;
    else return [];
};

/**
 * Ignore paths during different phases.
 * @param  {String} phase    The phase at which to ignore e.g. building, indexing
 * @param  {String|Array} pathspec The paths to ignore.
 */
Index.prototype.ignore = function(pathspec) {
    if(Array.isArray(pathspec)) pathspec.forEach(this.ignore.bind(this));
    else if(this.ignored.indexOf(pathspec) === -1) {
        debug("Adding %s to the ignore list.", pathspec.cyan);

        // Push the path into the 
        this.ignored.push(pathspec);
    }
};

/**
 * Remove any data from the index that is ignored.
 * @param  {String} pathspec The path to purge.
 */
Index.prototype.purge = function() {
    // Remove the file from the index if they match
    this.files = this.files.filter(function(file) { return !this.ignoring(file); }, this);

    // Remove any directories
    this.directories = this.directories.filter(function(directory) { return !this.ignoring(directory); }, this);

    // Remove any rules
    Object.keys(this.rules).forEach(function(pathname) {
        if(this.ignoring(pathname)) delete this.rules[pathname];
    }, this);

    // Remove any links (both keys and values)
    Object.keys(this.links).forEach(function(pathname) {
        if(this.ignoring(pathname) || this.links[pathname].some(this.ignoring.bind(this))) delete this.links[pathname];
    }, this);
};

/**
 * Test whether the index is ignoring a path at a specific phase.
 * @param  {String} phase    The phase name e.g. building, indexing
 * @param  {String} pathname The path to test against.
 * @return {Boolean}         Whether or not the index is ignoring the path.
 */
Index.prototype.ignoring = function(pathname) {
    return micromatch.any(pathname, this.ignored, { dot: true });
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
    if(this.rules[file]) return (this.rules[file] || []);
    else return this.findLinks(file).reduce(function(rules, pathname) {
        return rules.concat(this.getRulesForFile(pathname));
    }.bind(this), []);
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
 * @param {Boolean} fullPath Display the paths in the output relative to the index or the full path.
 * @return {String} 
 */
Index.prototype.toString = function(fullPath) {
    var tab = "    ";
    return "Stats -> Directories: " + this.directories.length + ", files: " + this.files.length + "\n" +
        (this.directories.length ? "Directories:\n" + this.directories.map(function(dir) { return tab + (fullPath ? file : this.relative(dir)).red; }, this).join("\n") + "\n" : "") +
        (this.files.length ? "Files:\n" + this.files.map(function(file) { return tab + (fullPath ? file : this.relative(file)).yellow; }, this).join("\n") + "\n" : "") +
        (this.ignored.length ? "Ignoring:\n" + tab + this.ignored.map(function(pathname) { 
            return this.relative(pathname); 
        }, this).join("\n" + tab) + "\n" : "") + 
        (Object.keys(this.links).length ? "Links:\n" + Object.keys(this.links).map(function(file) { 
            return tab + (fullPath ? file : this.relative(file)).yellow + " -> " + 
                (fullPath ? file : this.links[file].map(function(pth) { return this.relative(pth) }, this).join(", ")); 
        }, this).join("\n") + "\n" : "") +
        (Object.keys(this.rules).length ? "Rules:\n" + Object.keys(this.rules).map(function(file) {
            return tab + (fullPath ? file : this.relative(file)).bold + "\n" +
                this.rules[file].map(function(rule) {
                    return tab + tab + rule.name.red + ":\n" +
                        (typeof rule.content !== "string" ? JSON.stringify(rule.content, null, 2) : rule.content).split("\n").map(function(line) {
                            return tab + tab + tab + line.trim();
                        }).join("\n");
                }).join("\n");
        }, this).filter(function(a) { return !!a }).join("\n") : "");
};

/**
 * Return the filepath relative to the root of this index.
 * If a second argument is passed, it's relative to the directory
 * of the file path passed as the first argument.
 * 
 * @param  {String} owner /path/to/file
 * @param {String} file /path/to/another/file
 * @return {String}     Filepath relative to the root.
 */
Index.prototype.relative = function(owner, file) {
    if(!file) return path.relative(this.root, owner);
    else {
        // Join the  with the owner directory
        return path.resolve(path.dirname(owner), "./" + file);
    }
};

module.exports = Index;