var path = require("path");

module.exports = function(logger, builder, verbose, directory) {
    var errors = [], TAB = "    ";

    builder.on("rule", function(plugin, rule) {
        var descriptor = path.relative(directory, rule.file).yellow + ":" + rule.name.cyan;

        plugin.on("start", function() {
            logger.raw("\n" + TAB + descriptor + (verbose ? "\n" : ""));
        });

        if(verbose) plugin.on("log", logger.log.bind(null, TAB + TAB));

        plugin.on("error", function(err) {
            errors.push(err);
            logger.raw((verbose ? "\n" + TAB + descriptor : "") + " ✘".red + " -> " + "Error: ".red + err.message + "\n");
        });

        plugin.on("finish", function(rule) {
            logger.raw((verbose ? TAB + descriptor : "") + (" ✓ (" + rule.duration + "ms)").green + "\n");

            if(typeof rule.output === "string") rule.output.split("\n").filter(function(line) {
                return !!line;
            }).map(function(line) {
                return TAB + TAB + "-> ".red + line;
            }).forEach(function(line) { logger.log(line) });
        });
    });
    
    builder.on("error", function(err, rule) {
        var descriptor = path.relative(directory, rule.file).yellow + ":" + rule.name.red;

        switch(err.code) {
            case "PLUGIN_NOT_FOUND":
                logger.log("\n" + TAB + descriptor + " -> Plugin " + rule.name.red + " not found: Try running " + ("npm install --save-dev boh-" + rule.name).blue);
            break;
        }

        errors.push([err, rule]);
    })

    builder.on("finish", function() {
        logger.log("\nBuild complete " + (errors.length ? ("with " + errors.length + " error" + (errors.length > 1 ? "s" : "")).red : "successfully".green) + ".")
    });
};