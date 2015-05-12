//!boh
// build: browserify -e $this -o ../assets/build/index.js --debug
// link: ./*/*.js
// ignore: ../assets/build/index.js

var FileViewer = require("./demo/FileViewer"),
    Filesystem = require("./demo/Filesystem"),
    Terminal = require("./demo/Terminal"),
    Utility = require("./library/Utility"),
    demo = require("../demo.json");

var Demo = {
    init: function() {
        var terminal = this.terminal = new Terminal();
        var fileviewer = this.fileviewer = new FileViewer();
        var filesystem = this.filesystem = new Filesystem(demo.filesystem.root, demo.filesystem.entries);

        // Append the elements into the document
        ["fileviewer", "filesystem", "terminal"].forEach(function(item) {
            document.querySelector("." + item + "-slot").appendChild(this[item].getElement());
        }, this);

        this.run(demo.demo, {
            terminal: terminal,
            fileviewer: fileviewer,
            filesystem: filesystem,
            utility: Utility
        });
    },

    run: function(reel, functions, callback) {
        (function run(reel) {
            var item = reel.shift();

            if(item) {
                if(item[0].match(/(\w+):(\w+)/)) {
                    var object = RegExp.$1,
                        fn = RegExp.$2;

                    if(functions[object] && functions[object][fn]) {
                        console.log("%s:%s(%s)", object, fn, item.slice(1).join(", "));
                        functions[object][fn].apply(functions[object], item.slice(1).concat([run.bind(null, reel)]));
                    } else console.warn("%s:%s(%s) not found.", object, fn, item.slice(1).join(", "));
                }
            } else if(callback) callback();
        }.bind(this))(reel);
    }
};

document.addEventListener("DOMContentLoaded", Demo.init.bind(Demo));