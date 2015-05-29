(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
    "filesystem": {
        "root": "project",
        "entries": {}
    },

    "files": {
        "project/src/index.js": [
            "<span class='keyword'>var</span> $ = require(<span class='string'>\"jquery\"</span>);\n\n$(<span class='string'>\"a[href='#top']\"</span>).click(function() {\n  $(<span class='string'>\"html, body\"</span>).animate({\n    scrollTop: 0\n  }, <span class='string'>\"slow\"</span>);\n  <span class='keyword'>return</span> false;\n});",
            "<span class=\"comment\">/*<span class='token'>boh</span>\n * <span class='build-rule'>build</span>: |\n *   <span class='build-content'>browserify -e $this \\</span>\n *     <span class='build-content'>-o ../build/bundle.js</span>\n */</span>\n<span class='keyword'>var</span> $ = require(<span class='string'>\"jquery\"</span>);\n\n$(<span class='string'>\"a[href='#top']\"</span>).click(function() {\n  $(<span class='string'>\"html, body\"</span>).animate({"
        ],

        "project/assets/style.scss": [
            "<span class='keyword'>body</span> {\n    <span class='keyword'>h1</span> {\n        font-family: Helvetica;\n        font-weight: bold;\n        font-size: 32px;\n    }\n\n    <span class='keyword'>h3</span> {\n        font-size: 16px",
            "<span class=\"comment\">//boh \n// build: <span class='build-content'>sass $this:../build/style.css</span></span>\n\n<span class='keyword'>body</span> {\n    <span class='keyword'>h1</span> {\n        font-family: Helvetica;\n        font-weight: bold;\n        font-size: 32px;\n    }"
        ]
    },

    "demo": [
        ["terminal:typeCommand", "cd project"],
        ["filesystem:flashEntry", "project/"],
        ["speaker:speak", "Let's give boh a shot in our new project.", 3000],
        ["speaker:speak", "Add some files..", 700],
        ["terminal:typeCommand", "mkdir src"],
        ["filesystem:createDirectory", "project/src/"],
        ["filesystem:flashEntry", "project/src/"],
        ["terminal:typeCommand", "touch src/index.js"],
        ["utility:wait", 300],
        ["filesystem:createFile", "project/src/index.js"],
        ["filesystem:highlightEntry", "project/src/index.js"],
        ["terminal:typeCommand", "edit src/index.js"],
        ["fileviewer:writeFile", "project/src/index.js", 0, 500],
        ["utility:wait", 1000],
        ["filesystem:unhighlightEntry", "project/src/index.js"],
        ["terminal:typeCommand", "mkdir assets"],
        ["filesystem:createDirectory", "project/assets/"],
        ["filesystem:flashEntry", "project/assets/"],
        ["terminal:typeCommand", "touch assets/style.scss"],
        ["filesystem:createFile", "project/assets/style.scss"],
        ["filesystem:highlightEntry", "project/assets/style.scss"],
        ["terminal:typeCommand", "edit assets/style.scss"],
        ["fileviewer:writeFile", "project/assets/style.scss", 0, 1000],
        ["filesystem:unhighlightEntry", "project/assets/style.scss"],
        ["speaker:speak", "Right, project created.", 1000],
        ["speaker:speak", "Let's create our first build rule.", 1000],
        ["terminal:typeCommand", "edit src/index.js"],
        ["filesystem:highlightEntry", "project/src/index.js"],
        ["fileviewer:openFile", "project/src/index.js", 0],
        ["speaker:speak", "Rules are defined at the top of a file.", 1500],
        ["speaker:speak", "Let's write a rule to browserify our JS.", 1500],
        ["fileviewer:writeFile", "project/src/index.js", 1, 1500],
        ["utility:wait", 1000],
        ["fileviewer:highlight", ".token"],
        ["speaker:speak", "This tell's boh that we've rules to build.", 3000],
        ["fileviewer:unhighlight", ".token"],
        ["fileviewer:highlight", ".build-rule"],
        ["speaker:speak", "This is a build rule. It runs commands.", 3000],
        ["fileviewer:unhighlight", ".build-rule"],
        ["fileviewer:highlight", ".build-content"],
        ["speaker:speak", "It will execute this code in the shell.", 3000],
        ["fileviewer:unhighlight", ".build-content"],
        ["filesystem:unhighlightEntry", "project/src/index.js"],
        ["fileviewer:openFile", "project/assets/style.scss", 0],
        ["filesystem:highlightEntry", "project/assets/style.scss"],
        ["speaker:speak", "Now, How about we compile our SASS?", 1500],
        ["terminal:typeCommand", "edit assets/style.scss"],
        ["fileviewer:writeFile", "project/assets/style.scss", 1, 1500],
        ["filesystem:unhighlightEntry", "project/assets/style.scss"],
        ["utility:wait", 2000],
        ["speaker:speak", "Okay, now lets run boh."],
        ["terminal:typeCommand", "boh"],
        ["terminal:append", "Running <span class=\"bg-black blue\">boh</span> in the <span class=\"magenta\">current directory</span>.\n\n"],
        ["speaker:speak", "boh will find the rules automatically"],
        ["filesystem:flashEntry", "project/"],
        ["filesystem:flashEntry", "project/src/"],
        ["filesystem:flashEntry", "project/src/index.js"],
        ["filesystem:highlightEntry", "project/src/index.js"],
        ["fileviewer:openFile", "project/src/index.js", 1],
        ["utility:wait", 1000],
        ["fileviewer:flash", ".build-rule", 800],
        ["utility:wait", 300],
        ["terminal:append", "    src/index.js:build"],
        ["speaker:speak", "And execute them."],
        ["fileviewer:highlight", ".build-content"],
        ["utility:wait", 1500],
        ["filesystem:createDirectory", "project/build/"],
        ["filesystem:flashEntry", "project/build/"],
        ["utility:wait", 1000],
        ["filesystem:createFile", "project/build/bundle.js"],
        ["filesystem:flashEntry", "project/build/bundle.js"],
        ["utility:wait", 1000],
        ["terminal:append", " <span class=\"green\">&#10004; (567ms)</span>\n\n"],
        ["fileviewer:unhighlight", ".build-content"],
        ["filesystem:unhighlightEntry", "project/src/index.js"],
        ["utility:wait", 1000],
        ["filesystem:flashEntry", "project/assets/"],
        ["filesystem:flashEntry", "project/assets/style.scss"],
        ["fileviewer:openFile", "project/assets/style.scss", 1],
        ["utility:wait", 1000],
        ["terminal:append", "    assets/style.scss:build"],
        ["fileviewer:highlight", ".build-content"],
        ["utility:wait", 1500],
        ["filesystem:createFile", "project/build/style.css"],
        ["filesystem:flashEntry", "project/build/style.css"],
        ["fileviewer:unhighlight", ".build-content"],
        ["utility:wait", 1000],
        ["terminal:append", " <span class=\"green\">&#10004; (389ms)</span>\n\n"],
        ["utility:wait", 1000],
        ["terminal:log", "Build complete <span class=\"green\">successfully</span>."],
        ["utility:wait", 1000],
        ["speaker:speak", "Tada! Simple as that, your project is built.", 3000],
        ["speaker:replay", "<a href=\"#replay\">Click here to replay demo.</a>"]
    ]
}
},{}],2:[function(require,module,exports){
var Utility = require("../library/Utility"),
    demo = require("../../demo.json"),
    path = require("path");

var FileViewer = function() {
    this.scaffold();
    this.setTitle("unknown");
};

FileViewer.prototype.scaffold = function() {
    this.element = document.createElement("div");
    this.element.classList.add("fileviewer");
    this.header = document.createElement("div");
    this.header.classList.add("header");
    this.header.innerHTML = "<span><i>&bull;</i><i>&bull;</i><i>&bull;</i></span>";

    this.element.appendChild(this.header);
    this.title = document.createElement("h5");
    this.header.appendChild(this.title);
    this.content = document.createElement("pre");
    this.element.appendChild(this.content);
};

FileViewer.prototype.getElement = function() {
    return this.element;
};

FileViewer.prototype.setTitle = function(title) {
    this.title.innerText = title;
};

FileViewer.prototype.setContent = function(string) {
    this.content.innerHTML = string;
};

FileViewer.prototype.empty = function(duration, callback) {
    this.setContent("");
};

FileViewer.prototype.writeContent = function(string, duration, callback) {
    if(typeof duration === "function") callback = duration, duration = 1000;

    var content = this.content;

    this.empty();
    Utility.type(string, duration, function(text, callback) {
        this.setContent(text);
        callback();
    }.bind(this), callback);
};

FileViewer.prototype.writeFile = function(pathspec, index, duration, callback) {
    this.title.innerText = path.basename(pathspec);
    this.writeContent(demo.files[pathspec][index], duration, callback);
};

FileViewer.prototype.openFile = function(pathspec, index, callback) {
    this.title.innerText = path.basename(pathspec);
    this.setContent(demo.files[pathspec][index]);
    if(callback) callback();
};

FileViewer.prototype.flash = function(name, duration, callback) {
    if(typeof duration === "function") callback = duration, duration = 500;

    this.highlight(name);
    setTimeout(function() {
        this.unhighlight(name);
        callback();
    }.bind(this), duration)
};

FileViewer.prototype.highlight = function(name, callback) {
    Array.prototype.forEach.call(this.element.querySelectorAll(name), function(elem) {
        elem.classList.add("highlighted");
    });

    if(callback) callback();
};

FileViewer.prototype.unhighlight = function(name, callback) {
    Array.prototype.forEach.call(this.element.querySelectorAll(name), function(elem) {
        elem.classList.remove("highlighted");
    });
    
    if(callback) callback();
};

module.exports = FileViewer;
},{"../../demo.json":1,"../library/Utility":7,"path":9}],3:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter,
    path = require("path");

