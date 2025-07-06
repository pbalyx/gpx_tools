////
const version ="3.0.9";
const subV = "";
// V_2.6.5 correction bug lissage
// V_2.7.0 lissage en mètres ou en points
	
// 3.0.0 : debut
//3.0.1 changé système de timeshift : affichage avec temps gmt sans corriger le temps enregistré
// gardé la correction pour rectifier les gpx déjà changés
//3.0.9 créé GpxRec pour regrouper track et waypts en deux objets séparés


window.onload = (event) => {
	b_version.innerHTML = 'V: ' + version + subV; 
	document.title = 'GpxView_L - ' + version + subV;
	console.log("GpxView_L  version : ", version);
	init_map();
////	init_features_table();
};

function init_map() {
	initGraph();////
	// trkStyle must be defined before creating new Track
	gpxRecs.push(new GpxRec(0));
	gpxRecs.push(new GpxRec(1));

}


// region -- Variables ---------
	
	var trackModified = [false, false];
	
	var tooltipDiv = document.getElementById("tooltipDiv");
	var tooltipText = document.getElementById("tooltipText");
	var tooltipMenu = document.getElementById("tooltipMenu");
	var coordsDiv = document.getElementById("coordsDiv");
	var latLngSpan = document.getElementById("latLngSpan");
	var elevSpan = document.getElementById("elevSpan");
	var editDiv = document.getElementById("editDiv");
	var edit_input = document.getElementById("edit_input");
	var isWaypoint = false;
	
	var fileNameInfo = document.getElementById("fileNameInfo");
	var fileDateInfo = document.getElementById("fileDateInfo");
	var trackLengthInfo = document.getElementById("trackLengthInfo");
	var elevInfo = document.getElementById("elevInfo");
	var timeInfo = document.getElementById("timeInfo");
	var ptInfo1 = document.getElementById("ptInfo1");
	var ptInfo2 = document.getElementById("ptInfo2");
	
	var descInfo = document.getElementById("descInfo");
	var zoomDiv = document.getElementById("zoomDiv");
	
	var oneHourShift = 3600000;
	var currentIndex = 0;
	var startPtVal = 0;
	var stopPtVal = 0;

	var extractVisible = false;
//	var photoDivElem = document.getElementById("photoDiv");

	
//endregion
	
// region Map Tiles

//region OTM
	var OTMLayer = L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', {
		maxNativeZoom:15,
		maxZoom: 17,
		attribution: '&copy  <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://www.opentopomap.org/ target="_blank"">OpenTopoMap</a>'
	}); 

//region OSM/ 	
////var OSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
var OSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
	});	

// region PlanIGN
	var PlanIGNLayer = L.tileLayer('https://data.geopf.fr/wmts/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fpng', {
		maxZoom: 19,
		attribution: ' Carte: <a href="https://geoservices.ign.fr/planign" target="_blank">Plan IGN</a> | Tracés: <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a>'
	});

// region IGNPhoto
	var IGNPhotoLayer = L.tileLayer('https://data.geopf.fr/wmts/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg', {
		maxZoom: 19,
		attribution: '<a href="https://geoservices.ign.fr/" target="_blank">IGN Image aérienne</a> | Tracés: <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a>'
	});


// endregion

// region map

//var mapCenter = [44.65, 4.251];//Jaujac
var mapCenter = [44.622, 4.40];// 4.40582, 44.63658

var map = L.map('map', {
//	center: mapCenter,
	layers: [
		OTMLayer 
	]}).setView(mapCenter, 13); //setView to overwrite setBounds after loading

L.control.scale({maxWidth: 200, imperial: false}).addTo(map);
	var zoomDiv = document.getElementById("zoomDiv");
////	zoomDiv.innerHTML = 'zoom: ' + map.getZoom();
	
var baseMaps = {
    "OpenTopoMap": OTMLayer,
    "OpenStreetMap": OSMLayer,
	"Plan IGN": PlanIGNLayer,
	"IGN Image aérienne": IGNPhotoLayer,
////	"RGEalti": RGEaltiLayer
	};

 var overlayMaps = {
////	"BD_Topo": BD_TopoLayer,
////	"Stava": StavaLayer,
////	"Waymarked_Trails": WMTLayer
};

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// endregion

// region map actions

var mapClicked = false;
var pointClicked = false;
var wayPtSelected = false;

map.on("click", function(e) {
		mapClicked = true;
///		console.log("pointClicked", pointClicked);
		if (!pointClicked) {	// only mean to prevent propagation
			doMapClick(e);
		} else {
			pointClicked = false;
		}
	}
);


// endregion

// region GpxRec

var recNum = -1;

var gpxRecs = [];

function GpxRec(_num) {
	this.name = "";
	this.num = _num; //// ??
	this.track = new Track(_num);
	this.waypts = new Waypts(_num);
	this.isEmpty = function() {
		var t = this.track.isEmpty();
		var w = this.waypts.isEmpty();
		return (this.track.isEmpty() && this.waypts.isEmpty());////
	}
	this.updateLayers = function(_trkptsFeatures) {
		this.track.updateLayer(_trkptsFeatures);
		this.waypts.updateLayer();
	}
	this.center = function() {
		if (this.track.isEmpty()) {
			//// center on waypts
		} else {
			this.track.center();
		}
	}
	this.clearData = function() {
		this.track.clearData();
		this.waypts.clearData();
	}

}

//endregion

	// region Track
	
const trkStyle = {
	"weight": 2,
	"opacity": 1,
	"fill":false
};

const color1 = {"color": "red", "fillColor": "red"};
const color2 = {"color": "Blue", "fillColor": "Blue"};
const colors = [color1, color2];


function TrackPoint(_lng, _lat, _ele, _time) {
	this.lng = _lng;
	this.lat = _lat;
	this.ele = _ele;
	var truc = _ele;
	this.eleSmooth = parseFloat(truc);
	this.time = _time;
	this.distFromStart = 0;
	this.timeFromStart = 0;
	this.denivPlusFromStart = 0;
	this.denivMoinsFromStart = 0;

}

