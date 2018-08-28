// ==UserScript==
// @id             iitc-plugin-portal-multi-export
// @name           IITC plugin: Portal Multi Export
// @category       Misc
// @version        0.10
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://github.com/modkin/Ingress-IITC-Multi-Export/raw/master/multi_export.user.js
// @downloadURL    https://github.com/modkin/Ingress-IITC-Multi-Export/raw/master/multi_export.user.js
// @description    Export portals from bookmarks, current view or polygon
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission*
// @include        http://*.ingress.com/mission*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @match          https://*.ingress.com/mission*
// @match          http://*.ingress.com/mission*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    window.plugin.multiexport = function() {};


    /*********** MENUE ************************************************************/
    window.plugin.multiexport.createmenu = function() {
        var htmldata = "<p> Export from <b> Current View </b>, <b> inside Polygon </b> or <b> Bookmarks </b> to various formats by clicking the corresponding cell in the table. </p>"
        + "<p> Please note that the first drawn polygon will be choosen to export from. </p>"
        + "<p> <b> BE AWARE: </b> If you choose <b> BKMRK </b> all portals will be added to the default bookmarks folder. </p>";
        if (plugin.bookmarksSharer) {
            htmldata += "<p>BMSH: Export for Bookmark Sharer to paste in your google docs.</p>";
        }
        htmldata += "<table class='multiexporttabel'>"
        + "<thead> <tr> <th> </th> <th> CSV </th> <th> GPX </th> <th> Maxfield </th> <th> JSON </th> <th> BKMRK </th>";
        if (plugin.bookmarksSharer) {
          htmldata += "<th> BMSH </th>";
        }
        htmldata += " </tr> </thead>"
        + "<tbody>"
        + "<tr> <th> Current View </th>"
        + "<td> <a onclick=\"window.plugin.multiexport.export('CSV','VIEW');\" title='Export Current View to CSV'>XXX</a> </td>"
        + "<td> <a onclick=\"window.plugin.multiexport.export('GPX','VIEW');\" title='Export Current View to GPX'>XXX</a> </td>"
        + "<td> <a onclick=\"window.plugin.multiexport.export('MF' ,'VIEW');\" title='Export Current View to Maxfield'>XXX</a> </td>"
        + "<td> <a onclick=\"window.plugin.multiexport.export('JSON' ,'VIEW');\" title='Export Current View to JSON'>XXX</a> </td>";
        if(plugin.bookmarks){
            htmldata += "<td> <a onclick=\"window.plugin.multiexport.export('BKMRK','VIEW');\" title='Export Current View to Bookmarks'>XXX</a> </td>";
        }
        if (plugin.bookmarksSharer) {
          htmldata += "<td> <a onclick=\"window.plugin.multiexport.export('BMSH','VIEW');\" title='Export Current View to Bookmark Sharer'>XXX</a> </td>";
        }
        htmldata += "</tr>";
        if(plugin.drawTools) {
            htmldata += "<tr> <th> Polygon </th>"
                + "<td> <a onclick=\"window.plugin.multiexport.export('CSV','VIEWFIL');\" title='Export Polygon to CSV'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.export('GPX','VIEWFIL');\" title='Export Polygon to GPX'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.export('MF' ,'VIEWFIL');\" title='Export Polygon to Maxfield'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.export('JSON' ,'VIEWFIL');\" title='Export Current View to JSON'>XXX</a> </td>";
            if(plugin.bookmarks){
                htmldata += "<td> <a onclick=\"window.plugin.multiexport.export('BKMRK','VIEWFIL');\" title='Export Polygon to Bookmarks'>XXX</a> </td>";
            }
            if (plugin.bookmarksSharer) {
                htmldata += "<td> <a onclick=\"window.plugin.multiexport.export('BMSH','VIEWFIL' );\" title='Export Polygon to Bookmark Sharer'>XXX</a> </td>";
            }
            htmldata += "</tr>";
        }
        if(plugin.bookmarks) {
            htmldata += "<tr> <th> Bookmarks </th>"
                + "<td> <a onclick=\"window.plugin.multiexport.bkmrkmenu('CSV');\" title='Export Bookmarks to CSV'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.bkmrkmenu('GPX');\" title='Export Bookmarks to GPX'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.bkmrkmenu('MF' );\" title='Export Bookmarks to Maxfield'>XXX</a> </td>"
                + "<td> <a onclick=\"window.plugin.multiexport.bkmrkmenu('JSON' );\" title='Export Bookmarks to JSON'>XXX</a> </td>";
            if (plugin.bookmarksSharer) {
                htmldata += "<td style='border-color: transparent !important;'> <a title='' > </a> </td>"
                    + "<td> <a onclick=\"window.plugin.multiexport.bkmrkmenu('BMSH' );\" title='Export Bookmarks to Bookmark Sharer'>XXX</a> </td>";
            }
            htmldata += "</tr> </tbody>";
        }

        window.dialog({
            title: "Multi Export Options",
            html: htmldata,
            dialogClass: 'ui-dialog-multiExport'
        });

    };

    /*********** HELPER FUNCTION ****************************************************/
    window.plugin.multiexport.portalinpolygon = function(portal,LatLngsObjectsArray) {
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
    window.plugin.multiexport.bkmrkmenu = function(type) {
        var htmlcontent = '<div class="multiExportSetbox">';
        var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
        for(var i in bookmarks.portals){
            htmlcontent += "<a onclick=\"window.plugin.multiexport.export('" +type+"','BKMRK','"+i+"');\""
                + "title=\"Generate GPX list\">" + bookmarks.portals[i].label + "</a>";
        }
        htmlcontent += '</div>';
        window.dialog({
            title: "Multi Export Options",
            html: htmlcontent
        }).parent();
    };

    /*********** ABSTRACT EXPORT FUNCTION ******************************************/
    window.plugin.multiexport.export = function(type, source, bkmrkFolder) {
        console.log(type);
        var o = [];
        var portals;
        var sourceTitle;
        var windowTitle;
        var BMSHfID;
        if(type === 'MF') {
            windowTitle = 'Maxfield Export';
        } else {
            windowTitle = type + ' Export';
        }
        if(localStorage['plugin-draw-tools-layer']) {
            var drawLayer = JSON.parse(localStorage['plugin-draw-tools-layer']);
        }
        if(source == 'BKMRK') {
            var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
            portals = bookmarks.portals[bkmrkFolder].bkmrk;
        } else {
            portals = window.portals;
        }
        switch(type){
            case 'GPX':
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
                break;
            case 'JSON':
                o.push("[");
                break;
            case 'BMSH':
                BMSHfID = window.plugin.bookmarks.generateID();
                o.push( "FOLDER\t"
                    + "MultiExporterExportedExport\t"
                    + JSON.stringify( {
                        id : BMSHfID,
                        type : 'folder',
                        label : "MultiExport",
                        uri : "white"} ) );
            break;
        }
        for(var i in portals){
            var keys = 0;
            if(source === 'BKMRK'){
                var name = bookmarks.portals[bkmrkFolder].bkmrk[i].label;
                var latlng = bookmarks.portals[bkmrkFolder].bkmrk[i].latlng;
                if(plugin.keys){
                    keys = plugin.keys.keys[bookmarks.portals[bkmrkFolder].bkmrk[i].guid];
                }
            }else{
                var p = window.portals[i];
                var name = p.options.data.title;
                var guid = p.options.guid;
                var latlng = p._latlng.lat + ',' +  p._latlng.lng;
                if(source === 'VIEWFIL'){
                    var portalInPolygon = false;
                    for(var dl in drawLayer){
                        if(drawLayer[dl].type === 'polygon'){
                            if(window.plugin.multiexport.portalinpolygon(latlng,drawLayer[dl].latLngs)){
                                portalInPolygon = true;
                                break;
                            }
                        }
                    }
                    if (!portalInPolygon){
                        continue;
                    }
                }

                if(plugin.keys){
                    keys = plugin.keys.keys[i];
                }
                var b = window.map.getBounds();
                // skip if not currently visible
                if (p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng || p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
            }
            var lat = latlng.split(',')[0];
            var lng = latlng.split(',')[1];
            switch(type){
                case 'MF':
                    o.push(name + ";https://www.ingress.com/intel?ll=" + latlng + "&z=18&pll=" + latlng + ";" + keys);
                    break;
                case 'CSV':
                    o.push("\"" + name + "\"," + lat + "," + lng);
                    break;
                case 'GPX':
                    var iitcLink = "https://www.ingress.com/intel?ll=" + lat + "," + lng + "&amp;z=17&amp;pll=" + lat + "," + lng;
                    var gmapLink = "http://maps.google.com/?ll=" + lat + "," + lng + "&amp;q=" + lat + ","  + lng;
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
                case 'JSON':
                    o.push("{");
                    o.push("\"title\": " + JSON.stringify(name) + ",");
                    o.push("\"guid\": \"" + guid + "\",");
                    o.push("\"latlng\": \"" + latlng + "\"");
                    o.push("},");
                    break;
                case 'BKMRK':
                    if(!window.plugin.bookmarks.findByGuid(guid)){
                        plugin.bookmarks.addPortalBookmark(guid, latlng, name);
                    }
                    break;
                case 'BMSH':
                    o.push( "PORTAL\t"
                        + name
                        + "\t"
                        + JSON.stringify( {
                            id : window.plugin.bookmarks.generateID(),
                            type : 'portal',
                            label : name,
                            fId : BMSHfID,
                            guid : guid,
                            latlng : latlng } ) );
                    break;
            }
        }
        if(type == 'BKMRK'){
            return;
        }
        var ostr = o.join("\n");
        switch(type){
            case 'GPX':
                ostr += "</gpx>";
                ostr = ostr.replace(/[&]/g, '');
                break;
            case 'JSON':
                //remove the last ","
                if (ostr.length > 1) {
                    ostr = ostr.slice(0, -1);
                }
                ostr += "]";
                break;
        }

        var dialog = window.dialog({
            title: windowTitle,
            dialogClass: 'ui-dialog-maxfieldexport',
            html: '<textarea readonly id="idmExport" style="width: 600px; height: ' + ($(window).height() / 3) + 'px; margin-top: 5px;"></textarea>'
            + '<p><a onclick="$(\'.ui-dialog-maxfieldexport textarea\').select();">Select all</a></p>'
        }).parent();

        dialog.css("width", 630).css({
            "top": ($(window).height() - dialog.height()) / 2,
            "left": ($(window).width() - dialog.width()) / 2
        });

        $("#idmExport").val(ostr);
    };


    /*********** PLUGIN SETUP *****************************************************/
    // setup function called by IITC
    var setup = function() {
        $("#toolbox").append("<a onclick=\"window.plugin.multiexport.createmenu();\" title=\"Export the currently visible portals\">Multi Export</a>");
        $('head').append('<style>' +
                         '.multiExportSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:100%; text-align:center; background:rgba(8,48,78,.9); }'+
                         'table.multiexporttabel { border: 1px solid #ffce00; text-align:center;} ' +
                         'table.multiexporttabel td { border: 1px solid; text-align:center; width: ' +
                         ((plugin.bookmarksSharer) ? '12%' : '15%') +
                         '; table-layout: fixed;} ' +
                         '.ui-dialog-multiExport {width: 400px !important}' +
                         '</style>');

    };

    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
