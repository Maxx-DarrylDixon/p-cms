"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var render_1 = require("./render");
var fs_1 = require("fs");
var path_1 = require("path");
var app = express();
var dbs = null;
var store = null;
app.post("/apply-theme", function (req, res) {
    process.env["THEME"] = req.body.theme;
    var file = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, "../srv-config.json")).toString());
    file.theme = req.body.theme;
    fs_1.writeFileSync(path_1.join(__dirname, "../srv-config.json"), JSON.stringify(file));
    res.redirect(req.headers.referer);
});
app.post("*", function (req, res) {
    res.status(404).send(render_1.getView(req.url, {
        title: "Not Found",
        viewName: "404"
    }));
});
function default_1(db, str) {
    dbs = db;
    store = str;
    return app;
}
exports.default = default_1;
;