function Track(_num) {
	this.num = _num;
	this.trackPtsArray = [];
	this.nbPts = function() {return this.trackPtsArray.length;};	
	this.trackPtsLayer = L.geoJSON({"features":[]}, {
		style: trkStyle //"color": "red"}	{"color": "red"}	
//		style :	colors[_num]
	}).addTo(map);	
	
	this.isEmpty = function() {

		return (this.trackPtsArray.length == 0);
	}
	this.hasElev = false;
	this.hasDate = false;

		this.timeShift = 0;
		this.smoothPts = 30;
		this.smoothDist = 200;
		this.elevShift = 0;

	this.distance = 0;
	this.denivPlus = 0;
	this.denivMoins = 0;
	this.totalTime = 0;	
	this.elevMin = 0;
	this.elevMax = 8000;

	this.initTrack = function() {
		if (this.trackPtsArray[0].ele != null) this.hasElev = true;
		if (this.trackPtsArray[0].time != null) this.hasDate = true;
		//newTrack => default values; html updated in setActiveTrack
		this.timeShift = 0;
		this.smoothPts = 30;
		this.smoothDist = 200;
		this.elevShift = 0;
////		validateSmooth();
		calcIntegrals(this);
	}
	
	this.updateLayer = function(_trkptsFeatures) {
		this.trackPtsLayer.clearLayers();
		this.trackPtsLayer.addData(_trkptsFeatures);
		this.trackPtsLayer.setStyle(colors[this.num]);
	}
	
	this.center = function() {
		var bounds = this.trackPtsLayer.getBounds();
		if (bounds.isValid()) {
			map.fitBounds(bounds);
		}
	}	
	
	this.fillTrackPtsArray = function(trackNode) {
		var ptsNodes = trackNode.getElementsByTagName('trkpt');
		for (var i = 0; i < ptsNodes.length; i++) {
			var _lon = ptsNodes[i].getAttribute('lon');
			var _lat = ptsNodes[i].getAttribute('lat');
			var newtrkPt = new TrackPoint(_lon, _lat, null, null);
			var _ele = ptsNodes[i].getElementsByTagName('ele');
			if (_ele.length >0) {newtrkPt.ele = _ele[0].textContent;}
			var _time = ptsNodes[i].getElementsByTagName('time');
			if (_time.length >0) {newtrkPt.time = _time[0].textContent;}
			this.trackPtsArray.push(newtrkPt);
		}
	}

	this.shiftTime = function(y) {
		var delta = y - this.timeShift;
		if (delta != 0) {
			for (var i = 0; i < this.trackPtsArray.length; i++) {
				var dateStr = this.trackPtsArray[i].time;
				var newHourStr = (parseFloat(dateStr.substring(11,13)) +delta).toFixed(0);
				var newDateStr = dateStr.substring(0,11) + newHourStr + dateStr.substring(13,100);
				this.trackPtsArray[i].time = newDateStr;
			}
			this.timeShift = y;
		};
}

	this.nearestPtIndex = function(_pt) {
		var index = -1;
		var minDist = 100000; //mètres
//cracTest(2);
		for (var i = 0; i < this.trackPtsArray.length; i++) {
			var dist = distSphere(this.trackPtsArray[i], _pt);
			if (dist < minDist) {
				minDist = dist;
				index = i;
			}
		}
		return index;
	}

	this.clearData = function () {
		this.trackPtsLayer.clearLayers();
		this.trackPtsArray.length = 0;
	}
}

	// endregion

	// region Waypts

const wptStyle1 = {
	"radius": "6",
	"color": "black",
	"weight": 1,
	"opacity": 1,
	"fillOpacity": 0.9,
	"stroke": true,
	"fill":true,
	"fillColor": "red"
};

const wptStyle2 = {
	"radius": "6",
	"color": "black",
	"weight": 1,
	"opacity": 1,
	"fillOpacity": 0.9,
	"stroke": true,
	"fill":true,
	"fillColor": "blue"
};

const wptStyles = [wptStyle1, wptStyle2];

function Waypts(_num) {
	this.num = _num; //// ??
////	this.wayPtsArray = [];
	this.wayPtsJson = {"features":[]};
	this.wayPtsLayer = L.geoJSON({"features":[]}, {
		style: wptStyles[_num],
		onEachFeature: wayPtsLayer_onEachFeatureDo,
		pointToLayer: function(feature, latlng) {
			return new L.CircleMarker(latlng, {
				radius: 5,
				weight:2
			});
		}
	}).addTo(map);	
	this.updateLayer = function() {
		this.wayPtsLayer.clearLayers();
		this.wayPtsLayer.addData(this.wayPtsJson.features);
////		this.wayPtsLayer.setStyle(colors[this.num]); //pas possible ici ?
	}

	function wayPtsLayer_onEachFeatureDo(feature, layer) {
		layer.on("mouseover", () => {
			if(!mapClicked) {
			wayPtSelected = true;
				layer.setStyle(wptOverStyle);
			}
		});
		layer.on("mouseout", () => {
			mapClicked = false;
			wayPtSelected = false;
			layer.setStyle(wptStyles[_num]);			
		});	
		layer.on("click", function(ev){
			pointClicked = true;
			var __latLng = ev.sourceTarget.getLatLng();
			isWaypoint = true;
			setTooltip(__latLng, ev.sourceTarget);
		});	
		
	}

	this.isEmpty = function() {
		return (this.wayPtsJson.features.length == 0);
	}
	this.clearData = function() {
		this.wayPtsLayer.clearLayers();
		this.wayPtsJson.features.length = 0;
	}

}
	// endregion

	// region calculs et affichage
	
	function distSphere(pt1, pt2) { // units metre
		function _deg2rad (deg) { return deg * Math.PI / 180; }
		var R = 6371000;
		var dLat = _deg2rad(pt2.lat - pt1.lat);
		var dLon = _deg2rad(pt2.lng - pt1.lng);
		var r = Math.sin(dLat/2) *
		  Math.sin(dLat/2) +
		  Math.cos(_deg2rad(pt1.lat)) *
		  Math.cos(_deg2rad(pt2.lat)) *
		  Math.sin(dLon/2) *
		  Math.sin(dLon/2);
		var c = 2 * Math.atan2(Math.sqrt(r), Math.sqrt(1-r));
		var d = R * c;
		return d;
	  }

	function calcIntegrals(track) { 
	//		cracTest(3);
		longueur = 0;
		denivPlus = 0;
		denivMoins = 0;
		timeInterval = 0;
		elevMin = 8000;
		elevMax = 0;
		var pt0, pt1;
		var	denivCur, distTmp;
		var denivTmp = 0;
		var elevTmp = 0;
		var elevCount = 0;
		var _elevSmooth = 0;
		var timeTmp = 0;
		var _nbPts = track.trackPtsArray.length;
		for (var i = 1; i < _nbPts; i++) {
			pt0 = track.trackPtsArray[i-1];
			pt1 = track.trackPtsArray[i];
			
			distTmp = distSphere(pt0, pt1);
			longueur += distTmp;
			pt1.distFromStart = longueur;

			if (track.hasElev){
				var ptElev = parseFloat(pt1.ele);
				if (elevMin > ptElev) { elevMin = ptElev };
				if (elevMax < ptElev) { elevMax = ptElev };				
				denivTmp = pt1.eleSmooth - pt0.eleSmooth;
				if (denivTmp >= 0) {denivPlus += denivTmp;}
				else {denivMoins += denivTmp;}	
				pt1.denivPlusFromStart = denivPlus;
				pt1.denivMoinsFromStart = denivMoins;
			}
			if (track.hasDate) {
				var time0 = new Date(pt0.time);
				var time1 = new Date(pt1.time);
				timeTmp = Math.abs((time1 - time0)/1000); //abs to deal with inverted tracks
				if ( timeTmp < 120) {
					timeInterval += timeTmp // avoid pauses or mixed tracks
				} 
				pt1.timeFromStart = timeInterval;
			}
		}
		
		track.distance = longueur;
		track.denivPlus = denivPlus;
		track.denivMoins = denivMoins;
		track.elevMin = elevMin;
		track.elevMax = elevMax;
		track.totalTime = timeInterval;			
	}

	function timeIntervalStr(time_) {
			var dt = time_;
			var dh = Math.trunc(dt / 3600);
			var dmin = Math.trunc( (dt - 3600 * dh) /60);
			var dsec = Math.trunc(dt - 3600 * dh - 60 * dmin);

			if (dmin < 10) {
				return dh + "h0" + dmin;
			} else {
				return dh + "h" + dmin;
			}
		}

	function latLngStr (_point) {
		return parseFloat(_point.lng).toFixed(5)+ ', ' + parseFloat(_point.lat).toFixed(5);
	}

	function dateShifted (_dateStr, _timeShift){
		var date1 =new Date(_dateStr)
		var	dateOK = new Date(date1.getTime() + _timeShift * oneHourShift);
		return dateOK;
	}

	// region Smooth

