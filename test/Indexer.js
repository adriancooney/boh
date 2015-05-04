var boh = require("../"),
    path = require("path"),
    assert = require("assert");

const EXAMPLE_DIR = path.join(__dirname, "/dir");

describe("Indexer", function() {
    it("should create a new index from the filesystem", function(next) {
        var indexer = new boh.Indexer();
        indexer.index(EXAMPLE_DIR, function(err, index) {
            if(err) next(err);
            else {
                assert(Array.isArray(index.files) && index.files.length, "Has files array.");
                assert([/example\.js$/, /foo\.js/].every(function(g) { return index.files.some(function(f) { return f.match(g); }); }), "Has files in index.");

                assert(Array.isArray(index.directories) && index.directories.length, "Has directories array");
                assert([/hurr$/, /durr$/].every(function(g) { return index.directories.some(function(f) { return f.match(g); }); }), "Has directories in index.");

                assert(typeof index.rules === "object", "Has rules object.");
                next();
            }
        });
    });

    it("should ignore specified paths", function(next) {
        var indexer = new boh.Indexer();
        indexer.index(EXAMPLE_DIR, { ignore: ["*.js"] }, function(err, index) {
            if(err) next(err);
            else next();
        });
    });
});