var Filesystem = function(root, files) {
    this.scaffold();

    // Object with key values. Leafs are files.
    this.index = {};

    // Create the root folder
    this.root = this.index[root + "/"] = new Filesystem.Directory(root)

    // Convert the object to a filesystem
    if(files) (function expand(object, directory, path) {
        Object.keys(object).forEach(function(key) {
            if(typeof object[key] === "string") {
                var newFile = new Filesystem.File(key)
                this.index[path + key] = newFile;
                directory.addChild(newFile);
            } if(typeof object[key] === "object") {
                var newDirectory = new Filesystem.Directory(key);
                directory.addChild(newDirectory);
                var newPath = path + key + "/";
                this.index[newPath] = newDirectory;

                if(Array.isArray(object[key])) {
                    object[key].forEach(function(file) {
                        var newFile = new Filesystem.File(file)
                        this.index[newPath + file] = newFile;
                        newDirectory.addChild(newFile);
                    }, this);
                } else expand(object[key], newDirectory, newPath);
            }
        }, this);
    }.bind(this))(files, this.root, root + "/");

    this.element.appendChild(this.root.element);
};

Filesystem.prototype.scaffold = function() {
    this.element = document.createElement("div");
    this.element.classList.add("filesystem");
};

Filesystem.prototype.getElement = function() {
    return this.element;
};

