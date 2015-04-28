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
 * Extract rules from an input YAML string. 
 *      
 * @param  {String} string String with rules.
 * @return {Array}         [{ name {String}, content {String} }]
 */
boh.extractRules = function(string) {
    // Parse the YAML header
    var data = yaml.safeLoad(string);

    return Object.keys(data).reduce(function(rules, rule) {
        rules.push({ name: rule, content: data[rule] });
        return rules;
    }, []);
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
            // Extract the header
            var header = boh.extractHeader(contents);

            if(header) {
                // Format any meta variables wuch as $this or $dir
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
                } catch(err) { callback(err); }
            } else callback(null, []);
        }
    ], callback);
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
        else if(entries.indexOf("package.json") !== -1) debug("package.json found in %s", dir.magenta), callback(null, require(path.join(dir, "package.json")));
        else if(dir === "/") callback(null, undefined);
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
