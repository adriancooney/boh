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