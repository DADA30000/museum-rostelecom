#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${1:-8900}"
chmod +x server.py
exec python3 server.py "$PORT"
