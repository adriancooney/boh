var boh = require("../"),
	assert = require("assert");

describe("boh.Index", function() {
	var index = new boh.Index("/a/b/c");

	describe("#ignore", function() {
		it("should add paths to the ignores with phase", function() {
			index.ignore("building", "a/b");
			index.ignore("indexing", ["a/b", "b/c"]);
			assert(index.ignores.building && index.ignores.indexing);
			assert.equal(index.ignores.building[0], "a/b");
			assert.deepEqual(index.ignores.indexing, ["a/b", "b/c"]);
		});
	});

	describe("#ignoring", function() {
		it("should return true or false whether the index is ignoring paths at a certain phase", function() {
			assert(index.ignoring("building", "a/b"));
			assert(index.ignoring("indexing", "b/c"));
			assert(!index.ignoring("building", "b/c"));
		});
	});

	describe("#relative", function () {
		it("should return a relative path", function() {
			assert.equal(index.relative("/a/b/c/file.txt"), "file.txt");
		});
	});
});