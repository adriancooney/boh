(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
    "filesystem": {
        "root": "project",
        "entries": {
            "build": {},
            "src": ["index.js", "User.js"]
        }
    },

    "files": {
        "project/src/index.js": "Hello world!"
    },

    "demo": [
        ["terminal:typeCommand", "cd project"],
        ["filesystem:flashEntry", "project/"],
        ["utility:wait", 800],
        ["terminal:typeCommand", "boh", 1000],
        ["filesystem:flashEntry", "project/src/"],
        ["filesystem:highlightEntry", "project/src/index.js"],
        ["fileviewer:writeFile", "project/src/index.js"],
        ["terminal:log", "    project/src/index.js:build"]
    ]
}
},{}],2:[function(require,module,exports){
var Utility = require("../library/Utility"),
    demo = require("../../demo.json");

var FileViewer = function() {
    this.scaffold();
    this.setTitle("file.txt");
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

    var content = this.content,
        interval = Math.floor(duration/string.length);

    this.empty();
    Utility.type(string, function(text, callback) {
        this.setContent(text);
        callback();
    }.bind(this), callback);
};

FileViewer.prototype.writeFile = function(path, duration, callback) {
    this.writeContent(demo.files[path], duration, callback);
};

module.exports = FileViewer;
},{"../../demo.json":1,"../library/Utility":6}],3:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;

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

Filesystem.prototype.getEntry = function(path) {
    return this.index[path];
};

Filesystem.prototype.highlightEntry = function(entry, callback) {
    var entry = this.getEntry(entry);

    if(entry) entry.highlight(callback);
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
},{"events":7}],4:[function(require,module,exports){
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

Terminal.prototype.append = function(string) {
    this.pre.innerHTML = this.pre.innerHTML + string;
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
    }, callback);
};

Terminal.prototype.scrollToBottom = function() {

};

