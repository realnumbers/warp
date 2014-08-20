/*jslint browser: true*/
/*global L */

//main stuff
loadBusstopsList();
loadBusstopsListPair();
var coord = new Array();
var arrival;
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
	showBusstopMap();

function showBusstopMap(slide) {
  var i = 0;
  var lang = UILang();
  var busstopList = getBusstopList();
  var markerColor = (slide == "arr") ? "#29b1ff" : "#ff3101";
  for (i = 0; i < busstopList[lang].length; i++) {
    var coordBusstop = new Array();
    coordBusstop[0] = parseFloat(busstopList[lang][i].x);
    coordBusstop[1] = parseFloat(busstopList[lang][i].y);
    var thisLine = busstopList[lang][i].line;
    var id = busstopList[lang][i].id;
    //red #ff0101
    //blue #318eff
    L.circleMarker(coordBusstop, {opacity : 1, radius : 10, color : markerColor, fillOpacity : 1, title : id}).addTo(markerGroup).on('click', onBusstopClickArr);
   }
}
  function onBusstopClickArr(el) {
    console.log("Selected Destination");
    console.log(el);
    var id = el.target.options.title;
    switchToDep(id);
  }

	function onBusstopClickDep(el) {
		console.log("Selected Arr");
		console.log(el);
		var id = el.target.options.title;
		$(".top-msg").hide();
		$(".info-bubble").css("background-color", "rgba(255, 255, 255, 0)");
		$(".darken").removeClass("hidden");
		$(".popup").removeClass("hidden");
		$(".info-bubble").addClass("hidden");

    getDepBusstop(id);
	}

	function switchToDep(id) {
		$("#msg-arr").show(0);
		hideDesMsg();
		showArrMsg();
		markerGroup.clearLayers();
		showLine(id);
	}
function drawPositon(coord) {
  var markerColor = "#00ff00";
  var curr_pos = L.circleMarker(coord, {opacity : 1, radius : 15, color : markerColor, fillOpacity : 1, title : "Hello"}).addTo(markerGroup);
  map.fitBounds(curr_pos.getBounds());
}
function showLine(id) {
  var markerColor = "#29b1ff";
  var busstopList = getBusstopList()[UILang()];
  var el = getBusstopById(id);
  var coordBusstop = new Array ();
  for ( var i = 0; i < el.line.length; i++ ) {
    for ( var j = 0; j < busstopList.length; j++) {
      for ( var k = 0; k < busstopList[j].line.length; k++) {
        if ( el.line[i] == busstopList[j].line[k] ) {
          coordBusstop[0] = parseFloat(busstopList[j].x);
          coordBusstop[1] = parseFloat(busstopList[j].y);

          if (busstopList[j].id == id) {
            arrival = busstopList[j].name;
            markerColor = "#ff3101";
            L.circleMarker(coordBusstop, {opacity : 1, radius : 15, color : markerColor, fillOpacity : 1, title : id}).addTo(markerGroup).on('click', onBusstopClickArr);
          }
          else {
            markerColor = "#29b1ff";

            L.circleMarker(coordBusstop, {opacity : 1, radius : 10, color : markerColor, fillOpacity : 1, title : busstopList[j].id}).addTo(markerGroup).on('click', onBusstopClickDep);
          }

        }
      }
    }
  }
}

function getBusstopById(id) {
  var busstopList = getBusstopList()[UILang()];
  var found = false;
  var i = 0;
  while (found == false) {
    if (busstopList[i].id == id)
      found = true;
    else
      i++;
  }
  return busstopList[i];
}

function matchBusstop(id) {
  var lang = UILang();
  var pair = getBusstopPair()[lang];
  var busstops = getBusstopList()[lang];
  var j;
  var found = false;
  j = 0;
  found = false;
  while (found == false && j < pair.length) {
    var tmp = pair[j].id.split(":");
    if (id == (":" + tmp[1] + ":") || id == (":" + tmp[2] + ":")) {
      found = true;
      console.log("found match");
      id = pair[j].id;
    }
    j++;
  }
  return id;
}


function checkLine() {
  return true;
}

function getDepBusstop(id) {
  //http://html5.sasabus.org/backend/sasabusdb/findBusStationDepartures?busStationId=:5142:&yyyymmddhhmm=201309160911&callback=function123
  var idPair = matchBusstop(id);
  var time = moment().format('YYYYMMDDhhmm');
  time = "201405131550";
  var urlAPI = "http://html5.sasabus.org/backend/sasabusdb/findBusStationDepartures?busStationId="+ idPair + "&yyyymmddhhmm=" + time;
  $.ajax({
        url: urlAPI,
        dataType: 'jsonp',
        success: function( data ) {
          console.log("success");
          parseData(data, id);
            },
        error: function( data ) {
        console.log("Error");
        }
    });

}
function parseData(data, id) {
  console.log(data);
  var depTime = new Array();
	$("#popup").empty();
	$("<h2 class='station-title' id='popup-title'> <span class='blue'>" + getBusstopById(id).name + "</span> → <span class='red'>" + arrival + "</span></h2>").appendTo("#popup");
  for (var i = 0; i < data.busTripStops.length; i++) {
    for (var j = 0; j < data.busTripStops[i].busTrip.busTripStop.length; j++) {
      if (id == (":" + data.busTripStops[i].busTrip.busTripStop[j].busStopId + ":")) {
        var  tmpTime = data.busTripStops[i].busTrip.busTripStop[j].timeHHMMSS.toString();
        tmpTime = (tmpTime.length < 6) ? "0" + tmpTime : tmpTime;
        console.log(tmpTime + " #####");
				tmpTime = moment(tmpTime, "hhmmss").endOf().fromNow();
        var line = data.busTripStops[i].busTrip.busLineId;
				$("	<section class='arriving-bus'><div class='bus-time'>" + tmpTime +
					"</div><span class='bus-line'>" + line + "</span></section>").appendTo("#popup");
      }
    }
  }

}
// return the busstop list as json witch is saved in the localStorage
function getBusstopList() {
	return JSON.parse(localStorage.busstops);
}
function getBusstopPair() {
  return JSON.parse(localStorage.busstopsPair);
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
      alert("Found Positon");
      drawPositon(coord);
    };
    function error() {
      console.log("Unable to retrieve your location, use default position");
    };

    navigator.geolocation.getCurrentPosition(success, error);
  }
}

function loadBusstopsList() {
	if (!localStorage.busstops) {
		$.getJSON("data/busstops.json", function (data) {
			localStorage.setItem('busstops', JSON.stringify(data));
      window.location.reload();
		});
	}
}

function hideDesMsg() {
	console.log("hide des");
	$("#msg-des").removeClass("zero").addClass("left");
	//showArrMsg();
}
function showArrMsg() {
	console.log("show arr")
	$("#msg-arr").removeClass("right").addClass("zero");
}
function loadBusstopsListPair() {
  if (!localStorage.busstopsPair){
  $.getJSON( "data/busstops_pair.json", function(data) {
    localStorage.setItem('busstopsPair', JSON.stringify(data));
  });
  }
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
// Eliminates 300ms click delay on mobile
function removeClickDelay() {
	window.addEventListener('load', function() {
			new FastClick(document.body);
			}, false);
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
