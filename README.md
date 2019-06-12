# The-Network

A very simple force layout graph visualisation made with javascript (using jquery and svg.js).
To run, just write graph data in `data.json` in this format and run `live-server` or `python2 -m SimpleHTTPServer`, and open it with a browser.

```json
{
    "nodes": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "X"
    ],
    "edges": [
        [0,1],
        [1,2],
        [2,3],
        [3,4],
        [4,5],
        [5,0],
        [6,0],
        [6,1],
        [6,2],
        [6,3],
        [6,4],
        [6,5]
    ]
}
```

The `"nodes"` list has the node labels, and then there is the edge list. (`nodes` is 0-indexed).

You can change values of spring, (anti)gravity and damping constant in index.js.

Known Bugs:
- Low Performance, frameskips can occur.