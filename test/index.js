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
		});
	});

	describe("#link", function() {
		it("should link with anymatch pattern", function() {
			index.link("/a/b.js", "*.js");
			assert(Object.keys(index.links).filter(function(pathname) {
				return pathname.match(/\*\.js$/);
			}).length);
		});
	});

	describe("#getRulesForFile", function() {
		it("should return rules for linked files", function() {
			index.addRules("/a/b.js", [{ foo: "bar" }]);
			var rules1 = index.getRulesForFile("lol.js"),
				rules2 = index.getRulesForFile("/a/lol.js");

			assert(!rules1);
			assert(rules2.length);
		});
	});
});