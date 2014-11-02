/*jslint browser: true*/
/*global L */

// LOAD BUSSTOPS FROM FILE AND RENDER MAP

var coord = new Array();
var depId;
var destStationBoard;
var arrival = "";
coord = [46.4928, 11.331];
currentPosition();
// TIS: 46.4838, 11.336
/* create leaflet map */
var map = L.map('map', {
center: coord, // y, x
zoom: 16
});

/* add default stamen tile layer */
L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
minZoom: 12,
maxZoom: 18,
attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
}).addTo(map);
var markerGroup = new L.LayerGroup().addTo(map);

loadBusstopsList();
// MAP USER INTERACTIONS

// First click: Select destination
function onBusstopClickSelectDestin(el) {
	console.log("Selected Destination");
	console.log(el);
	var id = el.target.options.stopId;
	switchToDepart(id);
}

// Second click: Unselect destination
function onBusstopClickUnselectDestin(el) {
	console.log("Unselected Destination");
	console.log(el);
	switchToDestin();
}

// Second click: Select departure
function onBusstopClickDep(el) {
	console.log("Selected Arr");
	console.log(el);
	var stopId = el.target.options.stopId;
	// Add Spinner to bubble
	$("#popup").empty();
	$("<div class='spinner-container'><img class='spinner' src='images/spinner.svg'></div>").appendTo("#popup");

	// Show bubble
	$(".top-msg").hide();
	$(".info-bubble").css("background-color", "rgba(255, 255, 255, 0)");
	$(".darken").removeClass("hidden");
	$(".popup").removeClass("hidden");
	$(".info-bubble").addClass("hidden");

	loadStationBoard(stopId);
}

// UI RENDERING FUNCTIONS

// Draw all busstops
function showBusstopMap(slide) {
	//red #ff0101
	//blue #318eff
	var list = getBusstopList();
	for (var i = 0; i < list.length; i++) {
		var coord = new Array();
		coord[0] = parseFloat(list[i].busstops[0].ORT_POS_BREITE);
		coord[1] = parseFloat(list[i].busstops[0].ORT_POS_LAENGE);
		var id = list[i].busstops[0].ORT_NR;
		drawStop(id, coord, "#ff0101", onBusstopClickSelectDestin);
		if (list[i].busstops[1] != undefined) {
			coord[0] = parseFloat(list[i].busstops[1].ORT_POS_BREITE);
			coord[1] = parseFloat(list[i].busstops[1].ORT_POS_LAENGE);
			id = list[i].busstops[1].ORT_NR;
			drawStop(id, coord, "#ff0101", onBusstopClickSelectDestin);
		}
	}
}

// Draw user position
function drawPositon(coord) {
	var markerColor = "#00ff00";
	var curr_pos = L.circleMarker(coord, {opacity : 1, radius : 15, color : markerColor, fillOpacity : 1, title : "Hello"}).addTo(markerGroup);
	map.fitBounds(curr_pos.getBounds());
}

// Draw all busstops connected to the chosen destination
function drawLine(line) {
	var stops = getBusstopList();
	// busstip color
	//markerColor = "#29b1ff";
	//selected Bussops color
	//markerColor = "#ff3101";
	//callback = onBusstopClickUnselectDestin
	var coord = new Array ();
	for (var i = 0; i < stops.length; i++) {
		if (line[0] === stops[i].busstops[0].ORT_NR) {
			coord[0] = parseFloat(stops[i].busstops[0].ORT_POS_BREITE);
			coord[1] = parseFloat(stops[i].busstops[0].ORT_POS_LAENGE);
			var id = parseFloat(stops[i].busstops[0].ORT_NR);
			drawStop(id, coord, "#29b1ff", onBusstopClickDep);
		}
		if (stops[i].busstops[1] != undefined && line[0] === stops[i].busstops[1].ORT_NR) {
			var id = parseFloat(stops[i].busstops[1].ORT_NR);
			coord[0] = parseFloat(stops[i].busstops[1].ORT_POS_BREITE);
			coord[1] = parseFloat(stops[i].busstops[1].ORT_POS_LAENGE);
			drawStop(id, coord, "#29b1ff", onBusstopClickDep);
		}
	}
	//remove first element in list
	line.splice(0, 1);
	if(line.length > 0)
		drawLine(line);
}