function validateSmooth() { 
	var y = Number( smoothValInput.value);
	if (y<1) {y=1; smoothValInput.value = '1';};
	if (smooth_dist_mode) {
		gpxRecs[recNum].track.smoothDist = y;
		if (gpxRecs[recNum].track.hasElev){
			calcSmoothDist(gpxRecs[recNum].track);
		}
	} else {
		gpxRecs[recNum].track.smoothPts = y;
		if (gpxRecs[recNum].track.hasElev){
			calcSmoothPts(gpxRecs[recNum].track);
		}	
	}
 	calcIntegrals(gpxRecs[recNum].track);	
	updateTrackInfo();
////	showPoint(currentIndex, gpxRecs[recNum].track);
	drawProfil(gpxRecs[recNum].track);
	var smoothStr = '&nbsp Lissage: ';
	if (smooth_dist_mode) {
		smoothStr += gpxRecs[recNum].track.smoothDist + ' mètres&nbsp ';
	} else {
		smoothStr += gpxRecs[recNum].track.smoothPts + ' points&nbsp ';	
	}
	smooth_info.innerHTML = smoothStr;
	
}

	function calcSmoothPts(track){
		var elevTmp = 0;
		var elevCount = 0;
		var _elevSmooth = 0;
		var smoothLimInf = 15;
		var smoothLimSup = 15

		_elevSmooth = track.trackPtsArray[0].ele;
		elevTmp = _elevSmooth;
		var pt;
		smoothLimInf = Math.floor(track.smoothPts/2); 
		smoothLimSup = smoothLimInf;
		if (track.smoothPts % 2 == 1) {	smoothLimSup++;	} ;

		for (var i = 0; i < track.nbPts(); i++) {
			pt = track.trackPtsArray[i];
			elevTmp = 0;
			elevCount = 0;
			for (var j = i - smoothLimInf; j < i + smoothLimSup; j++){
				if(j >=0 && j < track.nbPts() - 1){
					elevTmp += parseFloat(track.trackPtsArray[j].ele);
					elevCount++;
				}
				_elevSmooth = elevTmp / elevCount;
			}
			pt.eleSmooth = _elevSmooth.toFixed(3);
		}	
	}
	
	function calcSmoothDist(track){
		var elevTmp = 0;
		var elevCount = 0;
		var _elevSmooth = 0;
		var i_min = 0;
		var i_max = 0;
		var smoothDist_div2  = track.smoothDist / 2;
		var pt;
		var i_test = 10;

		for (var i = 0; i < track.nbPts(); i++) {
			pt = track.trackPtsArray[i];
			i_min = i;
			i_max = i;
			elevTmp = 0.0;
			elevCount = 0;
			while (i_min > 0 
				&& track.trackPtsArray[i_min].distFromStart >= pt.distFromStart - smoothDist_div2) {
					i_min--;
			}	
			i_min++;
			while (i_max < track.nbPts() 
				&& track.trackPtsArray[i_max].distFromStart <= pt.distFromStart + smoothDist_div2) {
					i_max++;
			}
			for (var j = i_min; j < i_max; j++){
				if(j >=0 && j < track.nbPts() - 1){
				elevTmp += parseFloat(track.trackPtsArray[j].ele);
					elevCount++;
				}				
			};
			if (elevCount > 0) {
				_elevSmooth = elevTmp / elevCount;			
			} else {
				_elevSmooth = pt.ele;
			}		
			pt.eleSmooth = _elevSmooth.toFixed(3);
		}
	}

	// endregion

	function showPoint (index, track){
		ptInfo1.innerHTML = "";
		ptInfo2.innerHTML = "";
////		if (track != null){  //should be always true
			if (index >= track.nbPts) {index = track.nbPts - 1};
			if (index < 0) {index = 0};
			var trackPoint =  track.trackPtsArray[index];
			curPtMark.setLatLng(trackPoint); //// tooltip ?
			tooltipMark.closeTooltip();			
			var indexStr = index.toString();
			ptInfo1.innerHTML += "Dist: "+ (trackPoint.distFromStart/1000).toFixed(2) + " km" + "&nbsp&nbsp";
			if (track.hasDate) {
				ptInfo1.innerHTML += timeIntervalStr(trackPoint.timeFromStart) + "&nbsp&nbsp";
			};
			if (track.hasElev) {
				ptInfo1.innerHTML += "Deniv: +" 
				+ Math.trunc(trackPoint.denivPlusFromStart) + " m,  " 
				+ Math.trunc(trackPoint.denivMoinsFromStart) + " m"+"&nbsp&nbsp";
			};
			if (track.hasElev) {
				var _elev = trackPoint.ele;
				ptInfo1.innerHTML +=  "Alt: "+ _elev + " m"+"&nbsp&nbsp" ;
			};
			
			ptInfo2.innerHTML += "Point: " + "<i>" +indexStr + "</i>"  
				+  "&nbsp      [" + latLngStr(trackPoint) + "]"
				+"&nbsp&nbsp";
			if (track.hasDate) {
				var date = new Date(trackPoint.time);
				ptInfo2.innerHTML += "Heure: " + date.toTimeString().substring(0,8) +"&nbsp&nbsp" ;
			};
			drawVertLine(track, index);
////		}
	}
	
	function updateTrackInfo() {
		var track = gpxRecs[recNum].track;
		var durationStr = "00";
		fileNameInfo.innerHTML = gpxRecs[recNum].name;
		if (track.hasDate){  
			var dateStart = new Date(track.trackPtsArray[0].time);
			durationStr = track.totalTime;
			fileDateInfo.innerHTML =  
					dateStart.toLocaleDateString() 
					+ "&nbsp&nbsp&nbsp" + dateStart.toTimeString().substring(0,8);
		}
		trackLengthInfo.innerHTML = "Longueur: " + (track.distance/1000).toFixed(1) + " km" +"&nbsp&nbsp"
			+ "Durée: " +  timeIntervalStr(durationStr) + ",&nbsp&nbsp+" 
			+ track.denivPlus.toFixed(0) + "m,&nbsp&nbsp " + track.denivMoins.toFixed(0) + "m";
	}
	
	function showTrackSwictchButtons() {	
		if (gpxRecs[0].isEmpty()) {
			bTrack1.style.display = "none";
			bTrack1P.style.display = "none";
		}
		else {
			bTrack1.style.display = "inline";
			bTrack1P.style.display = "inline";
		}
		if (gpxRecs[1].isEmpty()) {
			bTrack2.style.display = "none";
			bTrack2P.style.display = "none";
		}
		else {
			bTrack2.style.display = "inline";
			bTrack2P.style.display = "inline";
		}
		switch (recNum) {
			case 0 : 
					bTrack1.style.background = "#FFFFAA";
					bTrack1P.style.background = "#FFFFAA";
					bTrack2.style.background = "#E1E1E1";
					bTrack2P.style.background = "#E1E1E1";
					if (extractVisible) {
						b_savePart_1.style.display = "block";
						b_savePart_2.style.display = "none";
					}
				break;
			case 1:
					bTrack2.style.background = "#FFFFAA";
					bTrack2P.style.background = "#FFFFAA";
					bTrack1.style.background = "#E1E1E1";
					bTrack1P.style.background = "#E1E1E1";
					if (extractVisible) {
						b_savePart_1.style.display = "none";
						b_savePart_2.style.display = "block";
					}
				break;
		}	
	}
		
	function updateDivs(isNewTrack){
		var activeTrack = gpxRecs[recNum].track;
		show_hideInfo(true);			
		updateTrackInfo();
	/*	if (isNewTrack && gpxRecs[recNum].track.hasDesc) {
			show_hideDesc(true);
		}*/
		currentIndex = 0;
		if (profilType == 0) profilType = 1;
		if (activeTrack == null) profilType = 0;
		show_hideProfil();
				
		if (activeTrack != null) {
			initGraph();
			drawProfil(activeTrack);			
			showPoint(currentIndex, activeTrack);
		}
		showTrackSwictchButtons();	

	}
	
	function setActiveTrack(_recNum, isNewTrack) {
		if (_recNum < 0) { // no trackFiles left
			show_hideInfo(false);
			profilType = 0;
			show_hideProfil();
		}
		else {
			recNum = _recNum;
			if (gpxRecs[recNum].isEmpty()) {
			} else {
				var activeTrack = gpxRecs[recNum].track;
				timeShiftInput.value = activeTrack.timeShift;
				if (smooth_dist_mode) {
					smoothValInput.value = activeTrack.smoothDist;
				} else {
					smoothValInput.value = activeTrack.smoothPts;
				}
				elevShiftInput.value = activeTrack.elevShift;
////				startPtIndex.innerHTML = activeTrack.extractStart;
////				stopPtIndex.innerHTML = activeTrack.extractEnd;	
				validateSmooth();  //if smooth_dist_mode has been changed
			}
			updateDivs(isNewTrack);
			showTrackSwictchButtons();	
		}
	}

