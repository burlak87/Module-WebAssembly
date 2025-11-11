#!/usr/bin/env python3
import http.server
import os
import socketserver
import webbrowser

PORT = 8000
DIRECTORY = "www"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


def main():
    if not os.path.exists(DIRECTORY):
        print(f"❌ Папка {DIRECTORY} не существует!")
        print("Сначала выполните: ./compile_all.sh")
        return

    os.chdir(DIRECTORY)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Сервер запущен на http://localhost:{PORT}")
        print("📁 Обслуживается папка:", os.getcwd())
        print("🛑 Для остановки нажмите Ctrl+C")

        webbrowser.open(f"http://localhost:{PORT}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")


if __name__ == "__main__":
    main()
