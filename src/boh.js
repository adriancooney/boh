var fs = require("fs"),
    os = require("os"),
    path = require("path"),
    cp = require("child_process"),
    EventEmitter = require("events").EventEmitter,
    debug = require("debug")("boh"),
    colors = require("colors"),
    async = require("async"),
    micromatch = require("micromatch"),
    yaml = require("js-yaml");

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
 * The types of comments boh can parse. It's an array
 * of {String}s, which means the line starts with that or
 * and {Array} of a start and end. Anything between that
 * is considered content.
 * 
 * @type {Array}
 */
const COMMENT_TYPES = [
    "//", 
    "#", 
    ["/*", "*/"]
];

/**
 * Extract the contents of the header comment. It should account for all
 * comment styles (or at least the most common). Examples:
 *
 *      // build: sass $this
 *      
 *      /* build: sass $this <asterisk>/
 *      
 *      # build: sass $this
 *
 * And also any multiline variations.
 * 
 *      // build:
 *      //     sass $this
 *      //     uglify $this
 *
 *      /*
 *       * build: 
 *       *     sass $this
 *       *     uglify $this
 *       <asterisk>/
 *
 *      # build:
 *      #     sass $this
 *      #     uglify $this
 *      
 * @param  {String} string String with comment header.
 * @return {String}        Contents of comment.
 */
boh.extractHeaderFromStream = function(stream, callback) {
    var state = {
        contents: [], // The contents of the comment header
        type: COMMENT_TYPES.slice(),
        comment: {}
    };

    // Requirements for this parser to qualify a comment as
    // the "header comment":
    // 1. It *has* to be at the start of the stream.
    // 2. The <commentType><BOH_IDENTIFIER> has to be first characters after. (No whitespace)
    //    opening the comment block.
    // 2. The first comment line encountered is deemed to be the
    //    comment type for the header block. i.e. If the header
    //    starts with a //, only the following comments of //
    //    will be regarded as the header.
    var n = 0;
    stream.on("data", function(chunk) {
        chunk = chunk.toString();

        if(!state.exited) for(var i = 0, length = chunk.length; i < length; i++, n++) {
            var character = chunk[i];

            if(n === 0) {
                // Special case, were at the *very* start of the file
                // Requirements 1 & 2 need to be satisfied here.
                // Loop over each of the comment types and ensure
                if(!COMMENT_TYPES.some(function(type) {
                    var token = (Array.isArray(type) ? type[0] : type) + BOH_IDENTIFIER, // Concencate <comment type><BOH_IDENTIFIER>
                        extracted = chunk.substr(0, token.length); // Take out the first token.length

                    if(token === extracted) {
                        // Great! We have a comment block
                        state.comment.type = type;
                        state.comment.multiline = Array.isArray(type);

                        // Skip past the identifier
                        i = token.length - 1;

                        return true;
                    }
                })) {
                    // If the some has looped over the comment types and no
                    // type has been found, then there's no point in continuing
                    // so exit with zero content.
                    state.exited = true;
                    return callback(null, "");
                }
            } else if(state.pending !== undefined && i === 0) {
                // To ensure continuity between chunks, we need
                // to make sure that if there's anything in the
                // pending that pending + (chunk.substr(0, state.comment.type.length - pending.length))
                // is equal to the state.comment.type. 
                // First of all reconstruct the token.
                var extracted = chunk.substr(0, state.commen.type.length - state.pending.length),
                    token = pending + extracted;

                if(token === state.comment.type) {
                    i += extracted.length;
                    delete state.pending;
                } else {
                    state.exited = true;
                    return callback(null, state.contents.join(""));
                }
            } else {
                // If we come to a new line, and it's not a multiline comment
                // then we have to check the next line is a comment
                // Note: We can't reach here without a commen type
                if(character === "\n" && !state.comment.multiline) {
                    var token = chunk.substr(i + 1, state.comment.type.length);

                    if(token.length !== state.comment.type.length) {
                        // We've reached here if we've come to the
                        // end of a chunk and it can't look ahead
                        // We need to save this until the next chunk
                        state.pending = token;
                    } else if(token === state.comment.type) {
                        // Skip past the comment type
                        i += state.comment.type.length
                    } else {
                        state.exited = true;
                        return callback(null, state.contents.join(""));
                    }
                } else if(state.comment.multiline) {
                    // If it's a multiline comment, we have to look ahead
                    // to find the closing tag
                    var closingTag = state.comment.type[1],
                        token = chunk.substr(i, closingTag.length);

                    // If the look ahead matches, push the contents!
                    if(token === closingTag) {
                        state.exited = true;
                        return callback(null, state.contents.join(""));
                    }
                }

                // We assume that if were still looping (i.e. not exited
                // via the callback), then all characters should be pushed
                state.contents.push(character);
            }
        }
    });

    stream.on("end", function() {
        if(!state.exited) return callback(null, state.contents.join(""));
    });
};

/**
 * Extract the prefix from a block of lines (if any).
 * @param  {String} string Block of text.
 * @return {String}        The prefix.
 */
