import http.server
import json
import os
import urllib.parse

PORT = 8000
DB_FILE = 'mock_db.json'

DEFAULT_MOCK_DATA = [
    {
        "day": "Mon",
        "roommateNames": ["Ashwin", "Devan", "Reno", "Sreesanth", "Sangeeth"],
        "roommateName": "Ashwin",
        "meals": {
            "breakfast": {"checked": True, "price": 50, "manual": False},
            "lunch": {"checked": True, "price": 60, "manual": False},
            "dinner": {"checked": True, "price": 60, "manual": False}
        },
        "prices": {"breakfast": 50, "lunch": 60, "dinner": 60},
        "totalDailyRate": 170,
        "savedAt": "2026-07-11T12:00:00.000Z"
    },
    {
        "day": "Tue",
        "roommateNames": ["Ashwin", "Devan"],
        "roommateName": "Ashwin",
        "meals": {
            "breakfast": {"checked": True, "price": 50, "manual": False},
            "lunch": {"checked": True, "price": 60, "manual": False},
            "dinner": {"checked": False, "price": 60, "manual": False}
        },
        "prices": {"breakfast": 50, "lunch": 60, "dinner": 60},
        "totalDailyRate": 110,
        "savedAt": "2026-07-11T12:05:00.000Z"
    },
    {
        "day": "Wed",
        "roommateNames": ["Reno", "Sreesanth"],
        "roommateName": "Reno",
        "meals": {
            "breakfast": {"checked": False, "price": 50, "manual": False},
            "lunch": {"checked": False, "price": 60, "manual": False},
            "dinner": {"checked": True, "price": 60, "manual": False}
        },
        "prices": {"breakfast": 50, "lunch": 60, "dinner": 60},
        "totalDailyRate": 60,
        "savedAt": "2026-07-11T12:10:00.000Z"
    }
]

def load_db():
    if not os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'w') as f:
                json.dump(DEFAULT_MOCK_DATA, f, indent=2)
            return DEFAULT_MOCK_DATA
        except Exception as e:
            print(f"Error creating default mock db: {e}")
            return []
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading mock db, returning empty list: {e}")
        return []

def save_db(data):
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving mock db: {e}")

class MockServerRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == '/api/load':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            rows = load_db()
            response_data = {"status": "success", "rows": rows}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return
            
        # Default behavior: serve static file
        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == '/api/save':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                new_log = json.loads(post_data)
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": f"Invalid JSON: {str(e)}"}).encode('utf-8'))
                return

            existing_logs = load_db()
            
            day = new_log.get('day')
            new_roommates = set(new_log.get('roommateNames', []))
            if not new_roommates and new_log.get('roommateName'):
                new_roommates.add(new_log.get('roommateName'))

            cleaned_logs = []
            for log in existing_logs:
                if log.get('day') == day:
                    # Check roommate overlap
                    curr_roommates = log.get('roommateNames', [])
                    if not curr_roommates and log.get('roommateName'):
                        curr_roommates = [log.get('roommateName')]
                    
                    # Remove overlapping roommates
                    updated_roommates = [r for r in curr_roommates if r not in new_roommates]
                    if updated_roommates:
                        log['roommateNames'] = updated_roommates
                        if 'roommateName' in log and log['roommateName'] not in updated_roommates:
                            log['roommateName'] = updated_roommates[0]
                        # Recalculate total daily rate for the updated record (since number of roommates changed)
                        # We multiply the active meal prices by the new roommate count
                        meal_count = 0
                        meals = log.get('meals', {})
                        total_meals_price = 0
                        for m_key, m_val in meals.items():
                            if m_val.get('checked'):
                                total_meals_price += m_val.get('price', 0)
                        
                        log['totalDailyRate'] = total_meals_price * len(updated_roommates)
                        cleaned_logs.append(log)
                else:
                    cleaned_logs.append(log)

            # Recalculate daily rate for new entry based on checked meals times number of roommates
            new_meal_price = 0
            new_meals = new_log.get('meals', {})
            for m_key, m_val in new_meals.items():
                if m_val.get('checked'):
                    new_meal_price += m_val.get('price', 0)
            new_log['totalDailyRate'] = new_meal_price * len(new_roommates)

            if new_roommates:
                cleaned_logs.append(new_log)

            save_db(cleaned_logs)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "message": "Saved successfully"}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    print(f"Starting mock dev server on http://localhost:{PORT}")
    server = http.server.HTTPServer(('0.0.0.0', PORT), MockServerRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()
