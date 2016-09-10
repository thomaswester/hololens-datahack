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


var state = {
	"ip" : "172.16.0.133",
	"slot" : "1",
	"data" : "",
	"allyears": false,
	"location": [],
	"location_loaded_index": 0,
	"type": "",
	"location_data": []
}

var pdxGeoJson;

function addPointLight(x, y, z, color) {
	var light = new THREE.PointLight({"color":color});
	light.position.set(x, y, z);
	core.scene.add(light);
	return light;
}

function initializeCore() {

	var canvas = document.getElementById("chartcanvas");
	

	core.camera   = new THREE.PerspectiveCamera( );
	core.scene    = new THREE.Scene();
	core.renderer = new THREE.WebGLRenderer({ canvas: canvas });
	core.controls = new THREE.OrbitControls( core.camera, canvas );
	core.controls.noKeys = true;

	core.camera.position.set(2, 0.75, 3);
	core.camera.lookAt(core.scene.position);

	//document.body.appendChild(core.renderer.domElement);
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
		document.getElementById("statustext").innerHTML = statusText.join("<br>");

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
/*
		var textGeo = new THREE.TextGeometry( columndepth + ": "+ Math.round(yVal[i]), { font: labelFont, size: 0.04, height: 0.001, curveSegments: 2 } );
		var textMesh = new THREE.Mesh(textGeo);
		textMesh.position.set( i*columnwidth + i*chartspacing , colheight, columndepth ); //Box geometry is positioned at its’ center, so we need to move it up by half the height
		core.scene.add(textMesh); */
    }
	
}

function makeLegend( xVal ){

	// we need to construct a "label" array and a "color" array, we will pass these through node.js instead of making a mesh.

}


function dataLoaded() {

	console.log("Process Loaded Data, graphtype: ", graphtype);


	var dataCategory = state.data;
	var subCategory = "";

	var parseSubStr = dataCategory.indexOf("-");
	if( parseSubStr > 0 ){

		subCategory = dataCategory.substr( parseSubStr+1, dataCategory.length );
		dataCategory  = dataCategory.substr( 0, parseSubStr );
	}

	switch( graphtype){

		case "bar":

			if( state.location.length > 1){
				
				for( var i=0; i < state.location_data.length; i++){
					var nId = state.location_data[i].id;
					var nData = state.location_data[i].data;
					var topic = nData[dataCategory];
					if( topic != null ){
						
						var values = topic.Values;

						if( values != null){
							var x = [];
							var y = [];
							var arr = values[ values.length -1 ];

							for( xVal in arr ){
								if( xVal != "total"){
									x.push( xVal );
									y.push( arr[xVal] );
								}
							}

							makeBar( x, y, i,  state.location_data.length);

						}
					}
				}
			}else{
				var nId = state.location_data[0].id;
				var nData = state.location_data[0].data;
				var topic = nData[dataCategory];
				if( topic != null ){
					
					var values = topic.Values;
					if( values != null){
						
						for( var i=0; i < values.length; i++ ){
							var x = [];
							var y = [];
							var arr = values[ i ];

							for( xVal in arr ){
								if( xVal != "total"){
									x.push( xVal );
									y.push( arr[xVal] );
								}
							}

							makeBar( x, y, i, values.length);
						}
					}
				}
			}

			console.log("Meshes " + meshes.length);
		    //merge all geometries
			geometry = mergeMeshes(meshes);

			meshGeom = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, "wireframe" : false}) );//	
			core.scene.add(meshGeom);

			break;

		case "geo":

			var v = [];
			for( var i=0; i < state.location_data.length; i++){
				var nId = state.location_data[i].id;
				var nData = state.location_data[i].data;

				v.push( { id: nId, val: nData[dataCategory][subCategory].rank });
			}

			console.log("drawThreeGeo");
		    drawThreeGeo(pdxGeoJson, 1, 'plane', { values: v } );

			console.log("Meshes " + meshes.length);
		    //merge all geometries
			geometry = mergeMeshes(meshes);

		    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI/-2 ) );

			meshGeom = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, "wireframe" : false}) );//	
			core.scene.add(meshGeom);
			

		break;
	}

}

function loadData(){

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	    	
			var id = parseInt( state.location[ state.location_loaded_index ] );
			console.log("Data Loaded " + id );

			state.location_data.push( { id: id, data:  JSON.parse(this.responseText) } );

			state.location_loaded_index++;
			if( state.location_loaded_index >= state.location.length ){
				dataLoaded();
			}else{
				var url = "http://plot-pdx.s3-website-us-west-2.amazonaws.com/data/v1/" +  state.location[ state.location_loaded_index ] + ".json"
				this.open("GET", url, true);
				this.send();
			}

	    }else if(this.readyState > 3){
	    	console.log("Error loading data " + this.readyState + " " + this.status);
	    }
	};

	var url = "http://plot-pdx.s3-website-us-west-2.amazonaws.com/data/v1/" +  state.location[ state.location_loaded_index ] + ".json";
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function initialize() {

	var loader = new THREE.FontLoader();
	loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
			console.log("Font Loaded");
			labelFont = font;

	} );

	initializeCore();
	initializeScene();

	resizeViewport(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', function() {
		resizeViewport(window.innerWidth, window.innerHeight);
	});


	render();

	var qd = {};
	location.search.substr(1).split("&").forEach(function(item) {var s = item.split("="), k = s[0], v = s[1] && decodeURIComponent(s[1]); (qd[k] = qd[k] || []).push(v)})

	state.ip = qd.ip[0];
	state.slot =  qd.slot[0];
	state.data = qd.data[0];
	state.location = qd.location;
	state.type = qd.type[0];
	
	if( state.ip != null && state.type !=null && state.slot != null ){
	
		document.getElementById('type').value = state.type;
		document.getElementById('location').value = state.location;
		document.getElementById('data').value = state.data;
		document.getElementById('slot').value = state.slot;

		graphtype = state.type;		
		streamer = new MeshSenderWebsocket("http://" + state.ip + ":8080/",  state.data.toString(), state.slot.toString(), state.slot);

	 	var tmpJson = $.getJSON("data/neighborhoods.json", function (data) { 
		 		console.log("geojson loaded"); 
				pdxGeoJson = data;

				loadData();
	 		}
	 	);
	}
}

window.addEventListener('load', initialize);