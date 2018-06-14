var path = require("path");
var fs = require("fs-extra");
var watch = require("glob-watcher");

var cwd = process.cwd();

// @function run (public) [Copy files from a folder to as many folder as de user wants] @param from {string} @ param to {[string]} [Array with multiple paths as output]
exports.run = function (from, to) {
    var length = to.length;
    for (var i = 0; i < length; i++) {
        fs.copy(from, to[i], function (err) {
            if (err) {
                return console.error(err);
            }
        })
    }

};

exports.watch = function(from, to){
    exports.run(from,to);   // Copy before watching
    
}