var svg,
    height,
    width,
    data = {},
    locations = [],
    velocities = [],
    N;

var graph = [], degrees = [];

var k = 10;
var g = 2e6;
var d = 10;
var delta = 0.002;

function randomise_vel(fac){
    for (var i = 0; i < N; i++){
        velocities[i][0] += fac * (Math.random() - 0.5);
        velocities[i][1] += fac * (Math.random() - 0.5);
        velocities[i][2] += fac * (Math.random() - 0.5);
    }
}

// ------------- init ---------------

function main() {
    console.log("Loading data..");
    $.ajax("/data.json").done(function (resp) {
        data = resp;
        console.log("Loaded");
        init();
        physics();
        animate();
    }).fail(console.log);
}

function init() {
    svg = SVG("draw");
    N = data.nodes.length;
    for (let i = 0; i < data.nodes.length; i++) {
        locations.push([200 * (Math.random() - .5), 200 * (Math.random() - .5), 200 * (Math.random() - .5)]);
        velocities.push([0,0,0]);
    }
    for (var [x, y] of data.edges) {
        if (!graph[x]) graph[x] = [];
        if (!graph[y]) graph[y] = [];
        if (!degrees[x]) degrees[x] = 0;
        if (!degrees[y]) degrees[y] = 0;
        graph[x][y] = 1;
        graph[y][x] = 1;
        degrees[x] += 1;
        degrees[y] += 1;
    }
}

// ----------- physics -------------

var temp = 1000;

function physics() {
    randomise_vel(temp/50);
    temp *= 0.999;
    var new_locations = [];
    var new_velocities = [];
    for (var i = 0; i < N; i++) {
        var x0 = locations[i][0], y0 = locations[i][1], z0 = locations[i][2];
        var vx0 = velocities[i][0], vy0 = velocities[i][1], vz0 = velocities[i][2];
        for (var j = 0; j < N; j++) {
            // no self-force
            if (i == j) { continue; }
            // gravity
            var x1 = locations[j][0], y1 = locations[j][1], z1 = locations[j][2];
            var vx1 = velocities[j][0], vy1 = velocities[j][1], vz1 = velocities[j][2];
            var dist = Math.sqrt(Math.pow((x1 - x0), 2) + Math.pow((y1 - y0), 2) + Math.pow((z1 - z0), 2));
            var force_x = - g * (x1 - x0) / Math.pow(dist, 3);
            var force_y = - g * (y1 - y0) / Math.pow(dist, 3);
            var force_z = - g * (z1 - z0) / Math.pow(dist, 3);
            // spring
            if (graph[i] && graph[i][j]) {
                force_x += k * (x1 - x0);
                force_y += k * (y1 - y0);
                force_z += k * (z1 - z0);
            }
            // damping
            force_x += - d * vx0;
            force_y += - d * vy0;
            force_z += - d * vz0;
            // update (newton's law)
            vx0 += force_x * delta;
            vy0 += force_y * delta;
            vz0 += force_z * delta;
            x0 += vx0 * delta;
            y0 += vy0 * delta;
            z0 += vz0 * delta;
        }
        new_locations.push([x0, y0, z0]);
        new_velocities.push([vx0, vy0, vz0]);
    }
    locations = new_locations;
    velocities = new_velocities;
    // setTimeout(physics, 100);
    requestAnimationFrame(physics);
}

// ------------- draw --------------

var d1 = 0, d2 = 0, d3 = 0;

function draw() {
    svg.clear();
    d1 += 0.002;
    d2 += 0.003;
    d3 += 0.005;
    // center-of-mass coordinates
    var cmx = 0, cmy = 0, cmz = 0;
    for (const [x, y, z] of locations) {
        cmx += x;
        cmy += y;
        cmz += z;
    }
    cmx /= N; cmy /= N; cmz /= N;
    const s3 = Math.sqrt(3)
    for (var i = 0; i < N; i++) {
        var [x,y,z] = locations[i];
        x -= cmx; y -= cmy; z -= cmz;
        [x,y] = project(x,y,z);
        draw_node(20, x, y, data.nodes[i]);
    }
    for (const [u, v] of data.edges) {
        var [x1,y1,z1] = locations[u];
        x1 -= cmx; y1 -= cmy; z1 -= cmz;
        var [x2,y2,z2] = locations[v];
        x2 -= cmx; y2 -= cmy; z2 -= cmz;
        [x1, y1] = project(x1, y1, z1);
        [x2, y2] = project(x2, y2, z2);
        draw_line(x1, y1, x2, y2);
    }
}

function project(x,y,z){
    var A = x*Math.sin(d1) + y*Math.sin(4*Math.PI/3+d2) + z*Math.sin(2*Math.PI/3+d3);
    var B = x*Math.cos(d1) + y*Math.cos(4*Math.PI/3+d2) + z*Math.cos(2*Math.PI/3+d3);
    return [A,B];
}

function draw_node(r, x, y, text) {
    var gradient = svg.gradient('radial', function (stop) {
        stop.at(0, '#0f0', 1.0)
        stop.at(1, '#0f0', 0.0)
    })
    svg.circle(r * 1.5 * 200/scale).center(X(x), Y(y)).fill(gradient);
    svg.circle(r).center(X(x), Y(y)).attr({
        fill: "#111",
        opacity: 0.8,
        stroke: "#0f0",
        "stroke-width": 2 * 200 / scale
    });
    svg.text(text).center(X(x)+30, Y(y)-20).attr({
        fill: "#fff",
        "font-family": "monospace",
        opacity: 1
    });
}

function draw_line(x1,y1,x2,y2) {
    svg.line(X(x1), Y(y1), X(x2), Y(y2)).stroke({
        width: 2 * 200 / scale,
        opacity: 0.1,
        color: "#0f0",
        linecap: "round"
    });
}

var scale = 200;

function X(x) {
    return width / 2 + x * (Math.min(height, width) / scale);
}

function Y(y) {
    return height / 2 - y * (Math.min(height, width) / scale);
}

// ------------ animate --------------

function animate() {
    height = window.innerHeight;
    width = window.innerWidth;
    draw();
    requestAnimationFrame(animate);
}

$(main);