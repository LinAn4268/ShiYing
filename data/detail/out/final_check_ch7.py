# -*- coding: utf-8 -*-
import json, re
SRC = r"C:/Users/32289/Desktop/拾影/data/detail/input/ch7.json"
OUT = r"C:/Users/32289/Desktop/拾影/data/detail/out/ch7.json"
with open(SRC, "r", encoding="utf-8") as f: s = json.load(f)
with open(OUT, "r", encoding="utf-8") as f: d = json.load(f)

assert d["chapterId"] == s["chapterId"] == "ch7"
assert d["chapterTitle"] == s["chapterTitle"]
assert d["intro"] == s["intro"]
assert len(d["items"]) == 15
for a, b in zip(s["items"], d["items"]):
    for k in ("id", "title", "tag", "section"):
        assert a[k] == b[k], (a["id"], k, a[k], b[k])
print("metadata exact-match: OK (chapterId/chapterTitle/intro + 15x id,title,tag,section)")

for it in d["items"]:
    total = len(it["lead"]) + len(it["principle"]) + sum(len(str(x)) for x in it["steps"]) + sum(len(x) for x in it["mistakes"]) + len(it["example"]) + len(it["takeaway"])
    lead = len(it["lead"])
    prin = len(it["principle"])
    paras = it["principle"].split("\\n")
    ex = len(it["example"])
    flag = "OK" if (300 <= total <= 500 and 60 <= lead <= 90 and 180 <= prin <= 280 and 2 <= len(paras) <= 3 and 100 <= ex <= 160 and 3 <= len(it["steps"]) <= 5 and 2 <= len(it["mistakes"]) <= 4 and 2 <= len(it["keywords"]) <= 4) else "FAIL"
    print(it["id"], "total", total, "lead", lead, "prin", prin, "pp", len(paras), "ex", ex, "steps", len(it["steps"]), "mis", len(it["mistakes"]), "kw", len(it["keywords"]), flag)

blob = open(OUT, "r", encoding="utf-8").read()
ascii_words = set(re.findall(r"[A-Za-z]{2,}", blob))
print("ASCII words present:", ascii_words)
print("CRLF present:", "\\r\\n" in blob)
print("items:", len(d["items"]))
