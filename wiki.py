import requests
import re
import json
import pickle
from lxml import html
from collections import deque, defaultdict

TOPIC = "Physics"

bfs_queue = defaultdict(int)
bfs_queue[TOPIC] += 1

pages_collected = set()
all_topics = list([TOPIC])
topic_count = defaultdict(int)
links = defaultdict(list)

def name(x):
    return x.replace("_", " ").replace("%E2%80%93", "-").replace("%27","'")

def save_json():
    topics = [x for (x,y) in topic_count.items() if y>=15]
    print("Hot topics:",topics,len(topics))
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
        f.write(json.dumps({"nodes": nodes, "edges": edges}))

def discard(topic):
    pass

progress = 0

while progress < 1000:
        topic = max(bfs_queue, key=lambda x: bfs_queue[x])
        bfs_queue.pop(topic)
        print("Getting:", topic,f"\t(Progress: {progress/10}%)")
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
            if ps[i].text_content().strip() == '':
                continue
            for _, _, l, _ in ps[i].iterlinks():
                if l.count("#") > 0 or len(l.split('/')) != 3:
                    continue
                new_topic = l.split('/')[2]
                bfs_queue[new_topic] += 1
                links[topic] += [new_topic]
                topic_count[new_topic] += 1
                if new_topic not in all_topics:
                    all_topics += [new_topic]
            break
        print("Next in queue:", sorted(bfs_queue.items(), key=lambda x:-x[1])[:5])
        pickle.dump(links, open("links.pickle", "wb"))
        pickle.dump(topic_count, open("topic_count.pickle", "wb"))
        save_json()
        print("")
