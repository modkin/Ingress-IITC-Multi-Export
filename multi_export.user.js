// ==UserScript==
// @id             iitc-plugin-portal-multi-export
// @name           IITC plugin: Portal Multi Export
// @category       Misc
// @version        0.3
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://github.com/modkin/Ingress-IITC-Multi-Export/raw/master/multi_export.user.js
// @downloadURL    https://github.com/modkin/Ingress-IITC-Multi-Export/raw/master/multi_export.user.js
// @description    Export portals from bookmarks, current view or polygon
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


    /*********** MENUE ************************************************************/
    window.plugin.createmenu = function() {
        var htmldata = '<div class="multiExportSetbox">'
        + "<a onclick=\"window.plugin.export('GPX','VIEW');\" title=\"Generate a GPX list of portals and location\">GPX Export from Map</a>"
        + "<a onclick=\"window.plugin.export('CSV','VIEW');\" title=\"Generate a CSV list of portals and locations\">CSV Export from Map</a>"
        + "<a onclick=\"window.plugin.export('MF','VIEW');\" title=\"Generate a list of portals for use with maxfield from current View\">Maxfield Export from Map</a>";
        if(plugin.drawTools)
        {
            htmldata += "<a onclick=\"window.plugin.export('GPX','VIEWFIL');\" title=\"Generate a GPX list of portals and location\">GPX Export inside Polygon</a>"
                + "<a onclick=\"window.plugin.export('CSV','VIEWFIL');\" title=\"Generate a CSV list of portals and locations\">CSV Export inside Polygon</a>"
                + "<a onclick=\"window.plugin.export('MF','VIEWFIL');\" title=\"Generate a list of portals for use with maxfield from current View\">Maxfield Export inside Polygon</a>";
        }
        if(plugin.bookmarks)
        {
            htmldata += "<a onclick=\"window.plugin.bkmrkmenu('GPX');\" title=\"Generate a GPX list of portals from Bookmarks\">GPX Export from Bookmarks</a>"
                + "<a onclick=\"window.plugin.bkmrkmenu('CSV');\" title=\"Generate a CSV list of portals from Bookmarks\">CSV Export from Bookmarks</a>"
                + "<a onclick=\"window.plugin.bkmrkmenu('MF');\" title=\"Generate a list of portals for use with maxfield from Bookmarks\">Maxfield Export from Bookmarks</a>";
        }
        htmldata += "</div>";
        window.dialog({
            title: "Multi Export Options",
            html: htmldata
        }).parent();
    };

    /*********** HELPER FUNCTION ****************************************************/
    portalInPolygon = function(portal,LatLngsObjectsArray)
    {
        var portalCoords = portal.split(',');

        var x = portalCoords[0], y = portalCoords[1];

        var inside = false;
        for (var i = 0, j = LatLngsObjectsArray.length - 1; i < LatLngsObjectsArray.length; j = i++) {
            var xi = LatLngsObjectsArray[i]['lat'], yi = LatLngsObjectsArray[i]['lng'];
            var xj = LatLngsObjectsArray[j]['lat'], yj = LatLngsObjectsArray[j]['lng'];

            var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    /*********** BOOKMARK MENUE ****************************************************/
    window.plugin.bkmrkmenu = function(type) {
        var htmlcontent = '<div class="multiExportSetbox">';
        var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
        for(var i in bookmarks.portals){
            htmlcontent += "<a onclick=\"window.plugin.export('" +type+"','BKMRK','"+i+"');\""
                + "title=\"Generate GPX list\">" + bookmarks.portals[i].label + "</a>";
        }
        htmlcontent += '</div>';
        window.dialog({
            title: "Multi Export Options",
            html: htmlcontent
        }).parent();
    };

    /*********** ABSTRACT EXPORT FUNCTION ******************************************/
    window.plugin.export = function(type, source, bkmrkFolder)
    {
        console.log(type);
        var o = [];
        var portals;
        var sourceTitle;
        var windowTitle;
        if(type === 'MF')
        {
            windowTitle = 'Maxfield Export From ';
        } else {
            windowTitle = type + ' Export From ';
        }
        if(localStorage['plugin-draw-tools-layer'])
        {
            var drawLayer = JSON.parse(localStorage['plugin-draw-tools-layer']);
        }
        if(source == 'BKMRK') {
            var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
            portals = bookmarks.portals[bkmrkFolder].bkmrk;
            windowTitle = windowTitle + 'Bookmarks';

        } else {
            portals = window.portals;
            windowTitle = windowTitle + 'current View';
        }
        if(type === 'GPX')
        {
            o.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            o.push("<gpx version=\"1.1\" "
                   +"creator=\"IITC-Multisxporter\" "
                   +"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
                   +"xmlns=\"http://www.topografix.com/GPX/1/1\" "
                   +"xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\""
                   +">");
            o.push("<metadata>"
                   +"<link href=\"https://ingress.com/intel\"></link>"
                   +"</metadata>"
                  );
        }
        portalLoop:
        for(var i in portals){
            var keys = 0;
            if(source === 'BKMRK'){
                var name = bookmarks.portals[bkmrkFolder].bkmrk[i].label;
                var latlng = bookmarks.portals[bkmrkFolder].bkmrk[i].latlng;
                if(plugin.keys.keys[bookmarks.portals[bkmrkFolder].bkmrk[i].guid]){
                    keys = plugin.keys.keys[bookmarks.portals[bkmrkFolder].bkmrk[i].guid];
                }
            }else{
                var p = window.portals[i];
                var name = p.options.data.title;
                var latlng = p._latlng.lat + ',' +  p._latlng.lng;
                if(source === 'VIEWFIL'){
                    for(var dl in drawLayer){
                        if(drawLayer[dl].type === 'polygon'){
                            console.log(latlng);
                            console.log(drawLayer[dl]);
                            if(!portalInPolygon(latlng,drawLayer[dl].latLngs)) continue portalLoop;
                        }
                    }
                }

                if(plugin.keys.keys[i]){
                    keys = plugin.keys.keys[i];
                }
                var b = window.map.getBounds();
                // skip if not currently visible
                if (p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng || p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
            }
            iitcLink = "https://www.ingress.com/intel?ll=" + latlng + "&amp;z=18&amp;pll=" + latlng;
            gmapLink = "http://maps.google.com/?ll=" + latlng + "&amp;q=" + latlng;
            switch(type){
                case 'MF':
                    o.push(name + ";" + iitcLink + ";" + keys);
                    break;
                case 'CSV':
                    o.push("\"" + name + "\"," + latlng.split(',')[0] + "," + latlng.split(',')[1] + "," + iitcLink + "," + gmapLink);
                    break;
                case 'GPX':
                    lat = latlng.split(',')[0];
                    lng = latlng.split(',')[1];
                    o.push("<wpt lat=\""+ lat + "\" lon=\""  + lng + "\">"
                           +"<name>" + name + "</name>"
                           +"<desc>" + "Lat/Lon: " + lat + "," + lng + "\n"
                           + "Intel: " + iitcLink + "\n"
                           + "GMap: " + gmapLink + "\n"
                           +"</desc>\n"
                           +"<link href=\"" + iitcLink + "\"></link>\n"
                           +"</wpt>"
                          );
                    break;
            }
        }
        if(type === 'GPX')
        {
            o.push("</gpx>");
        }


        var dialog = window.dialog({
            title: windowTitle,
            dialogClass: 'ui-dialog-maxfieldexport',
            html: '<textarea readonly id="idmExport" style="width: 600px; height: ' + ($(window).height() / 2) + 'px; margin-top: 5px;"></textarea>'
            + '<p><a onclick="$(\'.ui-dialog-maxfieldexport textarea\').select();">Select all</a></p>'
        }).parent();

        dialog.css("width", 630).css({
            "top": ($(window).height() - dialog.height()) / 2,
            "left": ($(window).width() - dialog.width()) / 2
        });

        $("#idmExport").val(o.join("\n"));

        return dialog;
    };


    /*********** PLUGIN SETUP *****************************************************/
    // setup function called by IITC
    self.setup = function init() {
        // add controls to toolbox
        $("#toolbox").append("<a onclick=\"window.plugin.createmenu();\" title=\"Export the currently visible portals\">Multi Export</a>");
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
