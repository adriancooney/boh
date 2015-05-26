module.exports = function(index, rule, callback) {
    this.log("Hello world from the bar plugin!");
    callback();
};