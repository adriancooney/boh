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