// endregion

// region Divs

	var infoVisible = false;
	bCloseInfo.onclick = hideInfo;
	function hideInfo(){	
		show_hideInfo(false);
	}
	function show_hideInfo(vis){
		if(vis) {
			infoDiv.style.display = "block";
			bSub21.innerHTML = "Info -x-";
		showTrackSwictchButtons();		
		}
		else {
			infoDiv.style.display = "none";
			bSub21.innerHTML = "Info";
		}
		infoVisible = vis;
	}
	
	var descVisible = false;
	bCloseDesc.onclick = hideDesc;
	function hideDesc(){	
		show_hideDesc(false);
	}
	function show_hideDesc(vis){
		if(vis) {
			descDiv.style.display = "block";
			b_aff_desc.innerHTML = "Description -x-";
		}
		else {
			descDiv.style.display = "none";
			b_aff_desc.innerHTML = "Description";
		}
		descVisible = vis;
	}
	
	bCloseProfil.onclick = hideProfil;
	function hideProfil(){
		profilType = 0;
		show_hideProfil()	
	}

	function show_hideExtract(vis){
		if(vis) {
			extractDiv.style.display = "block";
			b_aff_extract.innerHTML = "Extraire -x-";
			if (recNum == 0) {
				b_savePart_1.style.display = "block";
			} else {
				b_savePart_2.style.display = "block";
			}
		}
		else {
			extractDiv.style.display = "none";
			b_aff_extract.innerHTML = "Extraire";
			b_savePart_1.style.display = "none";
			b_savePart_2.style.display = "none";
		}
		extractVisible = vis;
	}

	bClosePhoto.onclick = hidePhoto;
	function hidePhoto(){
		photoDiv.style.display = "none";
		tooltipMark.closeTooltip();
	}
	
//-------------------------------------------------------------
	var osmVisible = false;
	bCloseOsm.onclick = hideOsm;
	function hideOsm(){	
		show_hideOsm(false);
	}
	function show_hideOsm(vis){
		if(vis) {
			osmDiv.style.display = "block";
			b_aff_osm.innerHTML = "Explorer OSM -x-";
			osmLayer.setStyle(osmStyle);
			positionLayer.setStyle(hiddenStyle);
			hidePopUp();
			
			close_tags();
			objectsFound_array.length = 0;
			fill_elements_table();
		}
		else {
			osmDiv.style.display = "none";
			b_aff_osm.innerHTML = "Explorer OSM";
			osmLayer.setStyle(hiddenStyle);
			tooltipMark.bindTooltip();
		}
		osmVisible = vis;
	}
	
	var elevVisible = false;
	function show_hideElev(vis){
		if(vis) {
//			elevSpan.style.display = "inline";
			b_aff_elev.innerHTML = "Altitude -x-";
		} else {
			elevSpan.style.display = "none";
			b_aff_elev.innerHTML = "Altitude ";
		}
		elevVisible = vis;
	}
	

infoHeader.onmouseover = draginfoDiv;
profilHeader.onmouseover = dragProfilDiv;
photoHeader.onmouseover = dragPhotoDiv;
descHeader.onmouseover = dragDescDiv;
osmHeader.onmouseover = dragOsmDiv;

function draginfoDiv(){
	dragElement(infoHeader, infoDiv );
}

function dragProfilDiv(){
	dragElement(profilHeader, profilDiv );
}

function dragPhotoDiv(){
	dragElement(photoHeader, photoDiv );
}

function dragDescDiv(){
	dragElement(descHeader, descDiv );
}

function dragOsmDiv(){
	dragElement(osmHeader, osmDiv );
}

function dragElement(header, elem) {
		header.onmousedown = dragMouseDown;
	  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, posTop = 0;
	 function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();

		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	  }
	 function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the elem's new position:
		posTop = elem.offsetTop - pos2;
		if (posTop < 0) { posTop = 0}  // prevent header to go beyond top
		elem.style.top = (posTop) + "px";
		elem.style.left = (elem.offsetLeft - pos1) + "px";
	  }
	 function closeDragElement() {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	  }

}


// endregion

// region Infos

// endregion

// region profil graph 
	
	var ctx, ctx2;
	var xMin = 0; var xMax;
	var yMin = 0; var yMax;
	var grW;var grH;
	var gr = document.getElementById("graphCanvas");
	var gr2 = document.getElementById("graphCanvas2");
	var grWtot;
	var grYaxis;
	
	var profilType = 0; // 0:none; 1 : Smooth ; 2 : Compare
	
