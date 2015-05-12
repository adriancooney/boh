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