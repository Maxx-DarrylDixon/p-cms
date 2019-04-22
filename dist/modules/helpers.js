"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
function updateSRVConfig(data) {
    var config = {};
    try {
        config = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, "../srv-config.json")).toString());
    }
    catch (error) {
        config.theme = "example";
    }
    Object.keys(data)
        .map(function (key) {
        var updateData = data[key];
        config[key] = updateData;
    });
    fs_1.writeFileSync(path_1.join(__dirname, "../srv-config.json"), JSON.stringify(data));
}
exports.updateSRVConfig = updateSRVConfig;
// gets every plugin and its database data
function aggregateAllPluginData(dbs, store, options, callback) {
    if (options === void 0) { options = {}; }
    new Promise(function (res, rej) {
        var plugins = store.getPlugins();
        // data gathered from the database
        var data = {
            adminViews: []
        };
        // variable used to track how many collections have been queried
        if (plugins.length == 0) {
            res(data);
            return;
        }
        var index = -1;
        // iterate and send plugin info to itter2 until there are no more plugins
        function itter1() {
            index++;
            if (index >= plugins.length) {
                console.log("no more plugins");
                res(data);
                return;
            }
            data.adminViews.push(plugins[index]);
            itter2(plugins[index]);
        }
        // get collection documents for a given plugin
        function itter2(plugin) {
            console.log("getting plugin database data");
            if (plugin.databaseCollections.length === 0) {
                itter1();
            }
            var dataCollected = 0;
            plugin.databaseCollections.map(function (collectionName) {
                // make sure database collections don't clash
                if (data[collectionName]) {
                    console.error("Database \"" + collectionName + "\" for plugin \"" + plugin.name + "\" conflicts with an existing database of the same name");
                    return;
                }
                queryOneCollection(dbs, {
                    collectionName: collectionName,
                    query: {}
                })
                    .then(function (docs) {
                    data[collectionName] = docs[collectionName];
                    dataCollected++;
                    if (dataCollected == plugin.databaseCollections.length)
                        itter1();
                })
                    .catch(function (e) { return console.error(e); });
            });
        }
        itter1();
    })
        .then(function (data) {
        callback(data);
    })
        .catch(function (e) { return console.error(e); });
}
exports.aggregateAllPluginData = aggregateAllPluginData;
function queryManyCollections(dbs, queryList) {
    return new Promise(function (resolve, reject) {
        var data = {};
        if (!(queryList.length > 0)) {
            resolve(data);
        }
        else {
            queryList.map(function (query, ind) {
                queryOneCollection(dbs, query)
                    .then(function (data) {
                    if (ind === queryList.length - 1)
                        resolve(data);
                })
                    .catch(function (e) { return console.error(e); });
            });
        }
    });
}
exports.queryManyCollections = queryManyCollections;
function queryOneCollection(dbs, query) {
    return new Promise(function (resolve, reject) {
        var data = {};
        if (!query) {
            // No query?! YOU GET NOTHING! YOU LOSE! GOOD DAY, SIR!
            resolve(data);
        }
        else {
            var cursor = dbs.dbs.collection(query.collectionName).find(query.query, {});
            if (cursor) {
                cursor.toArray(function (err, docs) {
                    if (docs === void 0) { docs = []; }
                    if (err) {
                        reject(err);
                    }
                    else {
                        data[query.collectionName] = docs || [];
                        resolve(data);
                    }
                });
            }
            else {
                resolve(data);
            }
        }
    });
}
exports.queryOneCollection = queryOneCollection;
function urlPrefixer(prefix) {
    return function (url) {
        return "" + prefix + url;
    };
}
exports.urlPrefixer = urlPrefixer;
function getPlugins(pluginType, callback) {
    if (pluginType === void 0) { pluginType = "standard"; }
    fs_1.readdirSync(path_1.join(__dirname, "../plugins/" + pluginType))
        .map(function (folder) {
        var pr = require(path_1.join(__dirname, "../plugins/" + pluginType, folder, "info.json"));
        var component = require(path_1.join(__dirname, "../plugins/" + pluginType, folder, "index"));
        return { pr: pr, component: component, directory: folder };
    })
        .map(function (data) {
        callback(data);
    });
}
exports.getPlugins = getPlugins;
function getThemes() {
    return fs_1.readdirSync(path_1.join(__dirname, "../themes"))
        .map(function (folder) {
        try {
            var tr = require(path_1.join(__dirname, "../themes", folder, "info.json"));
            var component = require(path_1.join(__dirname, "../themes", folder, "index"));
            return { tr: tr, component: component, directory: folder };
        }
        catch (e) {
            console.error("Skipping \"" + folder + "\". Reason: " + e.message || e);
            return null;
        }
    }).filter(function (x) { return !!x; }); //filters out null values
}
exports.getThemes = getThemes;
function regexURL(url) {
    var x = {
        params: {}
    };
    x.regexURL = new RegExp(url
        .replace("/", "\\/")
        .replace(".", "\\.")
        .replace(/{:[\w\d\-_]+}/g, function (_) {
        x.params[_.replace(/({:|})/g, "")] = null;
        return "(.+)";
    }), "i");
    return x;
}
exports.regexURL = regexURL;
function getThemeContent(url) {
    var header = "";
    var footer = "";
    var json = {};
    var themeRoot = path_1.join(__dirname, "../themes/" + process.env["THEME"]);
    try {
        header = fs_1.readFileSync(themeRoot + "/partials/header.handlebars").toString();
        footer = fs_1.readFileSync(themeRoot + "/partials/footer.handlebars").toString();
        json = JSON.parse(fs_1.readFileSync(themeRoot + "/routes.json").toString());
    }
    catch (error) {
        console.error("Theme requires 3 files: \"partials/header.handlebars\", \"partials/footer.handlebars\", and \"routes.json\"");
        console.error(error.message);
        return {
            params: {},
            queryList: [],
            page: "<center><h1>Critical error getting page content</h1></center>"
        };
    }
    var routes = {};
    Object.keys(json).map(function (routeKey) {
        var routeData = json[routeKey];
        var data = {
            params: {},
            page: null,
            query: []
        };
        data.params = routeData.params || {};
        data.query = routeData.queryList || [];
        data.page = function () {
            return fs_1.readFileSync(themeRoot + "/pages/" + routeData.page).toString();
        };
        routes[routeKey] = data;
    });
    // url match
    var results = pickPage(url, routes);
    results.page = header + results.page + footer;
    return results;
}
exports.getThemeContent = getThemeContent;
function pickPage(url, routes) {
    var arr = Object.keys(routes);
    var params = {};
    var queryList = [];
    var page = "";
    var i = 0;
    while (!page && i < arr.length) {
        var routeString = arr[i];
        params = routes[routeString].params || {};
        queryList = routes[routeString].query || [];
        var x = regexURL(routeString);
        var xx = new RegExp(x.regexURL);
        var match = url.match(xx);
        if (match) {
            var paramList = Object.keys(x.params);
            paramList.unshift(null);
            match.map(function (x, i) {
                if (i > 0) {
                    params[paramList[i]] = x;
                }
            });
            page = routes[routeString].page();
            break;
        }
        i++;
    }
    if (!page) {
        var routeString = "404";
        page = routes[routeString].page();
    }
    return {
        page: page,
        params: params,
        queryList: queryList
    };
}
exports.pickPage = pickPage;