////	profilDiv.onload = function() {
////		initGraph();
////	}		

	function initGraph(){ 
	grWtot = profilDiv.clientWidth;

	grYaxis = 50;
	grW = grWtot -grYaxis;
	xMax =  grW;
	grH = profilDiv.clientHeight - 24; //-header
	yMax = grH;
		gr.width = grWtot;
		gr.height = grH;
		gr2.width = grWtot;
		gr2.height = grH;
		ctx = gr.getContext("2d");
		ctx.strokeStyle="blue";
		ctx.fillStyle="blue"; 
		ctx.lineWidth = 1;		
		ctx2 = gr2.getContext("2d");
		ctx2.strokeStyle="#0000ff";
	}
	
	function screenX(xCoord){
		return Math.round(grW * (xCoord - xMin)/(xMax - xMin)) + grYaxis;
	}
	function screenY(yCoord){
		return grH - Math.round(grH * (yCoord - yMin)/(yMax - yMin));
	}
	
	function coordX(xScreen){
		var locxScreen = xScreen - profilDiv.offsetLeft - grYaxis;
		return Math.round( locxScreen * (xMax - xMin) / grW ) ;
	}
	function coordY(yScreen){
		return  Math.round( (yScreen) * (yMax - yMin) / grW ) ;
	}
	
	function drawXTick(xValue){
		var scrPtX = screenX(xValue);
		var scrPtYmin = screenY(yMin);
		ctx.moveTo(scrPtX, grH);
		ctx.lineTo(scrPtX, grH - 10);
	}	
	function drawXAxis (xMin_, xMax_) {
		var interval = 1000;
		for (var i = 0; i < 100; i++){
			   if ( i * interval < xMax_ ) {
				  drawXTick(i * interval);
			   } else {return};	
		}
	}
	
	function drawYTick(yValue){
		ctx.moveTo(grYaxis - 10, screenY(yValue));
		ctx.lineTo(grYaxis + grW, screenY(yValue));
		ctx.fillText(yValue.toString(), 10, screenY(yValue));	
	}	
	function drawYAxis(yMin_, yMax_){
		ctx.moveTo(grYaxis, screenY(yMin_));
		ctx.lineTo(grYaxis, screenY(yMax_));
		var interval = Math.round((yMax_ - yMin_)/500)*100;
		if (interval < 50){interval = 50};
		for (var i = 0; i < 100; i++){
			if ( i * interval > yMin_){
			   if ( i * interval < yMax_ ) {
				  drawYTick(i * interval);
			   } else {return};
			}
		}
	}
	
	function drawProfil(_track){	
		var track = _track;
		ctx.clearRect(0,0, grWtot,grH);
		var _nbPts = track.nbPts();
		xMax = parseFloat(track.distance);
		yMin = parseFloat(track.elevMin) - 50;
		yMax = parseFloat(track.elevMax) +50;
		ctx.strokeStyle="#000000";//black 
		ctx.beginPath();
		drawXAxis(xMin, xMax);
		drawYAxis(yMin, yMax);
		ctx.stroke();
		if (profilType == 1) { //draw active track
		smooth_info.style.display = "inline";
		//trace rouge
			ctx.beginPath();
			ctx.strokeStyle="#FF0000";
			moveTo(0, screenY(parseFloat(track.trackPtsArray[0].ele) + track.elevShift));
			for (var i = 0; i < _nbPts ; i++){
			ctx.lineTo(screenX(track.trackPtsArray[i].distFromStart), screenY(parseFloat(track.trackPtsArray[i].ele) + track.elevShift));
			};
			ctx.stroke(); 
		
		//trace bleue
			ctx.beginPath();
			ctx.strokeStyle="#0000FF";
			moveTo(0, track.trackPtsArray[0].eleSmooth + track.elevShift);
			for (var i = 0; i < _nbPts ; i++){
				ctx.lineTo(screenX(track.trackPtsArray[i].distFromStart), screenY(track.trackPtsArray[i].eleSmooth + track.elevShift));
			};
			ctx.stroke(); 
		}
		
		if (profilType == 2) { //draw two tracks
			smooth_info.style.display = "none";
			//trace rouge
			track = gpxRecs[0].track;
			if (!track.isEmpty()) {
				ctx.beginPath();
				ctx.strokeStyle="#FF0000";
				moveTo(0, screenY(track.trackPtsArray[0].ele + track.elevShift));
				for (var i = 0; i < track.nbPts() ; i++){
					ctx.lineTo(screenX(track.trackPtsArray[i].distFromStart), 
					screenY(parseFloat(track.trackPtsArray[i].ele) + track.elevShift));
				};
				ctx.stroke(); 
			}
			
			//trace bleue
			track = gpxRecs[1].track;
			if (!track.isEmpty()) {
				ctx.beginPath();
				ctx.strokeStyle="#0000FF";
				moveTo(0, track.trackPtsArray[0].ele + track.elevShift);
				for (var i = 0; i < track.nbPts() ; i++){
					ctx.lineTo(screenX(track.trackPtsArray[i].distFromStart), 
					screenY(parseFloat(track.trackPtsArray[i].ele) + track.elevShift));
				};
			ctx.stroke(); 
			}
		}
		
	}

 	function drawVertLine(track, index){
	    var X = screenX(track.trackPtsArray[index].distFromStart);
		ctx2.clearRect(0,0, grWtot,grH);
		ctx2.beginPath();
		ctx2.moveTo(X,0);
		ctx2.lineTo(X, grH);
		ctx2.stroke();
	}
	
	profilDiv.onclick = resizeGraph;
	function resizeGraph(event){
		var x = profilDiv.clientWidth + profilDiv.offsetLeft ;
		var y = profilDiv.clientHeight + profilDiv.offsetTop ;
		if (Math.abs(x - event.clientX) < 20 && Math.abs(y - event.clientY) < 20) {
			initGraph();
			if (gpxRecs[recNum].track!=undefined) {
					drawProfil(gpxRecs[recNum].track);
			}
		}
	}	
		
	bPrevPoint.onclick = prevPoint;
	function prevPoint(){
		if (currentIndex > 0) {	
			currentIndex--
		} else {
			currentIndex = 0
		}
		showPoint(currentIndex, gpxRecs[recNum].track);
	}
	
	bNextPoint.onclick = nextPoint;
	function nextPoint(){
		if (currentIndex < gpxRecs[recNum].track.nbPts()) {	
			currentIndex++
		} else {
			currentIndex = gpxRecs[recNum].track.nbPts() -1
		}
		showPoint(currentIndex, gpxRecs[recNum].track);
	}
		
	document.getElementById("graphCanvas2").onclick = getIndex;
	function getIndex(event){
		var x = event.clientX;
 		var locDist =  coordX(x);
		var _nbPts = gpxRecs[recNum].track.nbPts()
		for (var i = 0; i < _nbPts ; i++){
			if (gpxRecs[recNum].track.trackPtsArray[i].distFromStart >= locDist) {
				currentIndex = i;
				break;			
			}
		}
		if (currentIndex < 0){currentIndex = 0;}
		showPoint(currentIndex, gpxRecs[recNum].track);
	}

	function show_hideProfil(){
		switch(profilType) {
			case 0:
				profilDiv.style.display = "none";
				bSub22.innerHTML = "Profil Lissage";
				bSub23.innerHTML = "Profil Compare";
				break;
			case 1:
				profilDiv.style.display = "block";
				bSub22.innerHTML = "Profil Lissage -x-";
				bSub23.innerHTML = "Profil Compare";
				break;
			case 2:
				profilDiv.style.display = "block";
				bSub22.innerHTML = "Profil Lissage";
				bSub23.innerHTML = "Profil Compare -x-";
				break;
		}
		drawProfil(gpxRecs[recNum].track);
	}
	
	
// endregion	

// region load GPX ------------------------

	document.getElementById('gpxFile1').addEventListener('change', handleFileSelect, false);
	document.getElementById('gpxFile2').addEventListener('change', handleFileSelect, false);

function handleFileSelect(evt) {
	if (evt.target.id == 'gpxFile1') {recNum = 0} else {recNum = 1;} 
	const fileList = evt.target.files; // FileList object
	currentFile = fileList[0];
	readTrackFile(currentFile);

}

function decodeGpx(gpxText, fName) {
	var _gpxRec = gpxRecs[recNum];
	var _fName = fName.substring(0, fName.indexOf('.'));
	_gpxRec.name = _fName;
	const parser = new DOMParser();  // initialize dom parser
	// convert dom string to dom tree.
	const gpxObj = parser.parseFromString(gpxText, "application/xml");  

	var _wayPts = _gpxRec.waypts;
		_wayPts.wayPtsJson.features.length = 0;
		var waypoints = gpxObj.getElementsByTagName('wpt'); 
		for (var i = 0; i < waypoints.length; i++) {
			var _wpt = featureObj(waypoints[i], "wpt");
			_wayPts.wayPtsJson.features.push(_wpt);	
		}

	var trkptsFeatures = [];
	var _track = _gpxRec.track;
		_track.trackPtsArray.length = 0;
		var trackNodes = gpxObj.getElementsByTagName('trk');
		var trackNode = trackNodes[0];
		
		_track.fillTrackPtsArray(trackNode);
		
		var trackFeature = featureObj(trackNode, "trk");;
		trkptsFeatures.push(trackFeature);
		_track.initTrack();
		show_hideInfo(true);
		_gpxRec.updateLayers(trkptsFeatures);
		_gpxRec.center();
		
	return true; // TODO return false if gpx not valid
}

function readTrackFile(_file) {
	var reader = new FileReader(); 
	reader.readAsText(_file, "UTF-8");
	reader.onload = function (evt) {	//onload : lecture terminée ok
		gpxText = evt.target.result;
		if (decodeGpx(gpxText, _file.name) ) {	
			setActiveTrack(recNum, true);
		}
	}

}
																			
