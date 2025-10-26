import os
import json
import datetime
import secrets
import inspect
from json import JSONEncoder
from bson.objectid import ObjectId

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flasgger import Swagger

from pymongo import MongoClient, DESCENDING

from google import genai
from google.genai import types
from dotenv import load_dotenv

from GetPlantData import get_plant_conditions

def generate_swagger_docstring(func, tag_name: str) -> str:
    source_code = inspect.getsource(func)
    system_instruction = f"""
    You are an expert OpenAPI/Swagger documentation writer for a Flask API.
    Your task is to analyze the provided Python Flask route function source code and generate a complete, valid YAML docstring for Flasgger.
    
    CRITICAL RULES:
    1. The output MUST be valid YAML starting with '---'.
    2. Do NOT include the function definition or any Python code in the output.
    3. The primary tag MUST be: - {tag_name}
    4. Accurately describe the 'parameters' in the request body (if POST) or query (if GET). 
    5. Provide realistic 'examples' and detail all 'responses' (200, 201, 400, 401, etc.).
    """
    prompt = f"""
    Analyze the following Python Flask route function and generate the complete Flasgger YAML documentation block for it.

    Function Source Code for Route:
    
    {source_code}
    """

    try: 
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )

        yaml_doc = response.text.strip()

        if yaml_doc.startswith("```"):
            yaml_doc = "\n".join(yaml_doc.split("\n")[1:])
        if yaml_doc.endswith("```"):
            yaml_doc = "\n".join(yaml_doc.split("\n")[:-1])

        if not yaml_doc.strip().startswith("---"):
            yaml_doc = "---\n" + yaml_doc.strip()

        return yaml_doc.strip()
    except Exception as e:
        print(f"Error generating Swagger docstring: {e}")
        return "failed to generate docstring"


class MongoJSONEncoder(JSONEncoder):
    """Custom JSON encoder to handle MongoDB's special types."""
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime.datetime):
            # Format datetime objects as ISO strings
            return o.isoformat()
        return super().default(o)

app = Flask(__name__)
CORS(app)
app.json_encoder = MongoJSONEncoder
bcrypt = Bcrypt(app)

swagger = Swagger(app)

load_dotenv()

MONGO_URL = f"mongodb+srv://plantknightadmin:{os.getenv('MONGO_PWD')}@plantknight.pptc5lc.mongodb.net/?appName=PlantKnight"
DATABASE_NAME = "plantData"
USERS_COLLECTION = "Users"
PLANT_DATA_COLLECTION = "plant_data1"

try:
    client = MongoClient(MONGO_URL)
    db = client[DATABASE_NAME]
    users = db[USERS_COLLECTION]
    plant_data = db[PLANT_DATA_COLLECTION]
    print("database connected successfully")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

def retrieve_plant_data(device_id: str) -> dict:

    try:
        filter_query = {"device_id": device_id}
        sort_criteria = [("timestamp", DESCENDING)]
        most_recent_entry = plant_data.find_one(filter_query, sort=sort_criteria)

        #print(filter_query)
        #most_recent_entry = collection.find_one(sort=[("timestamp", DESCENDING)])
        if most_recent_entry:
            print("Most recent entry from the database:")
            print(most_recent_entry)
            return most_recent_entry
        else:
            print("No entries found in the database.")
    except Exception as e:
        print(f"Error retrieving plant data: {e}")

