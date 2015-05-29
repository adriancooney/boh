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