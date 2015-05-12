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