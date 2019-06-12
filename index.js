var svg,
    height,
    width,
    data = {},
    locations = [],
    velocities = [],
    N;

var graph = [], degrees = [];

var k = 0.1;
var g = 500;
var d = 0.005;
var delta = 0.005;

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
        locations.push([100 * (Math.random() - .5), 100 * (Math.random() - .5)]);
        velocities.push([10 * (Math.random() - .5), 10 * (Math.random() - .5)]);
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

function physics() {
    var new_locations = [];
    var new_velocities = [];
    for (var i = 0; i < N; i++) {
        var x0 = locations[i][0], y0 = locations[i][1];
        var vx0 = velocities[i][0], vy0 = velocities[i][1];
        for (var j = 0; j < N; j++) {
            // no self-force
            if (i == j) { continue; }
            // gravity
            var x1 = locations[j][0], y1 = locations[j][1];
            var vx1 = velocities[j][0], vy1 = velocities[j][1];
            var dist = Math.sqrt(Math.pow((x1 - x0), 2) + Math.pow((y1 - y0), 2));
            var force_x = - g * (x1 - x0) / Math.pow(dist, 3);
            var force_y = - g * (y1 - y0) / Math.pow(dist, 3);
            // spring
            if (graph[i] && graph[i][j]) {
                force_x += k * (x1 - x0);
                force_y += k * (y1 - y0);
            }
            // damping
            force_x += - d * vx0;
            force_y += - d * vy0;
            // update (newton's law)
            vx0 += force_x * delta;
            vy0 += force_y * delta;
            x0 += vx0 * delta;
            y0 += vy0 * delta;
        }
        new_locations.push([x0, y0]);
        new_velocities.push([vx0, vy0]);
    }
    locations = new_locations;
    velocities = new_velocities;
    // setTimeout(physics, 100);
    requestAnimationFrame(physics);
}

// ------------- draw --------------


function draw() {
    svg.clear();
    // center-of-mass coordinates
    var cmx = 0, cmy = 0;
    for (const [x, y] of locations) {
        cmx += x;
        cmy += y;
    }
    cmx /= N; cmy /= N;
    for (var i = 0; i < N; i++) {
        var [x,y] = locations[i];
        draw_node(20, x - cmx, y - cmy, data.nodes[i]);
    }
    for (const [u, v] of data.edges) {
        var [x1,y1] = locations[u];
        var [x2,y2] = locations[v];
        draw_line(x1-cmx, y1-cmy, x2-cmx, y2-cmy);
    }
}

function draw_node(r, x, y, text) {
    var gradient = svg.gradient('radial', function (stop) {
        stop.at(0, '#0f0', 1.0)
        stop.at(1, '#0f0', 0.0)
    })
    svg.circle(r * 1.5).center(X(x), Y(y)).fill(gradient);
    svg.circle(r).center(X(x), Y(y)).attr({
        fill: "#111",
        opacity: 0.8,
        stroke: "#0f0",
        "stroke-width": "2px"
    });
    svg.text(text).center(X(x)+30, Y(y)-20).attr({
        fill: "#fff",
        "font-family": "monospace",
        opacity: 1
    });
}

function draw_line(x1,y1,x2,y2) {
    svg.line(X(x1), Y(y1), X(x2), Y(y2)).stroke({
        width: 2,
        opacity: 0.2,
        color: "#0f0",
        linecap: "round"
    });
}

function X(x) {
    return width / 2 + x * (Math.min(height, width) / 200);
}

function Y(y) {
    return height / 2 - y * (Math.min(height, width) / 200);
}

// ------------ animate --------------

function animate() {
    height = window.innerHeight;
    width = window.innerWidth;
    draw();
    requestAnimationFrame(animate);
}

$(main);