function propertiesObj(featureNode) {
	var _prop = JSON.parse('{ }');
	var _name = featureNode.getElementsByTagName('name');
	if (_name.length > 0) {_prop.name = _name[0].textContent;}
	var _desc = featureNode.getElementsByTagName('desc');
	if (_desc.length > 0) {_prop.desc = _desc[0].textContent;}
	return _prop;
}

function geometryObj(featureNode, type) {
	var _geometryObj;
	switch(type) {
		case "wpt" :
			_geometryObj = JSON.parse('{ "type" : "Point", "coordinates":[]}');
			_geometryObj.coordinates = [featureNode.getAttribute('lon'),featureNode.getAttribute('lat')];
			break;
		case "trk" :
			_geometryObj = JSON.parse('{ "type" : "LineString", "coordinates":[]}');
			var ptsNodes = featureNode.getElementsByTagName('trkpt');
			for (var i = 0; i < ptsNodes.length; i++) {
				var _lonlat = [ptsNodes[i].getAttribute('lon'),ptsNodes[i].getAttribute('lat')];
				_geometryObj.coordinates.push(_lonlat);
			}
			break;
		default :
			_geometryObj = JSON.parse('{ "type" : "LineString", "coordinates":[]}');
		
	}

	return _geometryObj;
}

function featureObj(featureNode, type) {  //type : wpt, trk, rte
	var _featureObj = JSON.parse('{ "type": "Feature", "properties" :{}, "geometry":{}}'); 
		_featureObj.properties = propertiesObj(featureNode);
		_featureObj.geometry = geometryObj(featureNode, type);
	return _featureObj;
}

// endregion

// region sauvegarde gpx

function trkptNode(trkPt){	
	var nodeStr = "<trkpt " ;
	nodeStr += 'lat= "' + trkPt.lat + '" lon= "'+ trkPt.lng + '">';
	if (trkPt.ele != null){
		nodeStr +=  "<ele>" + trkPt.ele + "</ele>";
	}
	if (trkPt.time != null){
		nodeStr +=  "<time>" + trkPt.time + "</time>";		
	}
	nodeStr += "</trkpt>"  
    return nodeStr ;
}

function wptNode(_wptFeature){
	var coords = _wptFeature.geometry.coordinates;
	var tmpStr = '\n<wpt lat= "' + coords[1] + '" lon = "' + coords[0]  + '">\n';
	tmpStr += "<name>"+ _wptFeature.properties.name + "</name>";
	tmpStr += "\n</wpt>";
    return tmpStr;
}

function saveTrack(num, fullTrack){
	var _gpxRec = gpxRecs[num];
	var _track = _gpxRec.track;
	var Name = _gpxRec.name;
	var iStart, iEnd;
	if (fullTrack){
		iStart = 0;
		iEnd = _track.trackPtsArray.length;
	}
	else {
//		iStart = startPtVal;
		iStart = _track.extractStart;
		if (iStart > _track.nbPts) {iStart = _track.nbPts}
//		iEnd = stopPtVal;
		iEnd = _track.extractEnd;
		if (iEnd > _track.nbPts) {iEnd = _track.nbPts}
	}

	var gpxString = ""
	gpxString += '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="GpxView_';
	gpxString +=  version + subV +'">';
	if (fullTrack) {	
		//add waypoints 
		var _wpts = _gpxRec.waypts.wayPtsJson.features;
		for(var i = 0; i < _wpts.length; i++){  
			gpxString += wptNode(_wpts[i]);
		}
	}
	gpxString += "\n<trk>\n";	
	gpxString += "<name>" + Name + "</name>\n";		
	gpxString += "<trkseg>\n";
	if (iStart < iEnd){
		for(var i = iStart; i < iEnd; i++){  
			gpxString += trkptNode(_track.trackPtsArray[i])+'\n';
		}
	}	else{
		for(var i = iStart; i > iEnd; i--){  
			gpxString += trkptNode(_track.trackPtsArray[i])+'\n';
		}
	}
	gpxString += "</trkseg>\n";
	gpxString += "</trk>\n</gpx>";	
	var fileNameToSaveAs = "gpx_tmp.gpx";
	if (fullTrack) {fileNameToSaveAs = Name + ".gpx";}	
	writeFile(gpxString, fileNameToSaveAs);
	if (fullTrack) {
		trackModified[num - 1] = false;
	}
}

function writeFile (strToWrite, _fileNameToSaveAs) {
	var textToSaveAsBlob = new Blob([strToWrite], {type:"text/plain"});
	var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
	var downloadLink = document.createElement("a");
	downloadLink.download = _fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	downloadLink.href = textToSaveAsURL;
	downloadLink.onclick = destroyClickedElement;
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
 
 //comment next line to avoid create gpx file and to see the console.log
	downloadLink.click();

	function destroyClickedElement(event){
		document.body.removeChild(event.target);
	}
}

// endregion

// region -Menu----	
	
function todoAlert() {
	alert("Pas encore fait");
}

b_saveFull_1.onclick = saveTrack_;
b_savePart_1.onclick = saveTrack_;
b_saveFull_2.onclick = saveTrack_;
b_savePart_2.onclick = saveTrack_;

function saveTrack_(evt) {
	var btn = evt.target.id;
	switch (btn) {
		case "b_saveFull_1" :
			saveTrack(0, true);
			break;
		case "b_savePart_1" :
			saveTrack(0, false);
			break;
		case "b_saveFull_2" :
			saveTrack(1, true);
			break;
		case "b_savePart_2" :
			saveTrack(1, false);
			break;

	}
} 

b_close_1.onclick = closeTrack;
b_close_2.onclick = closeTrack;
function closeTrack(evt) { ////TODO
	var btn = evt.target.id;
switch (btn) {
		case  "b_close_1" :
			if (goOnIfTrackModified(0)) 
			{
				gpxRecs[0].clearData();
				if (gpxRecs[1].isEmpty()) {
					setActiveTrack(-1, false);
				} else {
					setActiveTrack(1, false);
				}
			}
		break;
		case  "b_close_2" :
			if (goOnIfTrackModified(1)) {
				gpxRecs[1].clearData();
				if (gpxRecs[0].isEmpty()) {
					setActiveTrack(-1, false);
				} else {
					setActiveTrack(0, false);
				}
			}
		break;
	}
////	showTrackSwictchButtons();
}

function goOnIfTrackModified(recNum) {
		var goOn = true;
		////
/*		if (trackModified[recNum]) {
			goOn = confirm ("La trace " + recNum + " a été modifiée, abandonner les changements ?"); 
			if (goOn) { trackModified[recNum] = false; }
		}*/
		return goOn;
}
  
function setMap(mapIndex) {
	mapTypeIndex = mapIndex;
	switch (mapTypeIndex) {
		case 0 : 
			b_map.innerHTML  = "OpenTopoMap"; 
			break;
		case 1 : 
			b_map.innerHTML  = "OpenStreetMap"; 
			break;
		case 2 : 
			b_map.innerHTML  = "IGN Image aérienne"; 
			break;
		case 3 : 
			b_map.innerHTML  = "Plan IGN"; 
			break;
	}
	mapSource = mapSources[mapTypeIndex];
	mapSource.refresh();
	baseMap.setSource(mapSource);
}

bSub21.onclick = do_bSub21;
function do_bSub21(){
	infoVisible = !infoVisible;
	show_hideInfo(infoVisible);
}

b_aff_desc.onclick = do_b_aff_desc;
function do_b_aff_desc(){
	descVisible = !descVisible;
	if (gpxRecs[recNum].track.description) {
		descInfo.innerHTML = gpxRecs[recNum].track.description;
	} else {
		descInfo.innerHTML = 
		` Pas de description dans cette trace<br>
		 La descrition doit être entre les balises &ltdesc&gt, à l'intérieur de &lttrk&gt 
		 `
	}
	show_hideDesc(descVisible);
}

