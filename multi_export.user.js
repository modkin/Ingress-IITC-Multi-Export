// ==UserScript==
// @id             iitc-plugin-gpx-exporter
// @name           IITC plugin: Ingress GPX Exporter
// @category       Keys
// @version        0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    Exports portals currently in view as a GPX list
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
    // in case IITC is not available yet, define the base plugin object
    if (typeof window.plugin !== "function") {
        window.plugin = function() {};
    }


    window.plugin.createmenu = function() {
        window.dialog({
            title: "Multi Export Options",
            html: '<div class="multiExportSetbox">'
            + "<a onclick=\"window.plugin.gpxexport.gen();\" title=\"Generate a GPX list of portals and location\">GPX Export</a>"
            + "<a onclick=\"window.plugin.ingressdualmap.gen();\" title=\"Generate a CSV list of portals and locations\">CSV Export</a>"
            + "<a onclick=\"window.plugin.maxfields();\" title=\"Generate a list of portals and locations for use with maxfield\">Maxfields Export</a>"
            + "</div>"
        }).parent();
        // width first, then centre
    };

    window.plugin.maxfields = function() {
        var o = [];
        var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
        for(var i in bookmarks.portals.idOthers.bkmrk){
            var name = bookmarks.portals.idOthers.bkmrk[i].label;
            var gpscoord = bookmarks.portals.idOthers.bkmrk[i].latlng;
            o.push(name + ";https://www.ingress.com/intel?ll=" + gpscoord + "&z=18&pll=" + gpscoord + ";0");
        }

        var dialog = window.dialog({
            title: "Maxfields Export",
            html: '<span>Use the list bellow as input for maxfields.</span>' + '<textarea id="idmGPXExport" style="width: 600px; height: ' + ($(window).height() - 150) + 'px; margin-top: 5px;"></textarea>'
        }).parent();
        $(".ui-dialog-buttonpane", dialog).remove();
        // width first, then centre
        dialog.css("width", 630).css({
            "top": ($(window).height() - dialog.height()) / 2,
            "left": ($(window).width() - dialog.width()) / 2
        });
        $("#idmGPXExport").val(o.join("\n"));
        return dialog;
    };

    // base context for plugin
    window.plugin.gpxexport = function() {};
    var self = window.plugin.gpxexport;
    self.gen = function gen() {
        var o = [];
        o.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        o.push("<gpx xmlns=\"http://www.topografix.com/GPX/1/0\"  version=\"1.0\" creator=\"Dom\">");
        for (var x in window.portals) {
            var p = window.portals[x];
            var b = window.map.getBounds();
            // skip if not currently visible
            if (p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng || p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
            // Microdegrees conversion - added by trefmanic
            lat = p._latlng.lat;
            lng = p._latlng.lng;
            o.push("<wpt lat=\""+ lat + "\" lon=\""  + lng + "\"><name>" + p.options.data.title + "</name></wpt>");
        }
        o.push("</gpx>");

        var dialog = window.dialog({
            title: "GPX Export",
            html: '<span>Save the list below as a GPX file.</span>' + '<textarea id="idmGPXExport" style="width: 600px; height: ' + ($(window).height() - 150) + 'px; margin-top: 5px;"></textarea>'
        }).parent();
        $(".ui-dialog-buttonpane", dialog).remove();
        // width first, then centre
        dialog.css("width", 630).css({
            "top": ($(window).height() - dialog.height()) / 2,
            "left": ($(window).width() - dialog.width()) / 2
        });
        $("#idmGPXExport").val(o.join("\n"));
        return dialog;
    };

    window.plugin.ingressdualmap = function() {};
    var self = window.plugin.ingressdualmap;
    self.gen = function gen() {
        var o = [];
        for (var x in window.portals) {
            var p = window.portals[x];
            var b = window.map.getBounds();
            // skip if not currently visible
            if (p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng
                || p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
            // Microdegrees conversion - added by trefmanic
            latE6 = Math.round ( p._latlng.lat * 1000000 );
            lngE6 = Math.round ( p._latlng.lng * 1000000 );
            o.push("\"" + p.options.data.title.replace(/\"/g, "\\\"") + "\"," + latE6 + "," + lngE6);
        }

        var dialog = window.dialog({
            title: "Ingress CSV export",
            html: '<span>Save the list below as a CSV file, then use it with maxfield script.</span>'
            + '<textarea id="idmCSVExport" style="width: 600px; height: ' + ($(window).height() - 150) + 'px; margin-top: 5px;"></textarea>'
        }).parent();
        $(".ui-dialog-buttonpane", dialog).remove();
        // width first, then centre
        dialog.css("width", 630).css({
            "top": ($(window).height() - dialog.height()) / 2,
            "left": ($(window).width() - dialog.width()) / 2
        });
        $("#idmCSVExport").val(o.join("\n"));
        return dialog;
    };


    // setup function called by IITC
    self.setup = function init() {
        // add controls to toolbox
        $("#toolbox").append("<a onclick=\"window.plugin.createmenu();\" title=\"Export the current visible portals\">Multi Export</a>");
        $('head').append('<style>' +
                         '.multiExportSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }'+
                         '</style>');
        // delete setup to ensure init can't be run again
        delete self.setup;
    };
    // IITC plugin setup
    if (window.iitcLoaded && typeof self.setup === "function") {
        self.setup();
    } else if (window.bootPlugins) {
        window.bootPlugins.push(self.setup);
    } else {
        window.bootPlugins = [self.setup];
    }
}
// inject plugin into page
var script = document.createElement("script");
script.appendChild(document.createTextNode("(" + wrapper + ")();"));
(document.body || document.head || document.documentElement).appendChild(script);