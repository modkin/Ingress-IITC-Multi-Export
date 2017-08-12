// ==UserScript==
// @id             iitc-plugin-portal-status-export
// @name           IITC plugin: Portal Status Export
// @category       Misc
// @version        0.10
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
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

    window.plugin.statusexporter = function() {};


    /*********** MENUE ************************************************************/
    window.plugin.statusexporter.createmenu = function() {
        var htmldata ="<p> Please note that the first drawn polygon will be choosen to export from. </p>";
        if(plugin.drawTools) {
            htmldata += "<td> <a onclick=\"window.plugin.statusexport.export();\">export portal status from polygon</a> </td>";
        }

        window.dialog({
            title: "Status Export Options",
            html: htmldata,
            dialogClass: 'ui-dialog-multiExport'
        });

    };

    /*********** HELPER FUNCTION ****************************************************/
    window.plugin.statusexport.portalinpolygon = function(portal,LatLngsObjectsArray) {
        var portalCoords = portal.split(',');

        var x = portalCoords[0], y = portalCoords[1];

        var inside = false;
        for (var i = 0, j = LatLngsObjectsArray.length - 1; i < LatLngsObjectsArray.length; j = i++) {
            var xi = LatLngsObjectsArray[i]['lat'], yi = LatLngsObjectsArray[i]['lng'];
            var xj = LatLngsObjectsArray[j]['lat'], yj = LatLngsObjectsArray[j]['lng'];

            var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };


    /*********** ABSTRACT EXPORT FUNCTION ******************************************/
    window.plugin.statusexport.export = function() {
        var o = [];
        var sourceTitle;
        var windowTitle = "Portal status export";
        var drawLayer = JSON.parse(localStorage['plugin-draw-tools-layer']);
        var portals = window.portals;

        portalLoop:
        for(var i in portals){
            var p = window.portals[i];

            var name = p.options.data.title;
            var guid = p.options.guid;
            var status = p.options.data.team;
            var latlng = p._latlng.lat + ',' + p._latlng.lng;

            for(var dl in drawLayer){
                if(drawLayer[dl].type === 'polygon'){
                    if(!window.plugin.statusexport.portalinpolygon(latlng,drawLayer[dl].latLngs)){
                        continue portalLoop;
                    }
                }
            }

            o.push("\"" + name + "\"," + guid + "," + status);
        }

        var ostr = o.join("\n");

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
        $("#toolbox").append("<a onclick=\"window.plugin.statusexport.createmenu();\" title=\"Export the status of portals\">Status Export</a>");
        $('head').append('<style>' +
                         '.multiExportSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:100%; text-align:center; background:rgba(8,48,78,.9); }'+
                         'table.multiexporttabel { border: 1px solid #ffce00; text-align:center;} ' +
                         'table.multiexporttabel td { border: 1px solid; text-align:center; width: 15%; table-layout: fixed;} ' +
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