def get_LLM_response(most_recent_entry: dict) -> str:
    try:
        client = genai.Client()
    except Exception as e:
        print(f"Error initializing GenAI client: {e}")
        exit()

    available_tools = {
        "retrieve_plant_data": get_plant_conditions
    }

    system_instruction = """
    You are a highly specialized Horticulture AI Agent. Your primary function is to provide expert, actionable plant care recommendations.
    **Procedure:**
    1. **ALWAYS** use the `retrieve_plant_data` tool to fetch plant care information before making any recommendations.
    2. Compare the current environmental conditions (Temperature, Moisture, Light Levels) with the ideal conditions retrieved from the `retrieve_plant_data` tool.
    3. Analyze discrepancies between current and ideal conditions and give a score from 1 to 100 on each parameter (Temperature, Moisture, Light Levels), where 100 means perfect conditions.
    4. Based on the scores, provide specific, actionable advice to optimize plant health in 1 to 2 sentences.
    5. **ALWAYS** Output your findings in JSON format with the following structure:
    {
        "temperature_score": int,
        "moisture_score": int,
        "light_levels_score": int,
        "recommendations": {
            "temperature": str,
            "moisture": str,
            "light_levels": str
        }
    }
    """

    prompt = f"""
    Please analyze the following plant care scenario and provide a recommendation:
    Plant Species: {most_recent_entry['species']}
    Current Conditions: {most_recent_entry['temperature']}°F temperature, {most_recent_entry['moisture']}% moisture, {most_recent_entry['light_levels']} lumens light levels.
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=[get_plant_conditions]
        ),
    )

    if response.function_calls:
        for function_call in response.function_calls:
            func_name = function_call.name
            func_args = dict(function_call.args)

            print(f"Function Call: {func_name} with arguments {func_args}")

            if func_name in available_tools:
                function_to_call = available_tools[func_name]
                tool_response = function_to_call(**func_args)

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        prompt,
                        response.candidates[0].content,
                        types.Content(
                            role="tool",
                            parts=[
                                types.Part.from_function_response(
                                    name=func_name,
                                    response={
                                        "result": tool_response,
                                    }
                                )
                            ]
                        )
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=[get_plant_conditions],
                    ),
                )
    return response.text

@app.route('/api/get_plant_data', methods=['GET'])
def get_plant_data():
    """
    Input: JSON with 'device_id' field containing device_id
    Output: JSON with 'message' and 'output' fields"""
    get_plant_data.__doc__ = generate_swagger_docstring(get_plant_data, "Plant Data")
    device_id = request.args.get('device_id')

    if not device_id:
        return jsonify({'message': 'device_id is required'}), 400

    res = retrieve_plant_data(device_id)
    return jsonify({'message': 'Success', 'output': str(res)})

@app.route('/api/call_llm', methods=['POST'])
def call_llm():
    call_llm.__doc__ = generate_swagger_docstring(call_llm, "LLM Interaction")
    data = request.get_json()
    device_id = data.get('device_id', 'no device_id provided')

    most_recent_entry = retrieve_plant_data(device_id)
    if not most_recent_entry:
        return jsonify({'message': 'No data found for the given device_id'}), 404

    llm_response = get_LLM_response(most_recent_entry)
    return jsonify({'message': 'Success', 'output': llm_response})

@app.route('/api/register', methods=['POST'])
def register():
    register.__doc__ = generate_swagger_docstring(register, "User Management")
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
        
        existing_user = users.find_one({'username': username})
        if existing_user:
            return jsonify({'message': 'Username already exists'}), 409
        
        hashed_password = Bcrypt().generate_password_hash(password).decode('utf-8')
        firstDevice = [data['device_id']]
        user_document = {
            'username': username,
            'password': hashed_password,
            'devices': firstDevice
        }
        users.insert_one(user_document)
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({'message': str(e)}), 500
    

@app.route('/api/login', methods=['POST'])
def login():
    login.__doc__ = generate_swagger_docstring(login, "User Management")
    try:

        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
        
        user = users.find_one({'username': username})
        if not user or not Bcrypt().check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid username or password'}), 401
        
        return jsonify({'message': str(user)}), 200
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'message': str(e)}), 500

#@app.route('/api/link_device', methods=['POST'])
#def link_device():


@app.route('/api/catch_esp_data', methods=['POST'])
def catch_esp_data():
    catch_esp_data.__doc__ = generate_swagger_docstring(catch_esp_data, "Plant Data")
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        data['timestamp'] = datetime.datetime.now()
        data['temperature'] = (data.get('temperature') * 9/5) + 32  # Convert to Fahrenheit 
        result = plant_data.insert_one(data)
        connecting_user = users.find_one({'username': data.get('username')})
        if connecting_user:
            users.update_one(
                {'_id': connecting_user['_id']},
                {'is_connected': True}
            )
        return jsonify({'message': 'Data inserted successfully', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return jsonify({'message': str(e)}), 500
    
"""
@app.route('/api/make_device_key', methods=['POST'])
def make_device_key():
    try:
        data = request.get_json()
        username = data.get('username')

        if not username:
            return jsonify({'message': 'Username is required'}), 400
        
        user_document = users.find_one({'username': username})
        if not user_document:
            return jsonify({'message': 'User not found'}), 404
        
        new_device_key = os.urandom(4).hex()
        users.update_one(
            {'_id': user_document['_id']},
            {'$push': {'devices': new_device_key}}
        )
        return jsonify({'message': 'Device key generated successfully', 'device_key': new_device_key}), 201
    except Exception as e:
        print(f"Error generating device key: {e}")
        return jsonify({'message': str(e)}), 500
