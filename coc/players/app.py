from flask import Flask, request, jsonify, render_template
import os
import json

app = Flask(__name__)
SAVE_DIR = 'sheets'

if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save', methods=['POST'])
def save():
    data = request.json
    name = data.get('name', 'unnamed').replace(" ", "_").lower()
    with open(os.path.join(SAVE_DIR, f'{name}.json'), 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({"status": "success"})

@app.route('/load/<name>')
def load(name):
    try:
        with open(os.path.join(SAVE_DIR, f'{name}.json')) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({"error": "Character not found"}), 404

@app.route('/list')
def list_sheets():
    files = [f[:-5] for f in os.listdir(SAVE_DIR) if f.endswith('.json')]
    return jsonify(files)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

