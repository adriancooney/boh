var boh = require("../"),
    assert = require("assert");

describe("boh.Index", function() {
    var index = new boh.Index("/a/b/c");

    describe("#ignore", function() {
        it("should add paths to the ignores with phase", function() {
            index.ignore("a/b");
            index.ignore(["a/b", "b/c"]);
            assert(Array.isArray(index.ignored));
            assert.deepEqual(index.ignored, ["a/b", "b/c"]);
        });
    });

    describe("#ignoring", function() {
        it("should return true or false whether the index is ignoring paths at a certain phase", function() {
            assert(index.ignoring("a/b"));
            assert(index.ignoring("b/c"));
            assert(!index.ignoring("a/c"));
        });
    });

    describe("#relative", function () {
        it("should return a relative path", function() {
            assert.equal(index.relative("/a/b/c/file.txt"), "file.txt");
            assert.equal(index.relative("/a/b/c/file.txt", "../e/f.txt"), "/a/b/e/f.txt");
        });
    });

    describe("#linkRelative", function() {
        it("should link with anymatch pattern", function() {
            index.linkRelative("/a/b.js", "*.js");
            assert.deepEqual(index.links["/a/*.js"], ["/a/b.js"]);
            index.linkRelative("/a/b/c/d.js", "../src/*.js");
            assert.deepEqual(index.links["/a/b/src/*.js"], ["/a/b/c/d.js"]);
            index.linkRelative("/a/b/e/f.js", "../../*.js");
            assert.deepEqual(index.links["/a/*.js"], ["/a/b.js", "/a/b/e/f.js"]);
        });
    });

    describe("#findLinks", function() {
        it("should find the links", function() {
            index.linkRelative("/a/b/c/file.js", "src/*.js");

            assert.deepEqual(index.findLinks("/a/b/c/src/a.js"), ["/a/b/c/file.js"]);
            assert.deepEqual(index.findLinks("/a/f.js"), ["/a/b.js", "/a/b/e/f.js"]);
        });
    });

    describe("#getRulesForFile", function() {
        it("should return rules for linked files", function() {
            index.linkRelative("/a/b.js", "foo/bar/*.js")
            index.addRules("/a/b.js", [{ foo: "bar" }]);

            var rules = index.getRulesForFile("/a/foo/bar/lol.js");

            assert(rules.length);
            assert(rules[0].foo === "bar");
        });
    });
});