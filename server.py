#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8900
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MuseumRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/api/save-coords':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                save_path = os.path.join(BASE_DIR, 'js', 'saved_coords.json')
                with open(save_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"[COORDS SAVED] Успешно сохранено {len(data.get('scenes', []))} сцен и {len(data.get('pano', []))} меток панорамы!")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
                return
            except Exception as e:
                print(f"[ERROR SAVING COORDS] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('0.0.0.0', PORT), MuseumRequestHandler) as httpd:
        print(f"===========================================================")
        print(f" Сервер Музея связи ПАО «Ростелеком» запущен")
        print(f" Порт: {PORT} (0.0.0.0)")
        print(f" Поддержка автосохранения координат: /api/save-coords (POST)")
        print(f"===========================================================")
        httpd.serve_forever()

if __name__ == '__main__':
    main()
