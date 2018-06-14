exports.instance = function () {
    var store = store || {};
    (function () {
        const electron = require('electron');
        const path = require('path');
        const fs = require('fs');

        // Default saved data if any
        var def = {};
        def.windowBounds = {};
        def.windowBounds.width = 800;
        def.windowBounds.height = 600;
        def.servers = {};

        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        
        this.path = path.join(userDataPath, 'user-preferences.json');
        this.data = parseDataFile(this.path, def);


        store.get = function (key) {
            return this.data[key];
        }

        store.set = function (key, val) {
            this.data[key] = val;
            fs.writeFileSync(this.path, JSON.stringify(this.data));
        }

        function parseDataFile(filePath, defaults) {
            try {
                return JSON.parse(fs.readFileSync(filePath));
            } catch (error) {
                // if there was some kind of error, return the passed in defaults instead.
                return defaults;
            }
        }


    }.apply(store));
    return store;
};