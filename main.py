from google import genai
import json
from google.genai import types
from dotenv import load_dotenv
from GetPlantData import get_plant_conditions

load_dotenv()
PLANT_SPECIES = "Ficus lyrata"  # Example plant species
CURRENT_CONDITIONS = {
    "temperature": 75,  # in Fahrenheit
    "moisture": 40,     # in percentage
    "light_levels": 300,  # in lumens
    "soil_ph": 6.5
}
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
4. Based on the scores, display the scores then provide specific, actionable advice to optimize plant health.
"""

prompt = f"""
Please analyze the following plant care scenario and provide a recommendation:
Plant Species: {PLANT_SPECIES}
Current Conditions: {json.dumps(CURRENT_CONDITIONS)}
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