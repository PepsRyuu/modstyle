define('modstyle', function () {

    /**
     * If there's any single quotes or escapes, escape those.
     * This prevents the compilation from failing.
     *
     * @method escape
     * @private
     * @param {String} content
     * @return {String}
     */ 
    function escape(content) {
        return content.replace(/(['\\])/g, '\\$1');
    }

    /**
     * Splits the name into file name and extension.
     *
     * @method parseName
     * @private
     * @param {String} name
     * @return {Object}
     */
    function parseName(name) {
        var index = name.indexOf(".");

        return {
            file: name.substring(0, index),
            ext: name.substring(index + 1, name.length)
        };
    }

    /**
     * Finds series of white-space and replaces them with a single space.
     *
     * @method compress
     * @private
     * @param {String} content
     * @return {String}
     */
    function compress (content) {
        return content.trim().replace(/\s+/g, " ");
    }

    /**
     * Injects the namespace of the module for all selectors.
     *
     * @method namespaceSelectors
     * @private
     * @param {String} stylesheet
     * @param {String} namespace
     * @return {String}
     */
    function namespaceSelectors(stylesheet, namespace) {
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

        // Compressing the stylesheet first makes it easier and more predictable to parse.
        stylesheet = compress(stylesheet);

        // We're searching for the content in between the {} brackets. This wouldn't be the most
        // reliable technique when we take media queries or other similar nested queries into account
        // but for the proof of concept it works.
        var regex = /(^|})([^{]+)/g;

        // Inject the data-ns attribute for all of the selectors.
        return stylesheet.replace(regex, replacer);
    }

    /**
     * Injects the namespace of the module for all opening and self-closing tags.
     *
     * @method namespaceTemplate
     * @private
     * @param {String} template
     * @param {String} namespace
     * @return {String}
     */
    function namespaceTemplate(template, namespace) {
        var replacer = function(match, tagContent, end) {
            tagContent += " data-ns='"+namespace+"'";
            return "<"+tagContent+ (end || "") +">";
        }

        // Find all opening or self-closing tags, and inject the namespace into them.
        return compress(template.replace(/<([^\/]*?)(?:>|(\/)>)/g, replacer));
    }

    return {
        fetch: function(url, callback) {
            if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
                var fs = require.nodeRequire('fs');
                var file = fs.readFileSync(url, 'utf8');
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

        writeFile: function (pluginName, moduleName, req, write, config) {
            this.load(moduleName, req, function(content) {
                write("define(\""+pluginName + "!" + moduleName+"\", function () { return '" + escape(content) + "';});\n");
            }, config);
        },

        load: function (name, req, onLoad, config) {
            this.fetch(req.toUrl(name), function(content) {
                this.finishLoad(name, req, onLoad, config, content);
            }.bind(this), function(err) {
                onLoad.error(err);
            }.bind(this));
        },

        finishLoad: function(name, req, onLoad, config, content) {
            var parsedName = parseName(name);
            var namespace = parsedName.file.replace("/","-");

            if (parsedName.ext == "html") {
                content = namespaceTemplate(content, namespace);
            } else {
                content = namespaceSelectors(content, namespace);
            }
            onLoad(content);
        }
    }
});
