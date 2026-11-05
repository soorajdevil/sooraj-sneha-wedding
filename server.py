#!/usr/bin/env python3
"""Serves the invitation and stores guest wishes in SQLite (stdlib only).

Run:  python3 server.py        (PORT env var, default 8000)
GET/POST /api/wishes  -> list / add wishes. Data lives in wishes.db.
"""
import json, os, sqlite3, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, "wishes.db")
PUBLIC = {"/", "/index.html", "/config.js", "/scroll.js", "/scroll.css"}
PUBLIC_DIRS = ("/images/", "/music/")
lock = threading.Lock()
last_post = {}  # ip -> timestamp, simple spam throttle


def db():
    con = sqlite3.connect(DB)
    con.execute("CREATE TABLE IF NOT EXISTS wishes (id INTEGER PRIMARY KEY AUTOINCREMENT,"
                " name TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")
    return con


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/wishes":
            with lock, db() as con:
                rows = con.execute("SELECT name, message FROM wishes ORDER BY id DESC LIMIT 200").fetchall()
            return self.send_json(200, [{"name": n, "message": m} for n, m in rows])
        if path in PUBLIC or path.startswith(PUBLIC_DIRS):
            return super().do_GET()
        self.send_error(404)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/wishes":
            return self.send_error(404)
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        now = time.time()
        if now - last_post.get(ip, 0) < 5:
            return self.send_json(429, {"error": "slow down"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 4096: raise ValueError
            d = json.loads(self.rfile.read(n))
            name = str(d.get("name", "")).strip()[:60]
            msg = str(d.get("message", "")).strip()[:500]
        except Exception:
            return self.send_json(400, {"error": "bad request"})
        if not name or not msg:
            return self.send_json(400, {"error": "name and message required"})
        last_post[ip] = now
        with lock, db() as con:
            con.execute("INSERT INTO wishes (name, message) VALUES (?, ?)", (name, msg))
        self.send_json(201, {"ok": True})

    def end_headers(self):
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    db().close()
    port = int(os.environ.get("PORT", 8000))
    print(f"Serving on http://0.0.0.0:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
