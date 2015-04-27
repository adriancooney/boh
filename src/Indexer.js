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

    // Push the ignored
    index.ignore(options.ignore);

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
                    if(index.ignoring(entry)) {
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
                                index.addFile(entry, function(err, file, rules) {
                                    if(err) {
                                        err.file = entry;
                                        // If we callback(err), it kills the indexing.
                                        // We'll just emit the error. Okay, since 
                                        self.emit("error:index", err);
                                    } else {
                                        // An indentation of 9 tabs Adrian. Not good.
                                        self.emit("file", file, rules);
                                    }

                                    callback(null, entry, rules);
                                });
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

module.exports = Indexer;