b_aff_osm.onclick = do_b_aff_osm;
function do_b_aff_osm() {
	osmVisible = !osmVisible;
	show_hideOsm(osmVisible);
}

b_aff_elev.onclick = do_b_aff_elev;
function do_b_aff_elev() {
	elevVisible = !elevVisible;
	show_hideElev(elevVisible);
}


bSub22.onclick = do_bSub22;
function do_bSub22(){
	if (profilType == 1) 
		profilType = 0;
	else 
		profilType = 1;
	show_hideProfil();
}

bSub23.onclick = do_bSub23;
function do_bSub23(){
	if (profilType == 2) 
		profilType = 0;
	else 
		profilType = 2;
	show_hideProfil();
}

b_aff_extract.onclick = do_b_aff_extract;
function do_b_aff_extract(){
	extractVisible = !extractVisible;
	show_hideExtract(extractVisible);
}

bSub31.onclick = do_bSub31;
function do_bSub31(){
	setMap(0);
	bSub31.innerHTML = "OpenTopoMap -x-";
	bSub32.innerHTML = "OpenStreetMap ";
	bSub33.innerHTML = "IGN Image aérienne";
	bSub34.innerHTML = "Plan IGN";
}

bSub32.onclick = do_bSub32;
function do_bSub32(){
	setMap(1);
	bSub31.innerHTML = "OpenTopoMap";
	bSub32.innerHTML = "OpenStreetMap -x- ";
	bSub33.innerHTML = "IGN Image aérienne ";
	bSub34.innerHTML = "Plan IGN";
}

bSub33.onclick = do_bSub33;
function do_bSub33(){
	setMap(2);
	bSub31.innerHTML = "OpenTopoMap";
	bSub32.innerHTML = "OpenStreetMap";
	bSub33.innerHTML = "IGN Image aérienne -x- ";
	bSub34.innerHTML = "Plan IGN";
}

bSub34.onclick = do_bSub34;
function do_bSub34(){
	setMap(3);
	bSub31.innerHTML = "OpenTopoMap";
	bSub32.innerHTML = "OpenStreetMap";
	bSub33.innerHTML = "IGN Image aérienne";
	bSub34.innerHTML = "Plan IGN -x-";
}

bSub41.onclick = do_bSub41;
function do_bSub41(){
 //   var x = timeShiftDiv.style.display;
 if (timeShiftDiv.style.display= "none") {
		timeShiftDiv.style.display = "block";
	} else {
		timeShiftDiv.style.display = "none";
	}
}

bSub_smooth.onclick = show_smooth;
function show_smooth(){
	smoothDiv.style.display = "block";
}



bSub_elevShift.onclick = do_bSub_elevShift;
function do_bSub_elevShift(){
	elevShiftDiv.style.display = "block";
}


bTrack1.onclick = do_bTrack1;
bTrack1P.onclick = do_bTrack1;
function do_bTrack1(){
	setActiveTrack(0, false);
}
bTrack2.onclick = do_bTrack2;
bTrack2P.onclick = do_bTrack2;
function do_bTrack2(){
	setActiveTrack(1, false);
}

//---------------------------------------------------------------
var startPtIndex = document.getElementById("startPtIndex");
var stopPtIndex = document.getElementById("stopPtIndex");
var timeShiftInput = document.getElementById("timeShiftInput");
bStartPt.onclick = setStartPt;
function setStartPt(){
	startPtVal =  currentIndex;
	if (gpxRecs[recNum].track != null)
		gpxRecs[recNum].track.extractStart = currentIndex
	startPtIndex.innerHTML = currentIndex ;
}

bStopPt.onclick = setStopPt;
function setStopPt(){
	stopPtVal =  currentIndex;
	if (gpxRecs[recNum].track != null) {
		gpxRecs[recNum].track.extractEnd = currentIndex
	}
	else {
//		alert("setStopPt gpxRecs[recNum].track = null");  // why when loading gpx ?
	}
	stopPtIndex.innerHTML =	currentIndex ;
}

bCancelH.onclick = cancelTimeShift;
bSubmitH.onclick = validateTimeShift2;
timeShiftInput.onchange = validateTimeShift;

function validateTimeShift2() {
	validateTimeShift();
    timeShiftDiv.style.display = "none";
}
function cancelTimeShift() {
    timeShiftDiv.style.display = "none";
}
function validateTimeShift() {
	var y = Number( timeShiftInput.value);
	gpxRecs[recNum].track.shiftTime(y);
	updateTrackInfo();
	showPoint(currentIndex, gpxRecs[recNum].track);

}

	// region Smooth
var smoothValInput = document.getElementById("smoothValInput");
var smooth_info = document.getElementById("smooth_info");

var b_smooth_pts = document.getElementById("b_smooth_pts"); 
var b_smooth_dist = document.getElementById("b_smooth_dist"); 
b_smooth_dist.checked = true;
var smooth_dist_mode = true ;
b_smooth_pts.addEventListener('change', function (e) {
do_radio(e.target);
});
b_smooth_dist.addEventListener('change', function (e) {
do_radio(e.target);
});

function do_radio(target){
	smooth_dist_mode = (target.value == 'dist');
	if (gpxRecs[recNum].track) {
		if (smooth_dist_mode) {
			smoothValInput.value = gpxRecs[recNum].track.smoothDist;		
		} else {
			smoothValInput.value = gpxRecs[recNum].track.smoothPts;
		}
		validateSmooth();
	}
}


bCancelSmooth.onclick = cancelSmooth;
bSubmitSmooth.onclick = validateSmooth2;
smoothValInput.onchange = validateSmooth;
function cancelSmooth() {
    smoothDiv.style.display = "none";
}
function validateSmooth2() {
	validateSmooth()
    smoothDiv.style.display = "none";
}
	// endregion

bCancelElevShift.onclick = cancelElevShift;
bSubmitElevShift.onclick = validateElevShift2;
elevShiftInput.onchange = validateElevShift;
function cancelElevShift() {
    elevShiftDiv.style.display = "none";
}
function validateElevShift2() {
	validateElevShift()
    elevShiftDiv.style.display = "none";
}
function validateElevShift() {
	var y = Number( elevShiftInput.value);
	gpxRecs[recNum].track.elevShift = y;
	if (gpxRecs[recNum].track.hasElev){
		calcSmoothPts(gpxRecs[recNum].track);
	}
//// 	calcIntegrals(gpxRecs[recNum].track);	
	updateTrackInfo();
	showPoint(currentIndex, gpxRecs[recNum].track);
	drawProfil(gpxRecs[recNum].track);				
}

// endregion
  
// region Point

var ptMode = "curPt"; // enum : curPt, selectedPt, selectedWpt

var curPt_latlng = (map.getCenter());//; L.latLng([0,0])

const curPtStyle = {
		"radius": "4",
		"fillColor": "orange",
		"fillOpacity": "0.6",
		"color": "black",
		"weight": "1"				
};

const wptOverStyle = {
		"radius": "7",
		"fillColor": "white",
		"fillOpacity": "0.1",
		"color": "black",
		"weight": "1"				
};

function moveableMarker(map, marker) {

// drag circleMarker from
// https://stackoverflow.com/questions/43410600/leaflet-v1-03-make-circlemarker-draggable

  function trackCursor(evt) {
    marker.setLatLng(evt.latlng);
////	markerMoving = true;
  }
  marker.on("mousedown", () => {
    map.dragging.disable()
    map.on("mousemove", trackCursor)
  })
  marker.on("mouseup", () => {
//// 	mapClicked = true;
	map.dragging.enable()
    map.off("mousemove", trackCursor)
  })
  return marker
}
	
