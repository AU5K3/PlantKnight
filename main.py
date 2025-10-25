from google import genai
import json
from google.genai import types
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
from GetPlantData import get_plant_conditions
import os

load_dotenv()

MONGO_URL = f"mongodb+srv://plantknightadmin:{os.getenv('MONGO_PWD')}@plantknight.pptc5lc.mongodb.net/?appName=PlantKnight"
DATABASE_NAME = "plantData"
COLLECTION_NAME = "plant_data1"

try:
    client = MongoClient(MONGO_URL)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]

    most_recent_entry = collection.find_one(sort=[("timestamp", DESCENDING)])
    if most_recent_entry:
        print("Most recent entry from the database:")
        print(most_recent_entry)
    else:
        print("No entries found in the database.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
finally:
    if 'client' in locals() and client:
        client.close()

#PLANT_SPECIES = "Ficus lyrata"  # Example plant species
"""CURRENT_CONDITIONS = {
    "temperature": 75,  # in Fahrenheit
    "moisture": 40,     # in percentage
    "light_levels": 300,  # in lumens
    "soil_ph": 6.5
}"""


try:
    client = genai.Client()
except Exception as e:
    print(f"Error initializing GenAI client: {e}")
    exit()

available_tools = {
    "get_plant_data": get_plant_conditions
}

system_instruction = """
You are a highly specialized Horticulture AI Agent. Your primary function is to provide expert, actionable plant care recommendations.
**Procedure:**
1. **ALWAYS** use the `get_plant_data` tool to fetch plant care information before making any recommendations.
2. Compare the current environmental conditions (Temperature, Moisture, Light Levels) with the ideal conditions retrieved from the `get_plant_data` tool.
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
print(response.text)