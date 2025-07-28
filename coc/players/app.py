from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
import re
from datetime import datetime

app = Flask(__name__)
SAVE_DIR = 'sheets'

# Create save directory if it doesn't exist
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

def sanitize_filename(name):
    """Sanitize filename to prevent directory traversal and invalid characters"""
    # Remove or replace invalid characters
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    # Remove leading/trailing dots and spaces
    name = name.strip('. ')
    # Replace spaces with underscores and convert to lowercase
    name = name.replace(' ', '_').lower()
    # Limit length
    name = name[:50]
    # Ensure it's not empty
    if not name:
        name = f"character_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    return name

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save', methods=['POST'])
def save():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        name = data.get('name', 'unnamed')
        if not name.strip():
            return jsonify({"error": "Character name is required"}), 400
        
        filename = sanitize_filename(name)
        filepath = os.path.join(SAVE_DIR, f'{filename}.json')
        
        # Add metadata
        data['_metadata'] = {
            'saved_at': datetime.now().isoformat(),
            'original_name': name
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return jsonify({
            "status": "success", 
            "message": f"Character '{name}' saved successfully",
            "filename": filename
        })
    
    except Exception as e:
        app.logger.error(f"Error saving character: {str(e)}")
        return jsonify({"error": "Failed to save character"}), 500

@app.route('/load/<name>')
def load(name):
    try:
        # Sanitize the requested filename
        filename = sanitize_filename(name)
        filepath = os.path.join(SAVE_DIR, f'{filename}.json')
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Character not found"}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Remove metadata before sending to client
        if '_metadata' in data:
            del data['_metadata']
        
        return jsonify(data)
    
    except json.JSONDecodeError:
        return jsonify({"error": "Corrupted character file"}), 500
    except Exception as e:
        app.logger.error(f"Error loading character {name}: {str(e)}")
        return jsonify({"error": "Failed to load character"}), 500

@app.route('/list')
def list_sheets():
    try:
        files = []
        for f in os.listdir(SAVE_DIR):
            if f.endswith('.json'):
                try:
                    filepath = os.path.join(SAVE_DIR, f)
                    with open(filepath, 'r', encoding='utf-8') as file:
                        data = json.load(file)
                        # Use original name from metadata if available
                        if '_metadata' in data and 'original_name' in data['_metadata']:
                            display_name = data['_metadata']['original_name']
                        else:
                            display_name = data.get('name', f[:-5].replace('_', ' '))
                        
                        files.append({
                            'filename': f[:-5],  # Remove .json extension
                            'display_name': display_name,
                            'saved_at': data.get('_metadata', {}).get('saved_at', 'Unknown')
                        })
                except (json.JSONDecodeError, KeyError):
                    # Skip corrupted files
                    continue
        
        # Sort by save time (most recent first)
        files.sort(key=lambda x: x.get('saved_at', ''), reverse=True)
        
        # Return just the filenames for backward compatibility
        return jsonify([f['filename'] for f in files])
    
    except Exception as e:
        app.logger.error(f"Error listing characters: {str(e)}")
        return jsonify([])

@app.route('/delete/<name>', methods=['DELETE'])
def delete_character(name):
    """Optional endpoint to delete characters"""
    try:
        filename = sanitize_filename(name)
        filepath = os.path.join(SAVE_DIR, f'{filename}.json')
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Character not found"}), 404
        
        os.remove(filepath)
        return jsonify({"status": "success", "message": f"Character '{name}' deleted"})
    
    except Exception as e:
        app.logger.error(f"Error deleting character {name}: {str(e)}")
        return jsonify({"error": "Failed to delete character"}), 500

@app.route('/backup')
def backup_all():
    """Optional endpoint to download all characters as a single JSON file"""
    try:
        all_characters = {}
        for f in os.listdir(SAVE_DIR):
            if f.endswith('.json'):
                try:
                    with open(os.path.join(SAVE_DIR, f), 'r', encoding='utf-8') as file:
                        all_characters[f[:-5]] = json.load(file)
                except json.JSONDecodeError:
                    continue
        
        response = jsonify(all_characters)
        response.headers['Content-Disposition'] = f'attachment; filename=coc_characters_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        return response
    
    except Exception as e:
        app.logger.error(f"Error creating backup: {str(e)}")
        return jsonify({"error": "Failed to create backup"}), 500

# Error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "File too large"}), 413

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
