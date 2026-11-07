#!/usr/bin/env bash
cd "$(dirname "$0")"
python3 -m http.server 8080 &
sleep 1
xdg-open http://localhost:8080 2>/dev/null || open http://localhost:8080 2>/dev/null