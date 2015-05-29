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