"""
@app.route('/api/add_plant', methods=['POST'])
def add_plant():
    add_plant.__doc__ = generate_swagger_docstring(add_plant, "User Management")
    try:
        data = request.get_json()
        username = data.get('username')
        plant_name = data.get('plant_name')
        species = data.get('species')

        if not username or not plant_name or not species:
            return jsonify({'message': 'Username, plant_name, and species are required'}), 400
        
        user_document = users.find_one({'username': username})
        if not user_document:
            return jsonify({'message': 'User not found'}), 404
        
        new_device_id = secrets.token_hex(4)

        new_plant_device = {
            'device_id': new_device_id,
            'plant_name': plant_name,
            'species': species,
            'is_connected': False
        }

        users.update_one(
            {'_id': user_document['_id']},
            {'$addToSet': {'devices': new_plant_device}}
        )

        return jsonify({'message': 'Plant added successfully', 'device_id': new_device_id}), 201
    except Exception as e:
        print(f"Error adding plant: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/remove_plant', methods=['POST'])
def remove_plant():
    remove_plant.__doc__ = generate_swagger_docstring(remove_plant, "User Management")
    try:
        data = request.get_json()
        username = data.get('username')
        device_id = data.get('device_id')

        if not username or not device_id:
            return jsonify({'message': 'Username and device_id are required'}), 400
        
        user_document = users.find_one({'username': username})
        if not user_document:
            return jsonify({'message': 'User not found'}), 404
        
        users.update_one(
            {'_id': user_document['_id']},
            {'$pull': {'devices': device_id}}
        )

        return jsonify({'message': 'Plant removed successfully', 'id': device_id}), 200
    except Exception as e:
        print(f"Error removing plant: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/')
def home():
    home.__doc__ = generate_swagger_docstring(home, "Home")
    print("Connected to PlantKnight API")
    return_message = {
        'message': 'Connected to PlantKnight API'
    }
    return jsonify(return_message)

def set_dynamic_docs():
    """Generates and sets the Flasgger docstrings for all API routes by calling Gemini."""
    print("--- Starting dynamic doc generation on startup ---")
    
    # List of routes that need AI-generated documentation
    routes_to_document = [
        (get_plant_data, "Data Retrieval"),
        (call_llm, "AI Analysis"),
        (register, "User Authentication"),
        (login, "User Authentication"),
        (catch_esp_data, "Hardware Integration"),
        (add_plant, "Device Management"),
        (remove_plant, "Device Management"),
    ]
    
    for func, tag in routes_to_document:
        func.__doc__ = generate_swagger_docstring(func, tag)
    
    print("--- Dynamic doc generation complete ---")

if __name__ == '__main__':
    set_dynamic_docs()
    app.run(host='0.0.0.0', port=5000, debug=True)
    import datetime