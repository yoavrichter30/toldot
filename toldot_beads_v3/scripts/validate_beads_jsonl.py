#!/usr/bin/env python3
import json, sys
from pathlib import Path

def load(path):
    rows=[]
    for no,line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(),1):
        if not line.strip(): continue
        obj=json.loads(line)
        if "_schema" in obj: continue
        rows.append(obj)
    return rows

def main(path):
    rows=load(path)
    ids=[r.get("id") for r in rows]
    if len(ids)!=len(set(ids)):
        print("duplicate ids",file=sys.stderr); return 1
    known=set(ids)
    missing=[]
    for r in rows:
        p=r.get("parent")
        if p and p not in known:
            missing.append((r["id"],"parent",p))
        for d in r.get("dependencies",[]):
            if d.get("depends_on_id") not in known:
                missing.append((r["id"],"dependency",d.get("depends_on_id")))
    if missing:
        print("missing references:",missing[:20],file=sys.stderr); return 1
    required={"id","title","status","priority","issue_type"}
    bad=[r.get("id") for r in rows if not required.issubset(r)]
    if bad:
        print("missing required fields:",bad[:20],file=sys.stderr); return 1
    print(f"OK: {len(rows)} records, {sum(r.get('issue_type')=='epic' for r in rows)} epics, {sum(r.get('issue_type')=='task' for r in rows)} tasks")
    return 0
if __name__=="__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv)>1 else "beads/all_tasks.jsonl"))