function drawStop(id, coord, markerColor, callback) {
	L.circleMarker(coord, {opacity : 1, radius : 15, color : markerColor, fillOpacity : 1, stopId : id}).addTo(markerGroup).on('click', callback);
}

//calculats witch Busstops will be drawn
function destSuccess(data) {
	console.log("ready");
	arrival = data[0].stationname;
	if (data.length > 0)
		calcLine(getLineStops(), data);
	else
		alert("No Busses");
}

function calcLine(allLines, lines) {
	var list = new Array();
	var stops = getBusstopList();
	var j;
	var x, y;
	for (var i = 0; i < lines.length; i++) {
		j = 0;
		while (j < allLines.length && lines[i].lidname != allLines[j].LIDNAME){
			j++;
		}
		if (allLines.length != j){
			console.log("Merge");
			list = $.merge(list, allLines[j].varlist[0].routelist);
		}
	}
	for (var i = 0; i < list.length; i++) {
		j = 0;
		while (j < stops.length &&
				(stops[j].busstops[0] != list[i]) && 
				(stops.length > 0 && stops[j].busstops[0] != list[i]))
			j++;
		if (stops.length != j){
			list[i] = new Object();
			if (stops[j].busstops[0] == list[i]) {
				list[i].x = stops[j].busstops[0].ORT_POS_BREITE
					list[i].y = stops[j].busstops[0].ORT_POS_LAENGE
			}
			else {
				list[i].x = stops[j].busstops[1].ORT_POS_BREITE
					list[i].y = stops[j].busstops[1].ORT_POS_LAENGE
			}
				}
	
	}
	console.log(list);
	drawLine(list);

}

function loadDestinationStationBoard(id) {
	var urlAPI = "http://stationboard.opensasa.info/?ORT_NR="+ id + "&type=jsonp";
	request(urlAPI, destSuccess, "JSONP");
}

function writeStationBoard(data) {
	console.log(data);
	var depTime = new Array();
	$("#popup").empty();

	$("<h2 class='popup-title' id='popup-title'> <span class='blue depart'>" + chooseStationName(data[0].stationname) + "</span> <span class='arrow'>&#9654</span> <span class='red destin'>" + arrival.split("-")[0] + "</span></h2>").appendTo("#popup");

	for (var i = 0; i < data.length && i < 5; i++) {
		var tmpTime = data[i].arrival;
		tmpTime = moment(tmpTime, "hhmmss").endOf().fromNow();
		tmpTime = tmpTime.replace("minutes", "min");
		tmpTime = tmpTime.replace("minute", "min");
		tmpTime = tmpTime.replace("in a few seconds", "now");
		tmpTime = tmpTime.replace("a few seconds ago", "now");
		//var line = data.busTripStops[i].busTrip.busLineId;

		$("	<section class='arriving-bus'>" +
				"<span class='bus-time ellipsis'>" + tmpTime + "</span>" +
				"<span class='bus-line-container ellipsis'>" +
				"<span class='bus-line'>" + data[i].lidname + "</span>" +
				"<span class='bus-line-endstation'>" + chooseStationName(data[i].last_station) + "</span>" +
				"</span>" +
				"<span class='destin-time'>" + "09:3" + (i*2)%10 + "</span>" +
				"</section>").appendTo("#popup");
	}
}

function switchToDepart(id) {
	$("#msg-depart").show(0);
	hideDestinMsg();
	showDepartMsg();
	markerGroup.clearLayers();
	loadDestinationStationBoard(id);
}

function switchToDestin() {
	$("#msg-destin").show(0);
	hideDestinMsg();
	showDepartMsg();
	markerGroup.clearLayers();
	showBusstopMap();
}

function loadStationBoard(id) {  
	var urlAPI = "http://stationboard.opensasa.info/?ORT_NR="+ id + "&type=jsonp";
	request(urlAPI, writeStationBoard, "JSONP");
}

// Return the busstop list as json which is stored in the localStorage
function getBusstopList() {
	return JSON.parse(localStorage.busstops);
}

function getLineStops() {
	return JSON.parse(localStorage.line);
}
function UILang() {
	if (navigator.language.substr(0, 2) == "de")
		return "de";
	return "it";
}

