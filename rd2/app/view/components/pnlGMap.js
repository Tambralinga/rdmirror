Ext.define('Rd.view.components.pnlGMap', {
    extend:'Ext.ux.GMapPanel',
    alias :'widget.pnlGMap',
    requires: [
        'Rd.view.components.ajaxToolbar'
    ],
    urlMenu:        '/cake2/rd_cake/nas/menu_for_maps.json',
    urlPhotoBase:   '/cake2/rd_cake/webroot/img/nas/',
    markers     : [],
    infoWindows : [],
    infowindow  : undefined,
    editwindow  : undefined,
    addwindow   : undefined,
    shadow      : undefined,
    store       : undefined,
    centerLatLng: undefined,
    initComponent: function(){

        var me      = this;
        me.tbar     = Ext.create('Rd.view.components.ajaxToolbar',{'url': me.urlMenu});

        var cLat  = me.centerLatLng.lat;
        var cLng  = me.centerLatLng.lng;
        me.center =    new google.maps.LatLng(cLat,cLng);

        //Create a shadow item:
        me.shadow = new google.maps.MarkerImage('resources/images/map_markers/shadow.png', null, null, new google.maps.Point(10, 34));

        //___Info infowindow___
        var i_div =  document.createElement('div');
        i_div.id  = 'clean_I_Div';  
        i_div.className = i_div.className + "mapDiv";
        var i_pnl;

        me.infowindow = new google.maps.InfoWindow({
            content: i_div
        });
        me.infoWindows.push(me.infowindow);

        google.maps.event.addListener(me.infowindow, 'domready', function(){
            //Note before firing this event; we would have clicked on a marker
            //During the click event we assign (in the controller) the clicked record to this instance(me)'s
            //marker_record property we will then subsequintly use it here
            
            var c= me.infowindow.getContent();     
            if (c.id == 'clean_I_Div'){ //Only load the first time!
                c.id = 'filled_I_Div';
                //Get the image for first time load
                var photo_file_name = me.marker_record.get('photo_file_name');
                var img_url         = me.urlPhotoBase+photo_file_name;

                //Build the data for the template
                var t_i_s = "N/A";
                if(me.marker_record.get('status') != 'unknown'){
                    if(me.marker_record.get('status') == 'up'){
                        var s = i18n("sUp");
                    }
                    if(me.marker_record.get('status') == 'down'){
                        var s = i18n("sDown");
                    }
                    t_i_s           = s+" "+Ext.ux.secondsToHuman(record.get('status_time'));;
                }
                var d  = Ext.apply({
                    time_in_state   : t_i_s
                }, me.marker_record.data);

                var tpl = new Ext.Template([
                   "<div class='divMapAction'>",
                        "<label class='lblMap'>"+ i18n("sName")+"  </label><label class='lblValue'> {shortname}</label><br>",
                        "<label class='lblMap'>"+ i18n("sIP_Address")+"  </label><label class='lblValue'> {nasname}</label><br>",
                        "<label class='lblMap'>"+ i18n("sConnection")+"  </label><label class='lblValue'> {connection_type}</label><br>",
                        "<label class='lblMap'>"+ i18n("sCurrent_state")+"  </label><label class='lblValue'> {time_in_state}</label><br>",
                        "<label class='lblMap'>"+ i18n("sDescription")+"  </label><label class='lblValue'> {description}</label><br>",
                        "<label class='lblMap'>"+ i18n("sPublic")+"  </label><label class='lblValue'> {on_public_maps}</label><br>",
                    "</div>"
                    ]
                );
                var tplImg = new Ext.Template([
                    "<div class='divMapAction'>",
                        "<img src='{image}' alt='Nas Image'>",
                    "</div>"
                ]);
            
                i_pnl = Ext.create('Ext.tab.Panel', {
                    itemId: 'pnlMapsInfo',
                    width: 300,
                    height: 200,
                    activeTab: 0,
                    items: [
                        {
                            title: 'Info',
                            itemId: 'tabMapInfo',
                            bodyPadding: 2,
                            tpl : tpl,
                            autoScroll: true,
                            data: d
                        },
                        {
                            title: 'Photo',
                            itemId: 'tabMapPhoto',
                            bodyPadding: 2,
                            tpl : tplImg,
                            autoScroll: true,
                            data: {image: img_url}
                        }
                    ],
                    renderTo : c
                });
            }
            i_pnl.doLayout();

        });

        //___Edit infowindow___
        var e_div =  document.createElement('div');
        e_div.id  = 'cleanDiv';  
        e_div.className = e_div.className + "mapDiv";
        var e_pnl;

        me.editwindow = new google.maps.InfoWindow({
            content: e_div
        });
        me.infoWindows.push(me.editwindow);

        google.maps.event.addListener(me.editwindow, 'domready', function(){
            var c= me.editwindow.getContent();     
            if (c.id == 'cleanDiv'){ //Only load the first time!
                c.id = 'filledDiv';
                var tpl = new Ext.Template([
                    "<div class='divMapAction'>",
                        "<label class='lblMap'>"+i18n("sNew_position")+"</label><br><br>",
                        "<label class='lblMap'>"+ i18n("sLatitude")+"  </label><label class='lblValue'> {lat}</label><br>",
                        "<label class='lblMap'>"+i18n("sLongitude")+"  </label><label class='lblValue'> {lng}</label><br>",
                    "</div>"
                    ]
                );
                e_pnl = Ext.create('Ext.panel.Panel', {
                    title: i18n("sAction_required"),
                    itemId: 'pnlMapsEdit',
                    height: 200,
                    tpl: tpl,
                    bbar: [
                        {
                            xtype   : 'button',
                            itemId  : 'save',
                            text    : i18n('sSave'),
                            scale   : 'large',
                            iconCls : 'b-save',
                            glyph   : Rd.config.icnYes,
                        },
                        {
                            xtype   : 'button',
                            itemId  : 'cancel',
                            text    : i18n('sCancel'),
                            scale   : 'large',
                            iconCls : 'b-close',
                            glyph   : Rd.config.icnClose,
                        },
                        {
                            xtype   : 'button',
                            itemId  : 'delete',
                            text    : i18n('sDelete'),
                            scale   : 'large',
                            iconCls : 'b-delete',
                            glyph   : Rd.config.icnDelete,
                        }  
                    ],
                    renderTo: c
                });
                e_pnl.update({"lng": me.new_lng,"lat": me.new_lat});
            
            }else{
               e_pnl.update({"lng": me.new_lng,"lat": me.new_lat});
            }
        });

        //___Add infowindow___
        me.addwindow = new google.maps.InfoWindow({
            content: "<div class='lblRdReq'>"+
                        i18n("sAction_required")+
                     "</div><div class='lblRd'>"+
                        i18n("sDrag_and_drop_marker_to_required_position")+
                    "</div>"
        });
        me.infoWindows.push(me.addwindow);
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
/*
    showInfoWindow: function(infoW){
        var me = this;
        infoW = Ext.apply({ //Apply the map to it
            map: me.gmap
        }, infoW);

        if (!infoW.position) {
            infoW.position = new google.maps.LatLng(infoW.lat, infoW.lng);
        }

        var o =  new google.maps.InfoWindow(infoW);
        Ext.Object.each(infoW.listeners, function(name, fn){
            google.maps.event.addListener(o, name, fn);    
        });
        me.infoWindows.push(o);
        return o;
    },
*/
    createMap: function() {
        var me = this;
        me.callParent(arguments);
        me.store.load(); 
    }

});