Filesystem.prototype.createEntry = function(pathspec, entry, callback) {
    var dir = this.getEntry(path.dirname(pathspec) + "/");

    if(dir) {
        dir.addChild(entry);
        this.index[pathspec] = entry;
    }

    if(callback) callback();
};

Filesystem.prototype.createDirectory = function(pathspec, callback) {
    this.createEntry(pathspec, new Filesystem.Directory(path.basename(pathspec)), callback);
};

Filesystem.prototype.createFile = function(pathspec, callback) {
    this.createEntry(pathspec, new Filesystem.File(path.basename(pathspec)), callback);
};

Filesystem.prototype.getEntry = function(pathspec) {
    return this.index[pathspec];
};

Filesystem.prototype.highlightEntry = function(entry, callback) {
    var entry = this.getEntry(entry);

    if(entry) entry.highlight(callback);
};

Filesystem.prototype.unhighlightEntry = function(entry, callback) {
    var entry = this.getEntry(entry);

    if(entry) entry.unhighlight(callback);
};

Filesystem.prototype.flashEntry = function(entry, duration, callback) {
    if(typeof duration === "function") callback = duration, duration = 500;

    var entry = this.getEntry(entry);

    if(entry) entry.flash(duration, callback);
};

Filesystem.Directory = function(name) {
    this.directories = [];
    this.files = [];
    this.name = name;
    this.scaffold();
};

Filesystem.Directory.prototype.scaffold = function() {
    this.element = document.createElement("div");
    this.title = document.createElement("h3");

    this.element.classList.add("item");
    this.element.classList.add("directory");
    this.element.classList.add("leaf");

    this.span = document.createElement("span");
    this.span.innerText = this.name;

    this.title.appendChild(this.span);
    this.element.appendChild(this.title);
}

Filesystem.Directory.prototype.addChild = function(child) {
    // If a directory is added, remove the leaf
    if(child instanceof Filesystem.Directory) {
        this.element.classList.remove("leaf");

        this.directories.push(child);
        this.element.appendChild(child.element);
    } else if(child instanceof Filesystem.File) {
        this.files.push(child);

        // Create the file list if none exists
        if(!this.fileList) {
            this.fileList = document.createElement("div");
            this.fileList.classList.add("file-list");
            this.element.appendChild(this.fileList);
        }

        this.fileList.appendChild(child.element);
    }
};

Filesystem.Directory.prototype.flash = function(duration, callback) {
    if(typeof duration === "function") callback = duration, duration = 500;
    this.highlight();
    setTimeout(function() {
        this.unhighlight();
        callback();
    }.bind(this), duration)
};

