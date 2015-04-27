var cli = require("../bin/boh"),
	boh = require("../"),
	fs = require("fs"),
	path = require("path"),
	async = require("async"),
	assert = require("assert");

const EXAMPLE_DIR = path.join(__dirname, "/dir");

describe("CLI", function () {
	describe("option", function () {
		it("should parse a boolean option", function() {
			var option = cli.option("--version", "-v", ["--version"])

			assert(option);
		});

		it("should parse a value", function() {
			var option = cli.option("--input", "-i", ["--input",  "../.."]);

			assert.equal(option, "../..");
		});

		it("should parse a string literal", function() {
			var option = cli.option("--input", "-i", ["--input", "\"Hello World!\""]);

			assert.equal(option, "Hello World!");
		});
	});

	describe("events", function() {
		var index, newFile = path.join(EXAMPLE_DIR, "add-example.js");

		before(function(done) {
			var indexer = new boh.Indexer();

			indexer.index(EXAMPLE_DIR, function(err, _index) {
				if(err) done(err);
				else index = _index, done();
			});
		});

		after(function(done) {
			fs.unlink(newFile, done);
		});

		describe("add", function() {
			it("should handle adding a new file to the index", function(done) {
				async.waterfall([
					fs.writeFile.bind(fs, newFile, [
						"/*!boh",
						" * build: woo!",
						" */"
					].join("\n")),

					cli.events.add.bind(null, index, null, newFile),

					function(callback) {
						assert(index.files.indexOf(newFile) !== -1);

						var rules = index.getRulesForFile(newFile);
						assert(rules.length);
						assert(rules.filter(function(rule) { return rule.name === "build"; }).length);
						callback();
					}
				], done);
			});
		});

		describe("change", function() {
			it("should update rules on file change and run the build rules", function(done) {
				async.waterfall([
					fs.writeFile.bind(fs, newFile, [
						"/*!boh",
						" * build: woot",
						" */"
					].join("\n")),

					cli.events.change.bind(null, index, "TEST", newFile),

					function(output, callback) {
						assert(index.files.indexOf(newFile) !== -1);

						var rules = index.getRulesForFile(newFile);
						assert(rules.length);
						assert(rules.filter(function(rule) { return rule.name === "build" && rule.content === "woot"; }).length);
						callback();
					}
				], done);
			});
		});

		describe("addDir", function() {
			it("should update rules on file change and run the build rules", function(done) {
				var newDir = path.join(EXAMPLE_DIR, "root");
				async.series([
					cli.events.addDir.bind(null, index, "TEST", newDir),

					function(callback) {
						assert(index.directories.indexOf(newDir) !== -1);
						callback();
					}
				], done);
			});
		});
	});
});