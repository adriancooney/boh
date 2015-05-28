var boh = require("../src/boh"),
    path = require("path"),
    assert = require("assert"),
    stream = require("stream");

const EXAMPLE_DIR = path.join(__dirname, "/dir");

describe("boh", function () {
    describe(".extractHeaderFromStream", function() {
        it("should create a ReadableStream", function(done) {
            var content = "Hello world!",
                readable = streamWithContent(content);

            readable.on("data", function(chunk) {
                assert.equal(chunk.toString(), content);
            });

            readable.on("end", done);
        });

        it("should push multiple chunks of content", function(done) {
            var content = ["Hello world!", "Foo Bar"],
                readable = streamWithContent(content.slice()),
                i = 0;

            readable.on("data", function(chunk) {
                assert.equal(content[i++], chunk.toString());
            });

            readable.on("end", done);
        });

        it("should not extract the contents without the comment being at the start of the stream", function(done) {
            boh.extractHeaderFromStream(streamWithContent([
                "Foo bar",
                "//boh Hello world!"
            ].join("\n")), function(err, contents) {
                assert.equal(contents, "");
                done();
            });
        });

        it("should extract the contents of a comment spanning multiple lines (non multiline comment)", function(done) {
            boh.extractHeaderFromStream(streamWithContent([
                "//bohfoo",
                "// Hello world",
                "//",
                "// Batman, you suck!",
                "",
                "// Another comment",
                "foo bar"
            ].join("\n"), done), function(err, contents) {
                assert.equal([
                    "foo",
                    " Hello world",
                    "",
                    " Batman, you suck!"
                ].join("\n"), contents);
                done();
            });
        });

        it("should extract the contents of a multiline comment", function(done) {
            boh.extractHeaderFromStream(streamWithContent([
                "/*boh",
                "Hello world",
                "",
                "Batman, you suck!",
                "*/",
                "// Another comment",
                "foo bar"
            ].join("\n"), done), function(err, contents) {
                assert.equal([
                    "",
                    "Hello world",
                    "",
                    "Batman, you suck!",
                    ""
                ].join("\n"), contents);
                done();
            });
        });

        it("should extract the contents of a single line comment with opening and closing tags", function(done) {
            boh.extractHeaderFromStream(streamWithContent("/*boh Hello world! */"), function(err, contents) {
                assert.equal(" Hello world! ", contents);
                done();
            });
        });

        it("should maintain context over multiple chunks", function(done) {
            boh.extractHeaderFromStream(streamWithContent([[
                "//boh",
                "// Hello world!",
                "//"
            ].join("\n"), " Hello world again!"]), function(err, contents) {
                assert.equal(contents, [
                    "",
                    " Hello world!",
                    " Hello world again!"
                ].join("\n"));
                done();
            });
        });

        it("should understand empty text blocks", function() {
            boh.extractHeaderFromStream(streamWithContent(""), function(err, contents) {
                assert.equal(contents, null);
                done();
            });
        });

        function streamWithContent(strings) {
            var readable = new stream.Readable(),
                data = Array.isArray(strings) ? strings : [strings];

            readable._read = function() {
                this.push(data.length ? data.shift() : null);
            };

            return readable;
        }
    });

    describe(".extractPrefix", function() {
        it("should extract the prefix from a text block", function() {
            assert.equal(boh.extractPrefix([
                "abcfedghij",
                "abcfejlls",
                "abcdasy"
            ].join("\n")), "abc");
        });

        it("should ignore empty lines", function() {
            assert.equal(boh.extractPrefix([
                "\n",
                "abcfedghij",
                "",
                "abcfejlls",
                "abcdasy",
                ""
            ].join("\n")), "abc");
        });

        it("should not find a prefix a single line", function() {
            assert.equal(boh.extractPrefix("Hello world!"), null);
        });

        it("should not find a prefix with line amoung empty lines", function() {
            assert.equal(boh.extractPrefix("\n * build: woo!\n"), null);
        });
    });

    describe(".unprefix", function() {
        it("should unprefix tabs from the start of a block", function() {
            assert.equal(boh.unprefix([
                "//   Hello world!",
                "//      Bar",
                "//   Foo"
            ].join("\n")), [
                "Hello world!",
                "   Bar",
                "Foo"
            ].join("\n"));
        });

        it("should unprefix stars from the start of a block", function() {
            assert.equal(boh.unprefix([
                " * build: |",
                " *   browserify --input /Users/Adrian/Dropbox/Projects/boh/test/dir/example.js --output ../lul",
                " *   echo \"Hello world!\"",
                " *   pwd",
                " * link: hurr/durr/foo.js"
            ].join("\n")), [
                "build: |",
                "  browserify --input /Users/Adrian/Dropbox/Projects/boh/test/dir/example.js --output ../lul",
                "  echo \"Hello world!\"",
                "  pwd",
                "link: hurr/durr/foo.js",
            ].join("\n"));
        });

        it("should not unprefix a single line", function() {
            assert.equal(boh.unprefix("Hello world!"), "Hello world!");
        });
    });

    describe(".extractRulesFromFile", function () {
        it("should extract headers from file", function(next) {
            var filename = path.join(__dirname, "/dir/example.js");
            boh.extractRulesFromFile(filename, function(err, rules) {
                if(err) next(err);
                else {
                    assert.deepEqual(rules, [{
                        name: "build",
                        content: "browserify --input " + filename + " --output ../lul\necho \"Hello world!\"\npwd\n",
                        file: filename
                    }, {
                        name: "link",
                        content: "hurr/durr/foo.js",
                        file: filename
                    }]);

                    next();
                }
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

    describe("boh.Builder", function () {
        var index;
        before(function(done) {
            var indexer = new boh.Indexer();
            indexer.index(EXAMPLE_DIR + "/hurr/durr", function(err, _index) {
                index = _index;
                done();
            });
        });

        it("should build an index", function(done) {
            var builder = new boh.Builder();

            assert(builder instanceof require("events").EventEmitter);

            builder.build(index, function(err, output) {
                console.log(arguments);
                if(err) done(err);
                else assert(Array.isArray(output)), done();
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
            var output = boh.format("Hello %world!", { world: "Batman" }, "%");
            
            assert.equal(output, "Hello Batman!");
        });
    });

    describe(".getPackageJSON", function () {
        it("should find the local package.json", function(done) {
            boh.getPackageJSON(path.join(__dirname, "dir/hurr/durr/"), function(err, packageJSON) {
                if(err) done(err);
                else {
                    assert.equal(packageJSON.name, "dir");
                    done();
                }
            });
        });
    });

    describe(".findPlugins", function() {
        it("should find the local plugins", function(done) {
            boh.findPlugins(path.join(__dirname, "dir/hurr/durr/"), function(err, plugins) {
                if(err) done(err);
                else {
                    assert.deepEqual(plugins, ["boh-foo", "boh-bar"]);
                    done();
                }
            });
        })
    });
});