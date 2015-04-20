var boh = require("../src/boh"),
	path = require("path"),
	assert = require("assert");

const EXAMPLE_DIR = path.join(__dirname, "/dir");

describe("boh", function () {
	describe(".extractHeader", function() {
		it("should extract a rule from `//` comment head", function() {
			assert.equal(boh.extractHeader("// Hello world!"), " Hello world!");
			assert.equal(boh.extractHeader("// Hello world!\n// Hello world again!"), " Hello world!\n Hello world again!");
			assert.equal(boh.extractHeader("// Hello world!\n// Hello world again!\nfoo"), " Hello world!\n Hello world again!");
		});

		it("should extract a rule from `/* */` comment head", function() {
			assert.equal(boh.extractHeader("/* Hello world!"), " Hello world!");
			assert.equal(boh.extractHeader("/* Hello world! */"), " Hello world! ");
			assert.equal(boh.extractHeader("/* Hello world! */ "), " Hello world! ");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!"), " Hello world! \n Hello world again!");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!\n* And again! */"), " Hello world! \n Hello world again!\n And again! ");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!\n* And again! \n*/"), " Hello world! \n Hello world again!\n And again! ");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!\n* And again! */foo"), " Hello world! \n Hello world again!\n And again! ");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!\n* And again! */\nfoo"), " Hello world! \n Hello world again!\n And again! ");
			assert.equal(boh.extractHeader("/* Hello world! \n * Hello world again!\n* And again! */\n* foo"), " Hello world! \n Hello world again!\n And again! ");
			assert.equal(boh.extractHeader("/* Hello world! \n Hello world again!\n And again! */\n* foo"), " Hello world! \n Hello world again!\n And again! ");
		});

		it("should extract a rule from `#` comment head", function() {
			assert.equal(boh.extractHeader("# Hello world!"), " Hello world!");
			assert.equal(boh.extractHeader("# Hello world!\n# Hello world again!"), " Hello world!\n Hello world again!");
			assert.equal(boh.extractHeader("# Hello world!\n# Hello world again!\nfoo"), " Hello world!\n Hello world again!");
		});
	});

	describe(".extractRules", function() {
		it("should extract a single line rule", function() {
			assert.deepEqual(boh.extractRules("build:foo"), [{ rule: "build", content: "foo" }]);
			assert.deepEqual(boh.extractRules(" build: foo"), [{ rule: "build", content: " foo" }]);
			assert.deepEqual(boh.extractRules(" build: foo\nbar"), [{ rule: "build", content: " foo" }]);
		});

		it("should extract a multi-line rule", function() {
			assert.deepEqual(boh.extractRules("build:\nfoo"), [{ rule: "build", content: "foo" }]);
			assert.deepEqual(boh.extractRules("build:\nfoo\n bar"), [{ rule: "build", content: "foo\n bar" }]);
			assert.deepEqual(boh.extractRules(" build:\nfoo\n bar"), [{ rule: "build", content: "foo\n bar" }]);
		});

		it("should extract a multiple single line rules", function() {
			assert.deepEqual(boh.extractRules("build: foo\nincludes: none"), 
				[{ rule: "build", content: " foo" }, { rule: "includes", content: " none"}]);
		});

		it("should extract a multiple multi-line rules", function() {
			assert.deepEqual(boh.extractRules("build: \nfoo\nincludes: \nnone\ntwo"), 
				[{ rule: "build", content: "foo" }, { rule: "includes", content: "none\ntwo"}]);
		});

		it("should extract a multiple single line and multi-line rules", function() {
			assert.deepEqual(boh.extractRules("build: \nfoo\nbar: root\nincludes: \nnone\ntwo"), 
				[{ rule: "build", content: "foo" }, { rule: "bar", content: " root" }, { rule: "includes", content: "none\ntwo"}]);
		});
	});

	describe(".extractRulesFromHeader", function () {
		var expected = [{ rule: "build", content: " browserify" }, { rule: "includes", content: "   index.js\n   User.js" }];
		it("should extract the rules from an // header", function() {
			var header = [
				"// build: browserify",
				"// includes:",
				"//   index.js",
				"//   User.js",
			].join("\n");

			assert.deepEqual(boh.extractRulesFromHeader(header), expected);
		});

		it("should extract the rules from an // header", function() {
			var header = [
				"# build: browserify",
				"# includes:",
				"#   index.js",
				"#   User.js",
			].join("\n");

			assert.deepEqual(boh.extractRulesFromHeader(header), expected);
		});

		it("should extract the rules from an // header", function() {
			var header = [
				"/* build: browserify",
				" includes:",
				"   index.js",
				"   User.js*/",
			].join("\n");

			assert.deepEqual(boh.extractRulesFromHeader(header), expected);
		});

		it("should extract the rules from an // header", function() {
			var header = [
				"/* build: browserify",
				" * includes:",
				" *   index.js",
				" *   User.js*/",
			].join("\n");

			assert.deepEqual(boh.extractRulesFromHeader(header), expected);
		});

		it("should extract the rules from an // header", function() {
			var header = [
				"/* build: browserify",
				" * includes:",
				" *   index.js",
				" *   User.js",
				" */",
			].join("\n");

			assert.deepEqual(boh.extractRulesFromHeader(header), expected);
		});
	});

	describe(".extractRulesFromFile", function () {
		it("should extract headers from file", function(next) {
			boh.extractRulesFromFile(path.join(__dirname, "/dir/example.js"), function(err, rules) {
				if(err) next(err);
				else {
					assert.deepEqual(rules, [{
						rule: "build",
						content: " \t\tbrowserify --input $this --output ../lul\n \t\techo \"Hello world!\"\n \t\tpwd"
					}, {
						rule: "includes",
						content: " hurr/durr/foo.js"
					}]);

					next();
				}
			});
		});
	});

	describe(".buildIndex", function() {
		it("should create a new index from the filesystem", function(next) {
			boh.buildIndex(EXAMPLE_DIR, function(err, index) {
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
			boh.buildIndex(EXAMPLE_DIR, { ignore: ["*.js"] }, function(err, index) {
				if(err) next(err);
				else next();
			});
		});
	});

	describe(".execute", function () {
		it("should execute a simple script", function(done) {
			boh.execute("/", "echo \"Hello world\"", function(err, stdout, stderr) {
				if(err) done(err);
				else {
					assert.equal(stdout, "Hello world\n");
					done();
				}
			});
		});

		it("should change the cwd", function(done) {
			boh.execute(__dirname, "pwd", function(err, stdout) {
				if(err) done(err);
				else assert.equal(__dirname + "\n", stdout), done();
			});
		});
	});

	describe(".build", function () {
		var index;
		before(function(done) {
			boh.buildIndex(EXAMPLE_DIR, function(err, _index) {
				index = _index;
				done();
			});
		});

		it("should build an index", function(done) {
			boh.build(index, function(err, output) {
				assert(Array.isArray(output));
				done();
			});
		});
	});

	describe(".format", function() {
		it("should correctly format a string", function() {
			var output = boh.format("Hello $world!", { world: "Batman"});
			
			assert.equal(output, "Hello Batman!");
		});

		it("should allow for escaped variables", function() {
			var output = boh.format("Hello \\$world!", { world: "Batman"});
			
			assert.equal(output, "Hello $world!");
		});

		it("should allow for [a-zA-Z_0-9] in variable names", function() {
			var output = boh.format("Hello $foo_bar1!", { foo_bar1: "Batman"});
			
			assert.equal(output, "Hello Batman!");
		});

		it("should allow for custom prefixes", function() {
			var output = boh.format("Hello %world!", { world: "Batman"}, "%");
			
			assert.equal(output, "Hello Batman!");
		});
	});

	describe("Index", function () {
		describe("#relative", function () {
			it("should return a relative path", function() {
				var index = new boh.Index("/a/b/c");

				assert.equal(index.relative("/a/b/c/file.txt"), "file.txt");
			});
		});
	});
});