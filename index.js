var svg,
    height,
    width,
    data = {},
    locations = [],
    velocities = [],
    N;

var graph = [], degrees = [];

var dim = 2; // dimensions
var k = 10;
var g = 5e5;
var drag = 1;
var drag_slowdown = 0.05;
var delta = 0.002;
var angles = [...Array(dim)].map((x) => 0);

function randomise_vel(fac){
    for (var i = 0; i < N; i++){
        for (var d = 0; d < dim; d++){
            velocities[i][d] += fac * (Math.random() - 0.5);
        }
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
    setInterval(() => {
        drag *= 1 + drag_slowdown;
    }, 1000);
    for (let i = 0; i < data.nodes.length; i++) {
        locations.push([...Array(dim)].map((x) => (Math.random() - 0.5)*200));
        velocities.push([...Array(dim)].map((x) => 0));
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

// var temp = 1000;

function physics() {
    // randomise_vel(temp/50);
    // temp *= 0.999;
    var new_locations = [];
    var new_velocities = [];
    for (var i = 0; i < N; i++) {
        var r0 = [...locations[i]];
        var v0 = [...velocities[i]];
        for (var j = 0; j < N; j++) {
            // no self-force
            if (i == j) { continue; }
            var r1 = locations[j];
            // gravity
            var dist = 0;
            for (var d = 0; d < dim; d++) {
                dist += Math.pow(r0[d] - r1[d], 2);
            }
            dist = Math.sqrt(dist);
            var force = [];
            for (var d = 0; d < dim; d++) {
                force.push(- g * (r1[d] - r0[d]) / Math.pow(dist, 3));
            }
            // spring
            if (graph[i] && graph[i][j]) {
                for (var d = 0; d < dim; d++) {
                    force[d] += k * (r1[d] - r0[d]);
                }
            }
            // damping
            for (var d = 0; d < dim; d++) {
                force[d] -= drag * v0[d];
            }
            // update (newton's law)
            for (var d = 0; d < dim; d++) {
                v0[d] += force[d] * delta;
                r0[d] += v0[d] * delta;
            }
        }
        new_locations.push(r0);
        new_velocities.push(v0);
    }
    locations = new_locations;
    velocities = new_velocities;
    // for (var d = 0; d < dim; d++) {
    //     angles[d] += delta * (d+1);
    // }
    // setTimeout(physics, 100);
    requestAnimationFrame(physics);
}

// ------------- draw --------------

function draw() {
    svg.clear();
    // center-of-mass coordinates
    var cm = [...Array(dim)].map((x)=>0);
    for (const c of locations) {
        for (var d = 0; d < dim; d++) {
            cm[d] += c[d];
        }
    }
    for (var d = 0; d < dim; d++) {
        cm[d] /= N;
    }
    const s3 = Math.sqrt(3)
    for (var i = 0; i < N; i++) {
        var r = [...locations[i]];
        for (var d = 0; d < dim; d++) {
            r[d] -= cm[d];
        }
        [x,y] = project(r);
        draw_node(20, x, y, data.nodes[i]);
    }
    for (const [u, v] of data.edges) {
        var r0 = [...locations[u]];
        for (var d = 0; d < dim; d++) {
            r0[d] -= cm[d];
        }
        var r1 = [...locations[v]];
        for (var d = 0; d < dim; d++) {
            r1[d] -= cm[d];
        }
        [x1, y1] = project(r0);
        [x2, y2] = project(r1);
        draw_line(x1, y1, x2, y2);
    }
}

function project(coords){
    var A = 0;
    var B = 0;
    for (var d = 0; d < dim; d++) {
        A += coords[d] * Math.sin(angles[d] + d * Math.PI/dim);
        B += coords[d] * Math.cos(angles[d] + d * Math.PI/dim);
    }
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