var path = require("path");
var fs = require("fs-extra");
var watch = require("glob-watcher");
var io = require("@vimlet/io");

var cwd = process.cwd();

// @function run (public) [Copy files from a folder to as many folder as de user wants] @param from {string} @param to {[string]} [Array with multiple paths as output]
exports.run = function (from, to, options) {
    options = options || {};
    if(options.exclude){
        // Use glob to generate filterFunction
        // const filterFunc = (src, dest) => {
        //     // your logic here
        //     // it will be copied if return true
        //   }
        // And pass filter functin to options.filter
    }
    var length = to.length;
    for (var i = 0; i < length; i++) {
        var destination = path.join(to[i], path.basename(from));
        emptyAndCopy(from, destination);
    }

};

// @function emptyAndCopy [Empty directory and copy data from folder to output folder]   @param from {string} [Project folder] @param to {string} [Output folder]
function emptyAndCopy(from, to, options) {
    options = options || {};
    fs.emptyDir(to, function (err) {
        if (err) {
            return console.error(err);
        }
        fs.copy(from, to, {
            filter: options.filter
        }, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    });
}



exports.watch = function (from, to, options) {
    options = options || {};
    exports.run(from, to, options); // Copy before watching
var output = to[0]; // TODO do a for loop and take each output from there.
    var watcher = watch(from, {
        events: ['add', 'change', 'unlink', 'addDir', 'unlinkDir']
    });
    watcher.on('change', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            // Relative output is where the template will be saved after parsed
            var relativeOutput = getRelativeOutput(from, output, filePath);
            
        }
    });
    watcher.on('add', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            // Relative output is where the template will be saved after parsed
            var relativeOutput = getRelativeOutput(from, output, filePath);
           console.log(filePath);
           console.log(relativeOutput);
           // TODO, get path where the file must be stored
           
        }
    });
    watcher.on('unlink', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            // Relative output is where the template will be saved after parsed
            var relativeOutput = getRelativeOutput(from, output, filePath, true);
            // var parsedPath = path.join(relativeOutput, path.basename(filePath, ".vmt"));
            // if (fs.existsSync(parsedPath)) {
            //     fs.unlinkSync(parsedPath);
            //     console.log("Removed --> ", parsedPath);
            // }
        }
    });
    watcher.on('addDir', function (filePath, stat) {
        var relativeOutput = getRelativeOutput(from, output, filePath);
        // fs.mkdirs(path.join(relativeOutput, path.basename(filePath)), function () {
        //     console.log("Folder created --> ", filePath, "=>", path.join(relativeOutput, path.basename(filePath)));
        // });
    });
    watcher.on('unlinkDir', function (filePath, stat) {
        var relativeOutput = getRelativeOutput(from, output, filePath, true);
        // fs.remove(path.join(relativeOutput, path.basename(filePath)), function () {
        //     console.log("Folder removed --> ", path.join(relativeOutput, path.basename(filePath)));
        // });
    });
    watcher.on('error', function (error) {
        if (process.platform === 'win32' && error.code === 'EPERM') {
            // Deleting an empty folder doesn't fire on windows
        } else {
            broadcastErr(error);
        }
    });
}

/*
@function getRelativeOutput [Get path relative to output]
@param from [from patterns]
@param output
@param filePath
@param deleted [Flag to know if the file was deleted so it skips files in pattern check]
*/
function getRelativeOutput(from, output, filePath, deleted) {
    var relativeOutput;
    if (!Array.isArray(from)) {
      if (io.isInPattern(filePath, from) || deleted) {
        var rootFromPattern = io.getRootFromPattern(from);
        // Relative output is where the template will be saved after parse
        relativeOutput = path.dirname(path.relative(rootFromPattern, filePath));
        relativeOutput = path.join(output, relativeOutput);
      }
    } else {
      from.forEach(function (incl) {
        if (io.isInPattern(filePath, incl) || deleted) {
          var rootFromPattern = io.getRootFromPattern(incl);
          // Relative output is where the template will be saved after parse
          relativeOutput = path.dirname(path.relative(rootFromPattern, filePath));
          relativeOutput = path.join(output, relativeOutput);
        }
      });
    }
    return relativeOutput;
  }

// @function isExlcuded [Check if given file is excluded]
function isExcluded(excluded, filePath) {
    if (!excluded) {
      return false;
    }
    if (!Array.isArray(excluded)) {
      return io.isInPattern(filePath, excluded);
    } else {
      var isIn = false;
      excluded.forEach(function (excl) {
        if (io.isInPattern(filePath, excl)) {
          isIn = true;
        }
      });
      return isIn;
    }
  }