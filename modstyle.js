define('modstyle', function () {

    var buildMap = [];

    return {

        escape: function(content) {
            return content.replace(/(['\\])/g, '\\$1');
        },

        parseName: function (name) {
            var index = name.indexOf(".");

            return {
                moduleName: name.substring(0, index),
                ext: name.substring(index + 1, name.length)
            };
        },

        fetch: function(url, callback) {
            if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
                var fs = require.nodeRequire('fs');
                var file = fs.readFileSync(url, 'utf8');
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);

                xhr.onreadystatechange = function (evt) {
                    var status, err;
                    if (xhr.readyState === 4) {
                        if (xhr.status > 399 && xhr.status < 600) {
                            err = new Error(url + ' HTTP status: ' + status);
                            err.xhr = xhr;
                            errback(err);
                        } else {
                            callback(xhr.responseText);
                        }
                    }
                };
                xhr.send(null);
            }

        },

        write: function (pluginName, moduleName, write, config) {
            write("define(\""+pluginName + "!" + moduleName+"\", function () { return '" + this.escape(buildMap[moduleName]) + "';});\n");
        },

        load: function (name, req, onLoad, config) {
            this.fetch(req.toUrl(name), function(content) {
                this.finishLoad(name, req, onLoad, config, content);
            }.bind(this), function(err) {
                onLoad.error(err);
            }.bind(this));
        },

        finishLoad: function(name, req, onLoad, config, content) {
            var parsedName = this.parseName(name);
            var namespace = parsedName.moduleName.replace("/","-");

            if (parsedName.ext == "html") {
                content = this.namespaceTemplate(content, namespace);
            } else {
                content = this.namespaceSelectors(content, namespace);
            }
            buildMap[name] = content;
            onLoad(content);
        },

        namespaceSelectors: function(stylesheet, namespace) {
            var replacer = function(match, closingBracket, selector) {
                var selectors = selector.trim().split(" ");
                for (var i = 0; i < selectors.length; i++) {
                    if (selectors[i] == ">" || selectors[i] == "}") continue;
                    if (selectors[i] == "*") {
                        selectors[i] = "[data-ns='"+namespace+"']";
                    } else {
                        selectors[i] += "[data-ns='"+namespace+"']";
                    }
                }
                return closingBracket + selectors.join(" ");;
            }

            stylesheet = this.compress(stylesheet);;
            var regex = /(^|})([^{]+)/g;
            return stylesheet.replace(regex, replacer);
        },

        compress: function(content) {
            return content.trim().replace(/\s+/g, " ");
        },

        namespaceTemplate: function(template, namespace) {
            var replacer = function(match, tagContent, end) {
                tagContent += " data-ns='"+namespace+"'";
                return "<"+tagContent+ (end || "") +">";
            }
            return this.compress(template.replace(/<([^\/]*?)(?:>|(\/)>)/g, replacer));
        }

    }
});