module.exports = Terminal;
},{"../library/Utility":6}],5:[function(require,module,exports){
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
},{"../demo.json":1,"./demo/FileViewer":2,"./demo/Filesystem":3,"./demo/Terminal":4,"./library/Utility":6}],6:[function(require,module,exports){
var Utility = {
    type: function(text, duration, iterator, callback) {

        console.log(text, duration, iterator, callback);

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
},{}],7:[function(require,module,exports){
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

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uL2RlbW8uanNvbiIsImRlbW8vRmlsZVZpZXdlci5qcyIsImRlbW8vRmlsZXN5c3RlbS5qcyIsImRlbW8vVGVybWluYWwuanMiLCJpbmRleC5qcyIsImxpYnJhcnkvVXRpbGl0eS5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHM9e1xuICAgIFwiZmlsZXN5c3RlbVwiOiB7XG4gICAgICAgIFwicm9vdFwiOiBcInByb2plY3RcIixcbiAgICAgICAgXCJlbnRyaWVzXCI6IHtcbiAgICAgICAgICAgIFwiYnVpbGRcIjoge30sXG4gICAgICAgICAgICBcInNyY1wiOiBbXCJpbmRleC5qc1wiLCBcIlVzZXIuanNcIl1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgXCJwcm9qZWN0L3NyYy9pbmRleC5qc1wiOiBcIkhlbGxvIHdvcmxkIVwiXG4gICAgfSxcblxuICAgIFwiZGVtb1wiOiBbXG4gICAgICAgIFtcInRlcm1pbmFsOnR5cGVDb21tYW5kXCIsIFwiY2QgcHJvamVjdFwiXSxcbiAgICAgICAgW1wiZmlsZXN5c3RlbTpmbGFzaEVudHJ5XCIsIFwicHJvamVjdC9cIl0sXG4gICAgICAgIFtcInV0aWxpdHk6d2FpdFwiLCA4MDBdLFxuICAgICAgICBbXCJ0ZXJtaW5hbDp0eXBlQ29tbWFuZFwiLCBcImJvaFwiLCAxMDAwXSxcbiAgICAgICAgW1wiZmlsZXN5c3RlbTpmbGFzaEVudHJ5XCIsIFwicHJvamVjdC9zcmMvXCJdLFxuICAgICAgICBbXCJmaWxlc3lzdGVtOmhpZ2hsaWdodEVudHJ5XCIsIFwicHJvamVjdC9zcmMvaW5kZXguanNcIl0sXG4gICAgICAgIFtcImZpbGV2aWV3ZXI6d3JpdGVGaWxlXCIsIFwicHJvamVjdC9zcmMvaW5kZXguanNcIl0sXG4gICAgICAgIFtcInRlcm1pbmFsOmxvZ1wiLCBcIiAgICBwcm9qZWN0L3NyYy9pbmRleC5qczpidWlsZFwiXVxuICAgIF1cbn0iLCJ2YXIgVXRpbGl0eSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L1V0aWxpdHlcIiksXG4gICAgZGVtbyA9IHJlcXVpcmUoXCIuLi8uLi9kZW1vLmpzb25cIik7XG5cbnZhciBGaWxlVmlld2VyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY2FmZm9sZCgpO1xuICAgIHRoaXMuc2V0VGl0bGUoXCJmaWxlLnR4dFwiKTtcbn07XG5cbkZpbGVWaWV3ZXIucHJvdG90eXBlLnNjYWZmb2xkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZpbGV2aWV3ZXJcIik7XG4gICAgdGhpcy5oZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJoZWFkZXJcIik7XG4gICAgdGhpcy5oZWFkZXIuaW5uZXJIVE1MID0gXCI8c3Bhbj48aT4mYnVsbDs8L2k+PGk+JmJ1bGw7PC9pPjxpPiZidWxsOzwvaT48L3NwYW4+XCI7XG5cbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5oZWFkZXIpO1xuICAgIHRoaXMudGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDVcIik7XG4gICAgdGhpcy5oZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy50aXRsZSk7XG4gICAgdGhpcy5jb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250ZW50KTtcbn07XG5cbkZpbGVWaWV3ZXIucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xufTtcblxuRmlsZVZpZXdlci5wcm90b3R5cGUuc2V0VGl0bGUgPSBmdW5jdGlvbih0aXRsZSkge1xuICAgIHRoaXMudGl0bGUuaW5uZXJUZXh0ID0gdGl0bGU7XG59O1xuXG5GaWxlVmlld2VyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdGhpcy5jb250ZW50LmlubmVySFRNTCA9IHN0cmluZztcbn07XG5cbkZpbGVWaWV3ZXIucHJvdG90eXBlLmVtcHR5ID0gZnVuY3Rpb24oZHVyYXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5zZXRDb250ZW50KFwiXCIpO1xufTtcblxuRmlsZVZpZXdlci5wcm90b3R5cGUud3JpdGVDb250ZW50ID0gZnVuY3Rpb24oc3RyaW5nLCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICBpZih0eXBlb2YgZHVyYXRpb24gPT09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2sgPSBkdXJhdGlvbiwgZHVyYXRpb24gPSAxMDAwO1xuXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmNvbnRlbnQsXG4gICAgICAgIGludGVydmFsID0gTWF0aC5mbG9vcihkdXJhdGlvbi9zdHJpbmcubGVuZ3RoKTtcblxuICAgIHRoaXMuZW1wdHkoKTtcbiAgICBVdGlsaXR5LnR5cGUoc3RyaW5nLCBmdW5jdGlvbih0ZXh0LCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnNldENvbnRlbnQodGV4dCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfS5iaW5kKHRoaXMpLCBjYWxsYmFjayk7XG59O1xuXG5GaWxlVmlld2VyLnByb3RvdHlwZS53cml0ZUZpbGUgPSBmdW5jdGlvbihwYXRoLCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICB0aGlzLndyaXRlQ29udGVudChkZW1vLmZpbGVzW3BhdGhdLCBkdXJhdGlvbiwgY2FsbGJhY2spO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlVmlld2VyOyIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlcjtcblxudmFyIEZpbGVzeXN0ZW0gPSBmdW5jdGlvbihyb290LCBmaWxlcykge1xuICAgIHRoaXMuc2NhZmZvbGQoKTtcblxuICAgIC8vIE9iamVjdCB3aXRoIGtleSB2YWx1ZXMuIExlYWZzIGFyZSBmaWxlcy5cbiAgICB0aGlzLmluZGV4ID0ge307XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3QgZm9sZGVyXG4gICAgdGhpcy5yb290ID0gdGhpcy5pbmRleFtyb290ICsgXCIvXCJdID0gbmV3IEZpbGVzeXN0ZW0uRGlyZWN0b3J5KHJvb3QpXG5cbiAgICAvLyBDb252ZXJ0IHRoZSBvYmplY3QgdG8gYSBmaWxlc3lzdGVtXG4gICAgaWYoZmlsZXMpIChmdW5jdGlvbiBleHBhbmQob2JqZWN0LCBkaXJlY3RvcnksIHBhdGgpIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaWYodHlwZW9mIG9iamVjdFtrZXldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0ZpbGUgPSBuZXcgRmlsZXN5c3RlbS5GaWxlKGtleSlcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4W3BhdGggKyBrZXldID0gbmV3RmlsZTtcbiAgICAgICAgICAgICAgICBkaXJlY3RvcnkuYWRkQ2hpbGQobmV3RmlsZSk7XG4gICAgICAgICAgICB9IGlmKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZXdEaXJlY3RvcnkgPSBuZXcgRmlsZXN5c3RlbS5EaXJlY3Rvcnkoa2V5KTtcbiAgICAgICAgICAgICAgICBkaXJlY3RvcnkuYWRkQ2hpbGQobmV3RGlyZWN0b3J5KTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGF0aCA9IHBhdGggKyBrZXkgKyBcIi9cIjtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4W25ld1BhdGhdID0gbmV3RGlyZWN0b3J5O1xuXG4gICAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShvYmplY3Rba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0W2tleV0uZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RmlsZSA9IG5ldyBGaWxlc3lzdGVtLkZpbGUoZmlsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhbbmV3UGF0aCArIGZpbGVdID0gbmV3RmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RpcmVjdG9yeS5hZGRDaGlsZChuZXdGaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGV4cGFuZChvYmplY3Rba2V5XSwgbmV3RGlyZWN0b3J5LCBuZXdQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfS5iaW5kKHRoaXMpKShmaWxlcywgdGhpcy5yb290LCByb290ICsgXCIvXCIpO1xuXG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucm9vdC5lbGVtZW50KTtcbn07XG5cbkZpbGVzeXN0ZW0ucHJvdG90eXBlLnNjYWZmb2xkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZpbGVzeXN0ZW1cIik7XG59O1xuXG5GaWxlc3lzdGVtLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbn07XG5cbkZpbGVzeXN0ZW0ucHJvdG90eXBlLmdldEVudHJ5ID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIHJldHVybiB0aGlzLmluZGV4W3BhdGhdO1xufTtcblxuRmlsZXN5c3RlbS5wcm90b3R5cGUuaGlnaGxpZ2h0RW50cnkgPSBmdW5jdGlvbihlbnRyeSwgY2FsbGJhY2spIHtcbiAgICB2YXIgZW50cnkgPSB0aGlzLmdldEVudHJ5KGVudHJ5KTtcblxuICAgIGlmKGVudHJ5KSBlbnRyeS5oaWdobGlnaHQoY2FsbGJhY2spO1xufTtcblxuRmlsZXN5c3RlbS5wcm90b3R5cGUuZmxhc2hFbnRyeSA9IGZ1bmN0aW9uKGVudHJ5LCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICBpZih0eXBlb2YgZHVyYXRpb24gPT09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2sgPSBkdXJhdGlvbiwgZHVyYXRpb24gPSA1MDA7XG5cbiAgICB2YXIgZW50cnkgPSB0aGlzLmdldEVudHJ5KGVudHJ5KTtcblxuICAgIGlmKGVudHJ5KSBlbnRyeS5mbGFzaChkdXJhdGlvbiwgY2FsbGJhY2spO1xufTtcblxuRmlsZXN5c3RlbS5EaXJlY3RvcnkgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5kaXJlY3RvcmllcyA9IFtdO1xuICAgIHRoaXMuZmlsZXMgPSBbXTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuc2NhZmZvbGQoKTtcbn07XG5cbkZpbGVzeXN0ZW0uRGlyZWN0b3J5LnByb3RvdHlwZS5zY2FmZm9sZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoM1wiKTtcblxuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaXRlbVwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImRpcmVjdG9yeVwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImxlYWZcIik7XG5cbiAgICB0aGlzLnNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICB0aGlzLnNwYW4uaW5uZXJUZXh0ID0gdGhpcy5uYW1lO1xuXG4gICAgdGhpcy50aXRsZS5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnRpdGxlKTtcbn1cblxuRmlsZXN5c3RlbS5EaXJlY3RvcnkucHJvdG90eXBlLmFkZENoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAvLyBJZiBhIGRpcmVjdG9yeSBpcyBhZGRlZCwgcmVtb3ZlIHRoZSBsZWFmXG4gICAgaWYoY2hpbGQgaW5zdGFuY2VvZiBGaWxlc3lzdGVtLkRpcmVjdG9yeSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImxlYWZcIik7XG5cbiAgICAgICAgdGhpcy5kaXJlY3Rvcmllcy5wdXNoKGNoaWxkKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkLmVsZW1lbnQpO1xuICAgIH0gZWxzZSBpZihjaGlsZCBpbnN0YW5jZW9mIEZpbGVzeXN0ZW0uRmlsZSkge1xuICAgICAgICB0aGlzLmZpbGVzLnB1c2goY2hpbGQpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmlsZSBsaXN0IGlmIG5vbmUgZXhpc3RzXG4gICAgICAgIGlmKCF0aGlzLmZpbGVMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZUxpc3QuY2xhc3NMaXN0LmFkZChcImZpbGUtbGlzdFwiKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmZpbGVMaXN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZmlsZUxpc3QuYXBwZW5kQ2hpbGQoY2hpbGQuZWxlbWVudCk7XG4gICAgfVxufTtcblxuRmlsZXN5c3RlbS5EaXJlY3RvcnkucHJvdG90eXBlLmZsYXNoID0gZnVuY3Rpb24oZHVyYXRpb24sIGNhbGxiYWNrKSB7XG4gICAgaWYodHlwZW9mIGR1cmF0aW9uID09PSBcImZ1bmN0aW9uXCIpIGNhbGxiYWNrID0gZHVyYXRpb24sIGR1cmF0aW9uID0gNTAwO1xuICAgIHRoaXMuaGlnaGxpZ2h0KCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bmhpZ2hsaWdodCgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH0uYmluZCh0aGlzKSwgZHVyYXRpb24pXG59O1xuXG5GaWxlc3lzdGVtLkRpcmVjdG9yeS5wcm90b3R5cGUuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLnNwYW4uY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodGVkXCIpO1xuICAgIGlmKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xufTtcblxuRmlsZXN5c3RlbS5EaXJlY3RvcnkucHJvdG90eXBlLnVuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLnNwYW4uY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodGVkXCIpO1xuICAgIGlmKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xufTtcblxuRmlsZXN5c3RlbS5GaWxlID0gZnVuY3Rpb24obmFtZSkge1xuICAgIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5zY2FmZm9sZCgpO1xufTtcblxuRmlsZXN5c3RlbS5GaWxlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSk7XG5cbkZpbGVzeXN0ZW0uRmlsZS5wcm90b3R5cGUuc2NhZmZvbGQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDNcIik7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaWxlXCIpO1xuICAgIHRoaXMuc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHRoaXMuYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIHRoaXMuYS5pbm5lclRleHQgPSB0aGlzLm5hbWU7XG4gICAgdGhpcy5hLmhyZWYgPSBcIiNcIjtcbiAgICB0aGlzLnNwYW4uYXBwZW5kQ2hpbGQodGhpcy5hKTtcbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zcGFuKTtcbiAgICB0aGlzLmEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZW1pdC5iaW5kKHRoaXMsIFwiY2xpY2tcIikpO1xufTtcblxuRmlsZXN5c3RlbS5GaWxlLnByb3RvdHlwZS5mbGFzaCA9IEZpbGVzeXN0ZW0uRGlyZWN0b3J5LnByb3RvdHlwZS5mbGFzaDtcbkZpbGVzeXN0ZW0uRmlsZS5wcm90b3R5cGUuaGlnaGxpZ2h0ID0gRmlsZXN5c3RlbS5EaXJlY3RvcnkucHJvdG90eXBlLmhpZ2hsaWdodDtcbkZpbGVzeXN0ZW0uRmlsZS5wcm90b3R5cGUudW5oaWdobGlnaHQgPSBGaWxlc3lzdGVtLkRpcmVjdG9yeS5wcm90b3R5cGUudW5oaWdobGlnaHQ7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZXN5c3RlbTsiLCJ2YXIgVXRpbGl0eSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L1V0aWxpdHlcIik7XG5cbnZhciBUZXJtaW5hbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2NhZmZvbGQoKTtcbn07XG5cblRlcm1pbmFsLnByb3RvdHlwZS5zY2FmZm9sZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ0ZXJtaW5hbFwiKTtcbiAgICB0aGlzLnByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucHJlKTtcbn07XG4gXG5UZXJtaW5hbC5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG59O1xuXG5UZXJtaW5hbC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdGhpcy5wcmUuaW5uZXJIVE1MID0gdGhpcy5wcmUuaW5uZXJIVE1MICsgc3RyaW5nO1xufTtcblxuVGVybWluYWwucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKHN0cmluZywgY2FsbGJhY2spIHtcbiAgICB0aGlzLmFwcGVuZChzdHJpbmcgKyBcIlxcblwiKTsgXG4gICAgaWYoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG59O1xuXG5UZXJtaW5hbC5wcm90b3R5cGUuY29tbWFuZCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHRoaXMubG9nKFwiPHNwYW4gY2xhc3M9J2lucHV0Jz48c3BhbiBjbGFzcz0nZ3JlZW4nPiQ8L3NwYW4+IFwiICsgc3RyaW5nICsgXCI8L3NwYW4+XCIpO1xufTtcblxuVGVybWluYWwucHJvdG90eXBlLnR5cGVDb21tYW5kID0gZnVuY3Rpb24oc3RyaW5nLCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICBpZih0eXBlb2YgZHVyYXRpb24gPT09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2sgPSBkdXJhdGlvbiwgZHVyYXRpb24gPSA1MDA7XG5cbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpLFxuICAgICAgICBkb2xsYWggPSBcIjxzcGFuIGNsYXNzPSdncmVlbic+JDwvc3Bhbj4gXCI7XG5cbiAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJpbnB1dFwiKTtcbiAgICB0aGlzLnByZS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB0aGlzLnByZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnJcIikpO1xuXG4gICAgVXRpbGl0eS50eXBlKHN0cmluZyArIFwiXFxuXCIsIGR1cmF0aW9uLCBmdW5jdGlvbih0ZXh0LCBjYWxsYmFjaykge1xuICAgICAgICBzcGFuLmlubmVySFRNTCA9IGRvbGxhaCArIHRleHQ7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSwgY2FsbGJhY2spO1xufTtcblxuVGVybWluYWwucHJvdG90eXBlLnNjcm9sbFRvQm90dG9tID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGVybWluYWw7IiwiLy8hYm9oXG4vLyBidWlsZDogYnJvd3NlcmlmeSAtZSAkdGhpcyAtbyAuLi9hc3NldHMvYnVpbGQvaW5kZXguanMgLS1kZWJ1Z1xuLy8gbGluazogLi8qLyouanNcbi8vIGlnbm9yZTogLi4vYXNzZXRzL2J1aWxkL2luZGV4LmpzXG5cbnZhciBGaWxlVmlld2VyID0gcmVxdWlyZShcIi4vZGVtby9GaWxlVmlld2VyXCIpLFxuICAgIEZpbGVzeXN0ZW0gPSByZXF1aXJlKFwiLi9kZW1vL0ZpbGVzeXN0ZW1cIiksXG4gICAgVGVybWluYWwgPSByZXF1aXJlKFwiLi9kZW1vL1Rlcm1pbmFsXCIpLFxuICAgIFV0aWxpdHkgPSByZXF1aXJlKFwiLi9saWJyYXJ5L1V0aWxpdHlcIiksXG4gICAgZGVtbyA9IHJlcXVpcmUoXCIuLi9kZW1vLmpzb25cIik7XG5cbnZhciBEZW1vID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdGVybWluYWwgPSB0aGlzLnRlcm1pbmFsID0gbmV3IFRlcm1pbmFsKCk7XG4gICAgICAgIHZhciBmaWxldmlld2VyID0gdGhpcy5maWxldmlld2VyID0gbmV3IEZpbGVWaWV3ZXIoKTtcbiAgICAgICAgdmFyIGZpbGVzeXN0ZW0gPSB0aGlzLmZpbGVzeXN0ZW0gPSBuZXcgRmlsZXN5c3RlbShkZW1vLmZpbGVzeXN0ZW0ucm9vdCwgZGVtby5maWxlc3lzdGVtLmVudHJpZXMpO1xuXG4gICAgICAgIC8vIEFwcGVuZCB0aGUgZWxlbWVudHMgaW50byB0aGUgZG9jdW1lbnRcbiAgICAgICAgW1wiZmlsZXZpZXdlclwiLCBcImZpbGVzeXN0ZW1cIiwgXCJ0ZXJtaW5hbFwiXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuXCIgKyBpdGVtICsgXCItc2xvdFwiKS5hcHBlbmRDaGlsZCh0aGlzW2l0ZW1dLmdldEVsZW1lbnQoKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucnVuKGRlbW8uZGVtbywge1xuICAgICAgICAgICAgdGVybWluYWw6IHRlcm1pbmFsLFxuICAgICAgICAgICAgZmlsZXZpZXdlcjogZmlsZXZpZXdlcixcbiAgICAgICAgICAgIGZpbGVzeXN0ZW06IGZpbGVzeXN0ZW0sXG4gICAgICAgICAgICB1dGlsaXR5OiBVdGlsaXR5XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uKHJlZWwsIGZ1bmN0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgKGZ1bmN0aW9uIHJ1bihyZWVsKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IHJlZWwuc2hpZnQoKTtcblxuICAgICAgICAgICAgaWYoaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmKGl0ZW1bMF0ubWF0Y2goLyhcXHcrKTooXFx3KykvKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gUmVnRXhwLiQxLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm4gPSBSZWdFeHAuJDI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoZnVuY3Rpb25zW29iamVjdF0gJiYgZnVuY3Rpb25zW29iamVjdF1bZm5dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVzOiVzKCVzKVwiLCBvYmplY3QsIGZuLCBpdGVtLnNsaWNlKDEpLmpvaW4oXCIsIFwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbnNbb2JqZWN0XVtmbl0uYXBwbHkoZnVuY3Rpb25zW29iamVjdF0sIGl0ZW0uc2xpY2UoMSkuY29uY2F0KFtydW4uYmluZChudWxsLCByZWVsKV0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGNvbnNvbGUud2FybihcIiVzOiVzKCVzKSBub3QgZm91bmQuXCIsIG9iamVjdCwgZm4sIGl0ZW0uc2xpY2UoMSkuam9pbihcIiwgXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSkocmVlbCk7XG4gICAgfVxufTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgRGVtby5pbml0LmJpbmQoRGVtbykpOyIsInZhciBVdGlsaXR5ID0ge1xuICAgIHR5cGU6IGZ1bmN0aW9uKHRleHQsIGR1cmF0aW9uLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcblxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0LCBkdXJhdGlvbiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZih0eXBlb2YgZHVyYXRpb24gPT09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2sgPSBpdGVyYXRvciwgaXRlcmF0b3IgPSBkdXJhdGlvbiwgZHVyYXRpb24gPSAxNTAwO1xuXG4gICAgICAgIHZhciBpbnRlcnZhbCA9IE1hdGguZmxvb3IoZHVyYXRpb24vdGV4dC5sZW5ndGgpO1xuICAgICAgICAoZnVuY3Rpb24gaXRlcmF0ZShzdHJpbmcpIHtcbiAgICAgICAgICAgIGlmKHN0cmluZy5sZW5ndGggPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHN0cmluZyA9IHRleHQuc3Vic3RyKDAsIHN0cmluZy5sZW5ndGggKyAxKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGl0ZXJhdG9yLCBpbnRlcnZhbCwgc3RyaW5nLCBpdGVyYXRlLmJpbmQobnVsbCwgc3RyaW5nKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pKFwiXCIpO1xuICAgIH0sXG5cbiAgICB3YWl0OiBmdW5jdGlvbihkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgc2V0VGltZW91dChjYWxsYmFjaywgZHVyYXRpb24pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbGl0eTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