function currentPosition() {
	if (!navigator.geolocation){
		error();
	}
	else {
		function success(position) {
			coord[0] = position.coords.latitude;
			coord[1] = position.coords.longitude;
			drawPositon(coord);
		};
		function error() {
			console.log("Unable to retrieve your location, using default position");
		};
		navigator.geolocation.getCurrentPosition(success, error);
	}
}

function loadBusstopsList() {
	console.log("Start Request");
	if (!localStorage.busstops) {
		console.log("New Data");
		var apiUrl = "http://opensasa.info/SASAplandata/?type=REC_ORT";
		request(apiUrl, busstopsSuccess, "jsonp");
	}
	else
		loadLineStops();
}

function busstopsSuccess(data) {
	localStorage.setItem('busstops', JSON.stringify(data));
	console.log("Data");
	console.log(data);
	loadLineStops();
}

function loadLineInfo() {
	var apiUrl = "http://opensasa.info/SASAplandata/?type=REC_LID";
	request(apiUrl, infoSuccess, "jsonp");
}

function infoSuccess(info) {
	var lineList = getLineStops();
	for (var i = 0; i < info.length; i++) {
		lineList[i].LIDNAME = info[i].LIDNAME;
		lineList[i].LI_KUERZEL = info[i].LI_KUERZEL;
	}
	localStorage.setItem('line', JSON.stringify(lineList));
	showBusstopMap();
}

function loadLineStops() {
	console.log("Start Request");
	if (!localStorage.line) {
		console.log("New Data");
		var apiUrl = "http://opensasa.info/SASAplandata/?type=LID_VERLAUF";
		request(apiUrl, lineSuccess, "jsonp");
	}
	else
		showBusstopMap();
}
function lineSuccess(data) {
	localStorage.setItem('line', JSON.stringify(data));
	console.log("Data");
	loadLineInfo();
}
// MESSAGES & POPUP

function showDestinMsg() {
	console.log("show destination msg");
	$("#msg-destin").removeClass("left").addClass("zero");
}
function hideDestinMsg() {
	console.log("hide destination msg");
	$("#msg-destin").removeClass("zero").addClass("left");
}

function showDepartMsg() {
	console.log("show departure msg")
		$("#msg-depart").removeClass("right").addClass("zero");
}
function hideDepartMsg() {
	console.log("hide departure msg")
		$("#msg-depart").removeClass("zero").addClass("right");
}

function showMenu() {
	if (!$(".darken").hasClass("hidden")) {
		blurForeground();
	} else {
		$(".about").removeClass("hidden");
		$(".darken").removeClass("hidden");
		$(".info-bubble").addClass("hidden");
		$(".info-bubble").css("background-color", "rgba(0, 0, 0, 0)");
	}
}

function blurForeground() {
	$(".about").addClass("hidden");
	$(".darken").addClass("hidden");
	$(".popup").addClass("hidden");
	$(".info-bubble").css("background-color", "rgba(0, 0, 0, 0.8)");
	$("#popup").empty();
}

function cancelQuery() {
	window.location.reload();
}

// UTILITIES

// Eliminates 300ms click delay on mobile
function removeClickDelay() {
	window.addEventListener('load', function() {
			new FastClick(document.body);
			}, false);
}
// ALL API REQUEST

// callback is the name of the callback arg
function request(urlAPI, success, callback) {
	$.ajax({
url: urlAPI,
dataType: 'jsonp',
jsonp: callback,
success: function( data ) {
console.log("success: " + urlAPI);
success(data);
},
error: function( data ) {
console.log("Error: " + urlAPI);
}
});
}

function chooseStationName(string) {
	first = string.split("-")[0];
	second = string.split("-")[1];

	if (first.length > 3) return first;
	else return second;
}

/*
	 function hideMsg() {
	 console.log("hide msg")
	 $(".ui").velocity({
scaleX: 1,
scaleY: 1,
opacity: 1,
});
$(".map-application").velocity({
opacity: 0.5,
});
$(".menu-btn").velocity({
colorRed: 255,
colorBlue: 255,
colorGreen: 255,
}, {
complete: function () {
$(".header-bar").removeClass("hidden").addClass("visible");
}
});
}*/