////var markerMoving = false;

var curPtMark = new L.CircleMarker(curPt_latlng).setStyle(curPtStyle).addTo(map);
////var curPtMarkSelected = false;

var tooltipMark = new L.CircleMarker(curPt_latlng, {radius: 0, weight: 0})
		.bindTooltip(tooltipDiv, {
			permanent: true,
			interactive: true,
			offset: L.point(0, -22),
			direction: 'center',
			className: 'curPt_tooltip',
		})
		.addTo(map);

var curPtMov = moveableMarker(map, curPtMark)	//même marker mais déplaçable

function doMapClick(e) {
	if (!wayPtSelected) {
		isWaypoint = false;
		curPt_latlng = e.latlng;
		curPtMark.setLatLng(curPt_latlng);
		setTooltip(curPt_latlng, curPtMark);
		tooltipMark.openTooltip();
		if(recNum >= 0 && gpxRecs[recNum].track.trackPtsArray.length>0) {
			var index = gpxRecs[recNum].track.nearestPtIndex(curPt_latlng);
			var track_point = gpxRecs[recNum].track.trackPtsArray[index];
			var ptDistance = distSphere(track_point, curPt_latlng);	
			var dPixels = 20;
			var refDistance = pixelToMeters(dPixels);
			if (ptDistance < refDistance) {			
				curPtMark.setLatLng(track_point);
				currentIndex = index;
				showPoint(index, gpxRecs[recNum].track);
			}	
		}
	}

}

  tooltipMark.on("mousedown", () => {
    map.dragging.disable()
});
  tooltipMark.on("mouseup", () => {
    map.dragging.enable()
});

var wptFeature = JSON.parse('{ "type": "Feature", "properties" :{}, "geometry":{}}');

function setTooltip(_latLng, _truc) {
	tooltipMark.openTooltip(); // must be placed here ?
	tooltipMenu.style.display = "none";
	editDiv.style.display = "none";

	if (isWaypoint) {
		coordsDiv.style.display ="none";
		tooltipText.style.display = "inline";
			tooltipText.innerHTML = _truc.feature.properties.name;
			wptFeature = _truc.feature;
	} else {
		coordsDiv.style.display = "inline";
		tooltipText.style.display = "none";
		edit_input.value = "";
		latLngSpan.innerHTML = latLngStr(_latLng);
		wptFeature.geometry.type = "Point";
		wptFeature.geometry.coordinates = [_latLng.lng, _latLng.lat];
////		photoDiv.style.display = "none";
////		img.src = "";*/
	}
	tooltipMark.setLatLng(_latLng);// must be placed after to account for the size of tooltipDiv
}

tooltipMark.on("click", function(e){
	alert('tooltipMark.CLICK');////should never happens
});

tooltipDiv.onclick = stopPropag; 
function stopPropag(event) {
	event.stopPropagation();
}

bCloseTooltip.onclick = hideTooltip;
	function hideTooltip(){
		tooltipMenu.style.display = "none";		
		tooltipText.style.display = "none";
		coordsDiv.style.display ="none";
		editDiv.style.display = "none";
		tooltipMark.closeTooltip();
	}
	
b_PopUpMenu.onclick = showPopUpMenu;
	function showPopUpMenu(){
		if (isWaypoint) {
			b_createWpt.style.display = "none";
			b_editWpt.style.display ="inline";		
			b_deleteWpt.style.display ="inline";
		} else {
			b_createWpt.style.display = "inline";
			b_editWpt.style.display ="none";		
			b_deleteWpt.style.display ="none";	
		}
		tooltipMenu.style.display = "block";		
	}
	
b_createWpt.onclick = editPoint;
b_editWpt.onclick = editPoint;
	function editPoint(event) {
		editDiv.style.display = "block";
		edit_input.focus();
		tooltipMenu.style.display ="none";
		if (event.target.id == "b_createWpt") {
			if ( recNum < 0 ) {
				alert("pas de gpx ouvert");
			}
///			console.log("new wpt");		
		} else {
			edit_input.value = tooltipText.innerHTML;
///			console.log("edit wpt");		
		}	
	}

b_deleteWpt.onclick = deleteWaypoint;
	function deleteWaypoint(){
		var _features = gpxRecs[recNum].waypts.wayPtsJson.features;
		const index = _features.indexOf(wptFeature);
		if (index > -1) { // only splice array when item is found
			_features.splice(index, 1); // 2nd parameter means remove one item only
		} else {
			console.log("wptFeature not found", wptFeature);
		}
		gpxRecs[recNum].waypts.updateLayer();
		tooltipMark.closeTooltip();
	}
	
	b_editOk.onclick = editEnd;  
	b_editCancel.onclick = editEnd;
	function editEnd(btn) {
		if (btn.target.id == "b_editOk") {
			storeWpt();
		}
		hideTooltip();////
	}

	function storeWpt() {
		wptFeature.properties.name = edit_input.value;
		if (isWaypoint) {
		} else { //new waypoint
			var _wpts = gpxRecs[recNum].waypts;
			_wpts.wayPtsJson.features.push(wptFeature);
			_wpts.updateLayer();
		}
	}


// endregion

// region OSM

var osmMode = "none"; // "none", "import", "explore"

// endregion

// region tests

var cracCount = 0;
function cracTest(count) {
	cracCount++;
	if (cracCount >= count) {crac;};
}


b_Test.onclick = test;

function test() {
	console.log(tracks[0].wayPtsLayer);
	console.log(tracks[0].wayPtsJson);
}

function pixelToMeters (dPixel) {
	var zoomDiff = 17.0 - map.getZoom(); // 17.5 donne 10m
	var r = Math.pow(2,zoomDiff)* dPixel * 0.95;
	return r;
}

function test_point () {
	console.log(curPt_latlng);
	var trk = gpxRecs[recNum].track;
//	if(!trk.isEmpty)
	var index = trk.nearestPtIndex(curPt_latlng);
	var track_point = gpxRecs[recNum].track.trackPtsArray[index];
	var ptDistance = distSphere(track_point, curPt_latlng);	
	var dPixels = 10;
	var refDistance = pixelToMeters(dPixels);
		console.log(ptDistance.toFixed(2), refDistance);
		console.log(dPixels );
	if (ptDistance < refDistance) {			
		curPtMark.setLatLng(track_point);
	}


}

function test_type() {
	var point = gpxRecs[recNum].track.trackPtsArray[10];
	console.log(point);

	console.log('lng', typeof(point.lng), point.lng);
	console.log('lat', typeof(point.lat), point.lat);
	console.log('ele', typeof(point.ele), point.ele);
	console.log('eleSmooth', typeof(point.eleSmooth), point.eleSmooth);
	console.log('time', typeof(point.time), point.time);

}

function test_date() {
//	var date = new Date();
	var date = new Date('2025-01-17T08:02:10Z');
	var dateFix = new Date('2025-05-17T08:02:10Z');
	console.log(date.getTime());//miliseconds absolute
	console.log(date.toISOString());
	console.log(date.toLocaleDateString());
	console.log(date.toTimeString());
	console.log(date.getUTCHours().toFixed(0).padStart(2,"0"));
console.log('fix');
	console.log(dateFix.getTime());//miliseconds absolute
	console.log(dateFix.toISOString());
	console.log(dateFix.toLocaleDateString());
	console.log(dateFix.toTimeString());
	console.log(dateFix.getUTCHours().toFixed(0).padStart(2,"0"));
	console.log(dateFix.toISOString().substring(11,16));


}

// endregion

// region poub


// endregion


