define([
    "presenter",
    "modstyle!./Test1.html",
    "modstyle!./Test1.css"
], function(Presenter, template, style) {

    return Presenter.extend({
        template: template,
        style: style
    })

});