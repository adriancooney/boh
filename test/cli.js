var cli = require("../bin/boh"),
	assert = require("assert");

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
});