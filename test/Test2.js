define([
    "presenter",
    "modstyle!./Test2.html",
    "modstyle!./Test2.css"
], function(Presenter, template, style) {

    return Presenter.extend({
        template: template,
        style: style
    })

});