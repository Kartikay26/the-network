import requests
import re
import json
import pickle
from lxml import html
from collections import deque, defaultdict

TOPIC = "Physics"
importance = 100
pages_get = 200

try:
    progress = pickle.load(open("progress.pickle", "rb"))
    pages_collected = pickle.load(open("pages_collected.pickle", "rb"))
    all_topics = pickle.load(open("all_topics.pickle", "rb"))
    links = pickle.load(open("links.pickle", "rb"))
    topic_count = pickle.load(open("topic_count.pickle", "rb"))
    bfs_queue = pickle.load(open("bfs_queue.pickle", "rb"))
except FileNotFoundError:
    progress = 0
    pages_collected = set()
    all_topics = list([TOPIC])
    links = defaultdict(list)
    topic_count = defaultdict(int)
    bfs_queue = defaultdict(int)
    bfs_queue[TOPIC] += 1

def name(x):
    return (x.split("(")[0]
            .replace("_", " ")
            .replace("%E2%80%93", "-")
            .replace("%27","'")
            .strip())

def save_json():
    topics = [x for (x,y) in topic_count.items() if y>=importance]
    print("Top topics: (%d)" % len(topics))
    top = [(name(x), y) for (x, y) in topic_count.items()]
    top.sort(key = lambda x: -x[1])
    for t in top[:10]:
        print(f" - {t[0]} ({t[1]})")
    nodes = [name(x) for x in topics]
    edges = []
    for a in links:
        if a in topics:
            i = topics.index(a)
        else:
            continue
        for b in links[a]:
            if b in topics:
                j = topics.index(b)
            else:
                continue
            edges += [(i,j)]
    with open("data.json","w") as f:
        f.write(json.dumps({"nodes": nodes, "edges": (edges)}))

def discard(topic):
    pass

while progress < pages_get:
        topic = max(bfs_queue, key=lambda x: bfs_queue[x])
        bfs_queue.pop(topic)
        print("Getting:", name(topic),f"\t(Progress: {progress*100//pages_get}%)")
        if topic in pages_collected:
            continue
        done = False
        while not done:
            try:
                page = requests.get(f"http://en.wikipedia.org/wiki/{topic}")
                done = True
            except ConnectionResetError:
                print("Connection lost, retrying!")
        pages_collected.add(topic)
        tree = html.fromstring(page.content)
        if tree.text_content().lower().count(TOPIC.lower()) == 0:
            print("Discarding:",topic,"!")
            discard(topic)
            continue
        progress += 1
        ps = tree.xpath("//*[@id=\"mw-content-text\"]/div/p")
        with open(f"wikidmp/{name(topic)}.txt","w") as f:
            f.write(tree.xpath("// *[@id=\"mw-content-text\"]")[0].text_content())
        for i in range(len(ps)):
            for _, _, l, _ in ps[i].iterlinks():
                if l.count("#") > 0 or l.count(":") or len(l.split('/')) != 3:
                    continue
                new_topic = l.split('/')[2]
                bfs_queue[new_topic] += 1
                links[topic] += [new_topic]
                topic_count[new_topic] += 1
                if new_topic not in all_topics:
                    all_topics += [new_topic]
        next_q = [(name(x[0]),x[1]) for x in sorted(bfs_queue.items(), key=lambda x: -x[1])[:10]]
        print("Next in queue:")
        for t in next_q:
            print(f" - {t[0]} ({t[1]})")
        pickle.dump(progress, open("progress.pickle", "wb"))
        pickle.dump(pages_collected, open("pages_collected.pickle", "wb"))
        pickle.dump(links, open("links.pickle", "wb"))
        pickle.dump(topic_count, open("topic_count.pickle", "wb"))
        pickle.dump(bfs_queue, open("bfs_queue.pickle", "wb"))
        pickle.dump(all_topics, open("all_topics.pickle", "wb"))
        save_json()
        print("")

save_json()
