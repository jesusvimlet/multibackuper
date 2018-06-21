var path = require("path");
var fs = require("fs-extra");
var watch = require("glob-watcher");
var io = require("@vimlet/io");
var vCompress = require("@vimlet/compress");
var glob = require("glob");

var cwd = process.cwd();

var versionsFolder = "mb_versions";

// @function run (public) [Copy files from a folder to as many folder as de user wants] @param from {string} @param to {[string]} [Array with multiple paths as output] @param options [exclude: exclude patterns from backup] @param callback
exports.run = function (from, to, options, callback) {
    options = options || {};
    if (options.exclude) {
        options.exclude = excludeDir(options.exclude);
    }
    var files = io.getFiles(from, options);
    emptyDestSync(to);
    copyFiles(files, to, callback);
};

// @function watch (public) {object} [Keep watching folder for changes] @param from {string} @param to {string[]} @param options [exclude: exclude patterns from backup]
exports.watch = function (from, to, options) {
    options = options || {};
    exports.run(from, to, options); // Copy before watching
    if (options.exclude) {
        // Ensure that from is in exclude, else add it to not look the whole drive
        var excludeLenght = options.exclude.length;
        for (var exclI = 0; exclI < excludeLenght; exclI++) {
            if (options.exclude[exclI].indexOf(from) < 0) {
                options.exclude[exclI] = path.join(from, options.exclude[exclI]);
            }
        }
    }

    var watcher = watch(from, {
        events: ['add', 'change', 'unlink', 'unlinkDir']
    });
    watcher.on('change', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            var length = to.length;
            for (var i = 0; i < length; i++) {
                // Relative output is where the template will be saved after parsed
                var relativeOutput = getRelativeOutput(from, to[i], filePath);
                fs.copy(filePath, path.join(relativeOutput, path.basename(filePath)));
            }
        }
    });
    watcher.on('add', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            var length = to.length;
            for (var i = 0; i < length; i++) {
                // Relative output is where the template will be saved after parsed
                var relativeOutput = getRelativeOutput(from, to[i], filePath);
                fs.copy(filePath, path.join(relativeOutput, path.basename(filePath)));
            }
        }
    });
    watcher.on('unlink', function (filePath, stat) {
        if (!isExcluded(options.exclude, filePath)) {
            var length = to.length;
            for (var i = 0; i < length; i++) {
                // Relative output is where the template will be saved after parsed
                var relativeOutput = getRelativeOutput(from, to[i], filePath, true);
                var parsedPath = path.join(relativeOutput, path.basename(filePath));
                if (fs.existsSync(parsedPath)) {
                    fs.unlinkSync(parsedPath);
                }
            }
        }
    });
    watcher.on('unlinkDir', function (filePath, stat) {
        var length = to.length;
        for (var i = 0; i < length; i++) {
            // Relative output is where the template will be saved after parsed
            var relativeOutput = getRelativeOutput(from, to[i], filePath, true);
            fs.remove(path.join(relativeOutput, path.basename(filePath)), function () {});
        }
    });
    watcher.on('error', function (error) {
        if (process.platform === 'win32' && error.code === 'EPERM') {
            // Deleting an empty folder doesn't fire on windows
        } else {
            broadcastErr(error);
        }
    });
    return watcher;
}


// @function run (public) [Copy files from a folder to as many folder as de user wants] @param from {string} @param to {[string]} [Array with multiple paths as output] @param version [Version name, delete if exists] @param options [description: Description of the version. exclude: exclude patterns from backup] @param callback
exports.version = function (from, to, version, options, callback) {
    options = options || {};
    if (options.exclude) {
        options.exclude = excludeDir(options.exclude);
    }
    var files = io.getFiles(from, options);
    version = version || "0.0.1";

    var temporal = path.join(cwd, version);
    emptyDestSync([temporal]);

    fs.ensureDir(temporal, function (error) {
        if (error) {
            console.log("Error saving version");
        }
        var subTemporalPath = path.join(temporal, version);
        fs.ensureDir(subTemporalPath, function (error) {
            if (error) {
                console.log("Error saving version");
            }
            if (options.description) {
                var descriptionOutput = path.join(temporal, "description.txt");
                io.writeToDisk(descriptionOutput, options.description, function () {
                    var finalFile = path.resolve(path.join(temporal, version) + ".zip");
                    copyFiles(files, [subTemporalPath], function () {
                        vCompress.pack(subTemporalPath, finalFile, "zip", {
                            "doneHandler": function () {
                                io.deleteFolderRecursiveSync(subTemporalPath);
                                var length = to.length;
                                for (var i = 0; i < length; i++) {
                                    io.deleteFolderRecursiveSync(path.join(to[i], versionsFolder, version));
                                    fs.copySync(temporal, path.join(to[i], versionsFolder, version));
                                    io.deleteFolderRecursiveSync(temporal);
                                }
                            }
                        });
                    });
                });
            } else {
                var finalFile = path.resolve(path.join(temporal, version) + ".zip");
                copyFiles(files, [subTemporalPath], function () {
                    vCompress.pack(subTemporalPath, finalFile, "zip", {
                        "doneHandler": function () {
                            io.deleteFolderRecursiveSync(subTemporalPath);
                            var length = to.length;
                            for (var i = 0; i < length; i++) {
                                io.deleteFolderRecursiveSync(path.join(to[i], versionsFolder, version));
                                fs.copySync(temporal, path.join(to[i], versionsFolder, version));
                                io.deleteFolderRecursiveSync(temporal);
                            }
                        }
                    });
                });
            }
        });
    });
};

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

// @function excludeDir [Add magic to exclude folder]
function excludeDir(exclude) {
    var length = exclude.length;
    for (var i = 0; i < length; i++) {
        if (io.isDirectory(exclude[i])) {
            exclude[i] += "/**/*";
        }
    }
    return exclude;
}


// @function copyFiles (private) [Copy files to several folders] @param files {object} [Object containing root and relative paths] @param to {string[]} 
function copyFiles(files, to, callback) {
    // Total files to copy
    var totalFiles = 0;
    for (var key in files) {
        files[key].files.forEach(function (file) {
            totalFiles++;
        });
    }
    totalFiles = totalFiles * to.length; // Total files * number of clone destinations
    for (var key in files) {
        files[key].files.forEach(function (file) {
            var length = to.length;
            for (var i = 0; i < length; i++) {
                fs.copy(path.join(files[key].root, file), path.join(to[i], file), function () {
                    totalFiles--;
                    if (totalFiles <= 0 && callback) {
                        callback();
                    }
                });
            }
        });
    }
}


// @function emptyDestSync (private) [Empty folder]
function emptyDestSync(to) {
    var length = to.length;
    for (var i = 0; i < length; i++) {
        fs.emptyDirSync(to[i]);
    }
}