boh.extractPrefix = function(string) {
    var lines = string.split("\n").filter(function(line) { 
        return !line.match(/^[\s\n]*$/);
    });

    if(lines.length > 1) return lines.reduce(function(prefix, line) {
        if(prefix) {
            var newPrefix = "";
            for(var i = 0; i < line.length; i++) 
                if(line[i] === prefix[i]) newPrefix += prefix[i];

            return newPrefix;
        } else return line;
    }, null);

    return null;
};

/**
 * Remove a prefix from the front of a text block.
 * @param  {String} string Block of text.
 * @return {String}        Unprefixed string.
 */
boh.unprefix = function(string) {
    var prefix = boh.extractPrefix(string);

    if(prefix) return string.replace(new RegExp("^" + prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "gm"), "");
    else return string;
};

/**
 * Extract rules from an input YAML string. YAML parser
 * errors are NOT caught, that's left up to you.
 *      
 * @param  {String} string String with rules.
 * @return {Array}         [{ name {String}, content {String} }]
 */
boh.extractRules = function(string) {
    // Parse the YAML header
    var data = yaml.safeLoad(string);

    if(data) {
        return Object.keys(data).reduce(function(rules, rule) {
            rules.push({ name: rule, content: data[rule] });
            return rules;
        }, []);
    } else return [];
};

/**
 * Find rules in the header of a file.
 * @param  {String}   file     /path/to/file
 * @param  {Function} callback (err, rules)
 */
boh.extractRulesFromFile = function(file, callback) {
    boh.extractHeaderFromStream(fs.createReadStream(file), function(err, header) {
        if(err) callback(err);
        else if(header) {
            // Remove any prefixes
            header = boh.unprefix(header);

            // Format any meta variables such as $this or $dir
            header = boh.format(header, {
                "this": file,
                "dir": path.dirname(file)
            });

            try {
                // Parse the YAML header and return
                var rules = boh.extractRules(header);

                // Add a reference to the file the rules was extracted from
                rules.forEach(function(rule) {
                    rule.file = file;
                });

                callback(null, rules);
            } catch(err) { 
                // Handle any parser errors
                callback(err); 
            }
        } else callback(null, []);
    });
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
    //      /(\\)?\$([a-zA-Z_0-9]+)/
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
    var phase = plugin.phase || "building";
    if(!boh.plugins[phase]) boh.plugins[phase] = {};

    debug("Registering plugin %s.", name);
    boh.plugins[phase][name] = plugin;
};

/**
 * Get a plugin by name,
 * @param  {String} name The name of the plugin.
 * @return {boh.Plugin}
 */
boh.getPlugin = function(phase, name) {
    if(boh.plugins[phase]) return boh.plugins[phase][name];
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
                // Push the dependencies matching boh- into the array
                if(err) callback(err);
                else if(packageJSON.dependencies) callback(null, Object.keys(packageJSON.dependencies).filter(isPlugin));
                else callback(null, []);
            });
        },

        function(plugins, callback) {
            // Read the global NODE_PATH for any installed plugins
            if(process.env.NODE_PATH) fs.readdir(process.env.NODE_PATH, function(err, entries) {
                if(err) callback(err);
                else callback(null, plugins.concat(entries.filter(isPlugin).map(function(plugin) { 
                    plugin = new String(plugin);
                    plugin.__global = true; // Add a flag to denote the plugin is loaded globally
                    return plugin;
                })))
            });
            else callback(plugins);
        },

        function(plugins, callback) {
            // Remove any duplicates
            callback(null, plugins.reduce(function(plugins, plugin) {
                if(plugins.indexOf(plugin.toString()) === -1) plugins.push(plugin);
                return plugins;
            }, []))
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
                    pluginExport = require(plugin.toString());

                pluginExport.pluginName = pluginName;
                pluginExport.debug = require("debug")("boh:plugin:" + pluginName);

                boh.registerPlugin(pluginName, pluginExport);
                ee.emit("plugin:loaded", plugin);
            } catch(err) {
                if(err.code === "MODULE_NOT_FOUND") ee.emit("plugin:error", plugin, err);
                else ee.emit("error", err);
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
        else if(entries.indexOf("package.json") !== -1) {
            debug("package.json found in %s", dir.magenta);

            var packageJSON = path.join(dir, "package.json");

            try {
                callback(null, require(packageJSON));
            } catch(err) {
                callback(new Error("Error importing " + packageJSON + "."));
            }
        } else if(dir === "/") callback(null, undefined);
        else boh.getPackageJSON(path.resolve(dir, ".."), callback);
    })
};

module.exports = boh;

// Export different components
boh.Plugin = require("./Plugin");
boh.Index = require("./Index");
boh.Indexer = require("./Indexer");
boh.Builder = require("./Builder");

// Require the packaged plugins in plugins/ and manually register them
fs.readdirSync(path.join(__dirname, "plugins")).forEach(function(plugin) {
    var pluginExport = require("./plugins/" + plugin),
        pluginName = plugin.replace(".js", "");

    plugin.pluginName = pluginName;
    plugin.debug = require("debug")("boh:plugin:" + pluginName);
    boh.registerPlugin(pluginName, pluginExport);
});
