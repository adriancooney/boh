//boh
// build: browserify -e $this -o ../assets/build/index.js
// link: ./*/*.js, ../demo.json
// ignore: ../assets/build/index.js

var FileViewer = require("./demo/FileViewer"),
    Filesystem = require("./demo/Filesystem"),
    Terminal = require("./demo/Terminal"),
    Speaker = require("./demo/Speaker"),
    Utility = require("./library/Utility"),
    demo = require("../demo.json");

var Demo = {
    init: function() {
        var dimo = {
            terminal: new Terminal(),
            fileviewer: new FileViewer(),
            filesystem: new Filesystem(demo.filesystem.root, demo.filesystem.entries),
            speaker: new Speaker(),
            utility: Utility
        };

        dimo.speaker.onReplay = Demo.init.bind(Demo);

        // Append the elements into the document
        Object.keys(dimo).forEach(function(item) {
            if(item === "utility") return;
            var element = document.querySelector("." + item + "-slot");
            element.innerHTML = "";
            element.appendChild(dimo[item].getElement());
        });

        this.run(demo.demo, dimo);
    },

    run: function(reel, functions, callback) {
        reel = reel.slice();
        (function run(reel) {
            var item = reel.shift();

            if(item) {
                if(item[0].match(/(\w+):(\w+)/)) {
                    var object = RegExp.$1,
                        fn = RegExp.$2;

                    if(functions[object] && functions[object][fn]) {
                        functions[object][fn].apply(functions[object], item.slice(1).concat([run.bind(null, reel)]));
                    } else console.warn("%s:%s(%s) not found.", object, fn, item.slice(1).join(", "));
                }
            } else if(callback) callback();
        }.bind(this))(reel);
    }
};

document.addEventListener("DOMContentLoaded", Demo.init.bind(Demo));