Filesystem.Directory.prototype.highlight = function(callback) {
    this.span.classList.add("highlighted");
    if(callback) callback();
};

Filesystem.Directory.prototype.unhighlight = function(callback) {
    this.span.classList.remove("highlighted");
    if(callback) callback();
};

Filesystem.File = function(name) {
    EventEmitter.call(this);
    this.name = name;
    this.scaffold();
};

Filesystem.File.prototype = Object.create(EventEmitter.prototype);

Filesystem.File.prototype.scaffold = function() {
    this.element = document.createElement("h3");
    this.element.classList.add("file");
    this.span = document.createElement("span");
    this.a = document.createElement("a");
    this.a.innerText = this.name;
    this.a.href = "#";
    this.span.appendChild(this.a);
    this.element.appendChild(this.span);
    this.a.addEventListener("click", this.emit.bind(this, "click"));
};

Filesystem.File.prototype.flash = Filesystem.Directory.prototype.flash;
Filesystem.File.prototype.highlight = Filesystem.Directory.prototype.highlight;
Filesystem.File.prototype.unhighlight = Filesystem.Directory.prototype.unhighlight;

module.exports = Filesystem;
},{"events":8,"path":9}],4:[function(require,module,exports){
var Utility = require("../library/Utility");

var Speaker = function() {
    this.scaffold();
};

Speaker.prototype.scaffold = function() {
    this.element = document.createElement("div");
    this.element.classList.add("speaker");

    this.p = document.createElement("p");
    this.element.appendChild(this.p);
};

Speaker.prototype.getElement = function() {
    return this.element;
};

Speaker.prototype.speak = function(sentence, duration, callback) {
    if(typeof duration === "function") callback = duration, duration = undefined;

    this.p.classList.add("fade-out");
    setTimeout(function() {
        this.p.innerHTML = sentence;
        this.p.classList.remove("fade-out");
        setTimeout(function() {
            if(duration) setTimeout(callback, duration);
            else callback();
        }, 1000);
    }.bind(this), 300);
};

Speaker.prototype.replay = function(sentence, duration, callback) {
    this.speak(sentence, 0, function() {
        this.p.querySelector("a").addEventListener("click", function() {
            if(this.onReplay) this.onReplay();
        }.bind(this));
    }.bind(this));
};

module.exports = Speaker;
},{"../library/Utility":7}],5:[function(require,module,exports){
var Utility = require("../library/Utility");

var Terminal = function() {
    this.scaffold();
};

Terminal.prototype.scaffold = function() {
    this.element = document.createElement("div");
    this.element.classList.add("terminal");
    this.pre = document.createElement("pre");
    this.element.appendChild(this.pre);
};
 
Terminal.prototype.getElement = function() {
    return this.element;
};

Terminal.prototype.append = function(string, callback) {
    this.pre.innerHTML = this.pre.innerHTML + string;
    this.scrollToBottom();
    if(callback) callback();
};

Terminal.prototype.log = function(string, callback) {
    this.append(string + "\n"); 
    if(callback) callback();
};

Terminal.prototype.command = function(string) {
    this.log("<span class='input'><span class='green'>$</span> " + string + "</span>");
};

Terminal.prototype.typeCommand = function(string, duration, callback) {
    if(typeof duration === "function") callback = duration, duration = 500;

    var span = document.createElement("span"),
        dollah = "<span class='green'>$</span> ";

    span.classList.add("input");
    this.pre.appendChild(span);
    this.pre.appendChild(document.createElement("br"));

    Utility.type(string + "\n", duration, function(text, callback) {
        span.innerHTML = dollah + text;
        callback();
    }, function() {
        this.scrollToBottom();
        setTimeout(callback, 300);
    }.bind(this));
};

Terminal.prototype.scrollToBottom = function() {
    this.element.scrollTop = this.element.scrollHeight;
};

module.exports = Terminal;
},{"../library/Utility":7}],6:[function(require,module,exports){
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
},{"../demo.json":1,"./demo/FileViewer":2,"./demo/Filesystem":3,"./demo/Speaker":4,"./demo/Terminal":5,"./library/Utility":7}],7:[function(require,module,exports){
var Utility = {
    type: function(text, duration, iterator, callback) {
        if(typeof duration === "function") callback = iterator, iterator = duration, duration = 1500;

        var interval = Math.floor(duration/text.length);
        (function iterate(string) {
            if(string.length < text.length) {
                string = text.substr(0, string.length + 1);
                setTimeout(iterator, interval, string, iterate.bind(null, string));
            } else if(callback) callback();
        })("");
    },

    wait: function(duration, callback) {
        setTimeout(callback, duration);
    }
};

module.exports = Utility;
},{}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],9:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":10}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[6]);
