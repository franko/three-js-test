MYAPP = {};

var scene = new THREE.Scene();
var iwidth = 800, iheight = 600;
var camera = new THREE.PerspectiveCamera( 75, iwidth/iheight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize(iwidth, iheight);
var container = document.getElementById("three-js");
container.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera, renderer.domElement );

var Nx = 60, Ny = 60, Dx = 5, Dy = 5;
var my_zlevels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];

var myfun = function(x, y) { return 15*(x*x + 0.02)*Math.exp(-10*(x*x+y*y)); };

var xygen_grid = function(i, j, zfun) {
	var x = -1 + 2 * i / Nx, y = -1 + 2 * j / Ny;
	return new THREE.Vector3(x, y, zfun(x, y));
};

var xygen = function(i, j, zfun) {
	var x = -1 + 2 * i / Nx, y = -1 + 2 * j / Ny;
	var phi = Math.atan2(y, x);
	var cosphi = Math.max(Math.abs(Math.cos(phi)), Math.abs(Math.sin(phi)));
	x *= cosphi;
	y *= cosphi;
	return new THREE.Vector3(x, y, zfun(x, y));
};

var gen_carrier_geometry = function(height) {
	var bo_z = function() { return -height; };
	var carrier = new THREE.Geometry();
	var i = 0, j = 0;
	for (/**/; j <= Ny; j++) {
		carrier.vertices.push(xygen(i, j, myfun));
		carrier.vertices.push(xygen(i, j, bo_z));
	}
	for (j = Ny, i++; i <= Nx; i++) {
		carrier.vertices.push(xygen(i, j, myfun));
		carrier.vertices.push(xygen(i, j, bo_z));
	}
	for (i = Nx, j--; j >= 0; j--) {
		carrier.vertices.push(xygen(i, j, myfun));
		carrier.vertices.push(xygen(i, j, bo_z));
	}
	for (j = 0, i--; i >= 0; i--) {
		carrier.vertices.push(xygen(i, j, myfun));
		carrier.vertices.push(xygen(i, j, bo_z));
	}
	var icenter = carrier.vertices.push(xygen(Nx/2, Ny/2, bo_z)) - 1;
	for (var i = 0; i < 2*(Nx + Ny); i++) {
		var a = 2*i, b = 2*i + 1;
		var c = 2*i + 2, d = 2*i + 3;
		carrier.faces.push(new THREE.Face3(a, c, b), new THREE.Face3(b, c, d));
		carrier.faces.push(new THREE.Face3(b, d, icenter));
	}

	return carrier;
};

var color_level9_i = [0xd73027, 0xf46d43 ,0xfdae61, 0xfee08b, 0xffffbf, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850];
var color_level9 = []; for (var i = 0; i < 9; i++) color_level9[i] = color_level9_i[8 - i];

var radius = function(p) { return Math.sqrt(p.x*p.x + p.y*p.y); };

var lines_mat = new THREE.LineBasicMaterial({ color: 0x444444 });
for (var i = 0; i <= Nx; i += Dx) {
	var line = new THREE.Geometry();
	for (var j = 0; j <= Ny; j++) {
		var p = xygen_grid(i, j, myfun);
		if (radius(p) < 1) {
			line.vertices.push(p);
		}
	}
	scene.add(new THREE.Line(line, lines_mat));
}

for (var j = 0; j <= Ny; j += Dy) {
	var line = new THREE.Geometry();
	for (var i = 0; i <= Nx; i++) {
		var p = xygen_grid(i, j, myfun);
		if (radius(p) < 1) {
			line.vertices.push(p);
		}
	}
	scene.add(new THREE.Line(line, lines_mat));
}

var add_geometry_to_scene = function(scene, geometry, color) {
	// var material = new THREE.MeshPhongMaterial( { color: color, specular: 0xdddddd, shininess: 30, shading: THREE.SmoothShading, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 0.8 } )
	var material = new THREE.MeshBasicMaterial( { color: color, polygonOffset: true, polygonOffsetFactor: 0.8 } )
	var mesh = new THREE.Mesh( geometry, material );
	scene.add(mesh);
}

var carrier = gen_carrier_geometry(0.2);
add_geometry_to_scene(scene, carrier, 0xbbbbbb);

var grid = new CONTOUR.Grid(Nx, Ny, xygen, myfun);
grid.prepare(my_zlevels);
for (var i = 0; i < my_zlevels.length; i++) {
	grid.cut_zlevel(my_zlevels[i], my_zlevels);
}

for (var i = 0; i < my_zlevels.length - 1; i++) {
	var geometry = grid.select_zlevel(my_zlevels[i], my_zlevels[i+1], my_zlevels);
	// geometry.computeFaceNormals();
	// geometry.computeVertexNormals();
	add_geometry_to_scene(scene, geometry, color_level9[i]);
}

// create a point light
var pointLight = new THREE.SpotLight(0xFFFFFF);

// set its position
pointLight.position.x = 1;
pointLight.position.y = 3;
pointLight.position.z = 5;

// add to the scene
scene.add(pointLight);

camera.position.x = 2;
camera.position.y = -2;
camera.position.z = 0;
camera.lookAt(scene.position);

function update()
{
	controls.update();
}

var render = function () {
	requestAnimationFrame( render );
	renderer.render(scene, camera);
	update();
};

render();
