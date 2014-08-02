Ext.define('Rd.view.meshes.pnlMeshViewGMap', {
    extend:'Ext.ux.GMapPanel',
    alias :'widget.pnlMeshViewGMap',
    markers     : [],
    infoWindows : [],
	polyLines	: [],
    infowindow  : undefined,
    shadow      : undefined,
    store       : undefined,
    centerLatLng: undefined,
	meshId		: '',
	mapPanel	: '',
	e_pnl		: false,
	tbar: [
    	{xtype: 'buttongroup', title: i18n('sAction'), items : [
		{xtype: 'button', iconCls: 'b-reload',   glyph: Rd.config.icnReload ,	scale: 'large', itemId: 'reload', tooltip: i18n('sReload')}
        ]}    
    ],
    initComponent: function(){
        var me      = this;
        var cLat  	= me.centerLatLng.lat;
        var cLng  	= me.centerLatLng.lng;

		//This is required for the map even the most basic map!
        me.center 	= new google.maps.LatLng(cLat,cLng);

        //Create a shadow item:
        me.shadow = new google.maps.MarkerImage('resources/images/map_markers/shadow.png', null, null, new google.maps.Point(10, 34));
        me.callParent(arguments);
    },
	addMarker: function(marker) {
        var me = this;
        marker = Ext.apply({
            map     : me.gmap,
            shadow  : me.shadow 
        }, marker);
        
        if (!marker.position) {
            marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        }
        var o =  new google.maps.Marker(marker);
        Ext.Object.each(marker.listeners, function(name, fn){
            google.maps.event.addListener(o, name, fn);    
        });
        me.markers.push(o);
        return o;
    },
	clearMarkers: function(){
        var me = this;
        while(me.markers[0]){
            me.markers.pop().setMap(null);
        }
    },
	addPolyLine: function(line){
		var me = this;

		var from_to = [
			new google.maps.LatLng(line.from.lat, line.from.lng),
			new google.maps.LatLng(line.to.lat, line.to.lng),
		];

		var o = new google.maps.Polyline({
			path			: from_to,
			geodesic		: true,
			strokeColor		: line.color,
			strokeOpacity	: line.opacity,
			strokeWeight	: line.weight
		});
		o.setMap(me.gmap);	//Attach it to the map
		me.polyLines.push(o);
		return o;
	},
	clearPolyLines: function(){
		var me = this;
		while(me.polyLines[0]){
            me.polyLines.pop().setMap(null);
        }
	}
});

