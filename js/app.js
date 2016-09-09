var meshGeom;

var gridResolution = Math.floor(Math.random() * 15 + 3);
var blueComponent = Math.random();
var animationFrequency = Math.random() * 0.01;
var waveFrequency = Math.random() * 10 + 6;

var useBufferGeometry = true;

var core = {
	"camera" : null,
	"scene" : null,
	"renderer" : null,
	"controls" : null
};

function addPointLight(x, y, z, color) {
	var light = new THREE.PointLight({"color":color});
	light.position.set(x, y, z);
	core.scene.add(light);
	return light;
}

function initializeCore() {

	core.camera   = new THREE.PerspectiveCamera();
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
	
	if(useBufferGeometry){
		makeBufferPlane();
	} else {
		makePlane();
	}	
}



function makeBufferPlane() {
	meshGeom = new THREE.PlaneBufferGeometry( 1, 1, gridResolution, gridResolution );

	var obj = new THREE.Mesh( meshGeom, new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors, "wireframe" : false}) );
	meshGeom.addAttribute("color", new THREE.BufferAttribute( new Float32Array(meshGeom.getAttribute("position").array.length), 3));

	core.scene.add(obj);
}

function updateBufferGeom() {

	var now = new Date().getTime() * animationFrequency;

	var verts  = meshGeom.getAttribute("position");
	var colors = meshGeom.getAttribute("color");

	var vertCount = verts.array.length;
	for(var i = 2; i < vertCount; i += 3) {
		verts.array[i] = Math.cos( (verts.array[i - 1]* waveFrequency) + now ) * Math.sin( (verts.array[i-2] * waveFrequency) + now) * 0.1;

		colors.array[i] = Math.cos( verts.array[i - 2] * 8 + now * 3) * 0.5 + 0.5;
		colors.array[i+1] = Math.cos( verts.array[i - 1] * 7 + now * 1.231) * 0.5 + 0.5;
	}

	verts.needsUpdate  = true;
	colors.needsUpdate = true;
}


function makePlane() {
	meshGeom = new THREE.PlaneGeometry( 1, 1, gridResolution, gridResolution );

	console.log("Colors:   " + meshGeom.colorsNeedUpdate);
	console.log("Elements: " + meshGeom.elementsNeedUpdate);
	console.log("Verts:    " + meshGeom.verticesNeedUpdate);

	var obj = new THREE.Mesh( meshGeom, new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors, "wireframe" : false}) );
	
	core.scene.add(obj);
}


function updateGeometry() {

	var now = new Date().getTime() * animationFrequency;
	var faceVerts = ['a', 'b', 'c'];

	for(var i = 0; i < meshGeom.vertices.length; i++) {
		meshGeom.vertices[i].z = Math.cos( (meshGeom.vertices[i].y * waveFrequency) + now) * 0.125;
	}

	for(var f = 0; f < meshGeom.faces.length; f++){
		var vx = meshGeom.vertices[ meshGeom.faces[f].a ].x;
		var vy = meshGeom.vertices[ meshGeom.faces[f].a ].y;

		var r = Math.cos( vx * 8 + now * 1.75) * 0.5 + 0.5;
		var g = Math.cos( vy * 6 + now * 1.231) * 0.5 + 0.5;

		r = ~~(r * 255) / 255;
		g = ~~(g * 255) / 255;
		
		meshGeom.faces[f].color.setRGB(r, g , blueComponent );
	}

	meshGeom.colorsNeedUpdate = true;
	meshGeom.verticesNeedUpdate  = true;
}


function resizeViewport(width, height) {
	core.camera.aspect = width / height;
	core.camera.updateProjectionMatrix();
	core.renderer.setSize( width, height );
}


function render() {

	var status = streamer.getDebugStatus();
	var statusText = [];
	for(var itm in status) {
		statusText.push(itm + ": " + status[itm]);
	}
	document.getElementById("status").innerHTML = statusText.join("<br>");

	if(useBufferGeometry) {
		updateBufferGeom();
	} else {
		updateGeometry();	
	}

	streamer.update(meshGeom);

	core.renderer.render(core.scene, core.camera);
	
		
	window.requestAnimationFrame(render);
}

function initialize() {

	
	initializeCore();
	initializeScene();
	

	resizeViewport(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', function() {
		resizeViewport(window.innerWidth, window.innerHeight);
	});

	render();
}

window.addEventListener('load', initialize);