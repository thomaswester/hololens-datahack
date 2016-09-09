//json
var data;
var streamer;

//scene setup
var meshGeom;
var meshes = [];
var labelFont;

var graphtype;//"bar","geo","line"

var core = {
	"camera" : null,
	"scene" : null,
	"renderer" : null,
	"controls" : null
};


var pdxGeoJson;
var dataJson;

function addPointLight(x, y, z, color) {
	var light = new THREE.PointLight({"color":color});
	light.position.set(x, y, z);
	core.scene.add(light);
	return light;
}

function initializeCore() {

	core.camera   = new THREE.PerspectiveCamera( );
	core.scene    = new THREE.Scene();
	core.renderer = new THREE.WebGLRenderer();
	core.controls = new THREE.OrbitControls( core.camera );
	core.controls.noKeys = true;

	core.camera.position.set(2, 0.75, 3);
	core.camera.lookAt(core.scene.position);

	document.body.appendChild(core.renderer.domElement);
}

function initializeScene() {

	var ambient = new THREE.AmbientLight(0x4a5052);
	core.scene.add(ambient);

	addPointLight(12, 19, 15, 0xfffbe7);
}

function updateGeometry() {

	if( meshGeom == null || meshGeom.geometry == null ) return;

}

function resizeViewport(width, height) {
	core.camera.aspect = width / height;
	core.camera.updateProjectionMatrix();
	core.renderer.setSize( width, height );
}

var lastSend = new Date().getTime();
function render() {

	if( meshGeom != null && meshGeom.geometry != null ){

		var status = streamer.getDebugStatus();
		var statusText = [];
		for(var itm in status) {
			statusText.push(itm + ": " + status[itm]);
		}
		document.getElementById("status").innerHTML = statusText.join("<br>");

		updateGeometry();

		var tNow = new Date().getTime();
		if( tNow - lastSend > 100 ){
			streamer.update(meshGeom.geometry);
			lastSend = tNow;
		}
	}

	core.renderer.render(core.scene, core.camera);
	window.requestAnimationFrame(render);
}

function mergeMeshes (meshes) {
  var combined = new THREE.Geometry();

  for (var i = 0; i < meshes.length; i++) {
    meshes[i].updateMatrix();
    combined.merge(meshes[i].geometry, meshes[i].matrix);
  }

  return combined;
}

function makeBar( xVal, yVal, z, zMax ){
	
	console.log("makeBar ", xVal, yVal);
	
	var chartspacing = 0.1, chartwidth = 1, chartheight = 1, chartdepth = 1; //3D units


	var columnwidth = (chartwidth / xVal.length);
	var minV = 0;//arrayMin( yVal );
	var maxV = arrayMax( yVal );

    for( var i=0; i < xVal.length; i++){
    	
    	var colheight = map_range( yVal[i], minV, maxV, 0, chartheight);
		var columndepth =  map_range(z, 0, zMax, 0, chartdepth);
		var columngeo = new THREE.BoxGeometry(columnwidth, colheight, columnwidth);

		for (var c = 0; c < columngeo.faces.length; c++) {
	        var face = columngeo.faces[c];
	        face.color.set( DISTINCT_COLORS[i]);
	    }

		var columnmesh = new THREE.Mesh(columngeo);
		columnmesh.position.set( i*columnwidth + i*chartspacing , colheight/2, columndepth ); //Box geometry is positioned at its’ center, so we need to move it up by half the height

		meshes.push( columnmesh);
    }
	
}

function makeLegend( xVal ){

	// we need to construct a "label" array and a "color" array, we will pass these through node.js instead of making a mesh.

}


function dataLoaded() {

	console.log("Process Loaded, graphtype: ", graphtype);

	switch( graphtype){

		case "bar":
			//education
			var education = dataJson["Education"];

			var v = education["Values"];
			for( var i=0; i < v.length; i++ ){
				var x = [];
				var y = [];
				var arr = v[i];
				for( xVal in arr ){
					if( xVal != "total"){
						x.push( xVal );
						y.push( arr[xVal] );
					}
				}


				makeBar( x, y, i, v.length);
			}
			break;

		case "geo":
		     drawThreeGeo(pdxGeoJson, 1, 'plane', {} );

		break;
	}

	console.log("Meshes " + meshes.length);
    //merge all geometries
	geometry = mergeMeshes(meshes);

	meshGeom = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, "wireframe" : false}) );//	
	core.scene.add(meshGeom);
}

function loadData( url){
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	    	console.log("Data Loaded");
	        dataJson = JSON.parse(this.responseText);
	        dataLoaded();

	    }else if(this.readyState > 3){
	    	console.log("Error loading data " + this.readyState + " " + this.status);
	    }
	};

	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function initialize() {

	var loader = new THREE.FontLoader();
	loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
			console.log("Font Loaded");

	} );

	streamer = new MeshSenderWebsocket("http://localhost:8080/", "Thomas", "Chart via Websocket", 0);

	initializeCore();
	initializeScene();
	
	resizeViewport(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', function() {
		resizeViewport(window.innerWidth, window.innerHeight);
	});

 	var tmpJson = $.getJSON("data/neighborhoods.json", function (data) { console.log("geojson loaded"); pdxGeoJson = data; });

	render();
	
	graphtype = "geo";
	loadData( "data/nw.json");
}


window.addEventListener('load', initialize);