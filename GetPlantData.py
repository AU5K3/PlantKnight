import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_perenual_plant_id(plant_name: str) -> list:
    """
    Searches the Perenual API for a plant based on name and hardiness zone.

    Args:
        api_key: Your Perenual API key.
        location_hardiness_zone: The USDA hardiness zone of the location (e.g., 7).
        plant_name: The approximate common or scientific name of the plant.

    Returns:
        A list of dictionaries, where each dictionary contains 'id', 'common_name',
        and 'scientific_name' for matching plants. Returns an empty list on failure.
    """
    base_url = "https://perenual.com/api/v2/species-list"
    

    params = {
        'key': os.getenv("PERENUAL_API_KEY"),  # Your Perenual API key
        'q': plant_name,  # The search query (plant name)
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()
        
        # Check if 'data' is a key in the response and is a list
        if 'data' in data and isinstance(data['data'], list):
            plant_ids = []
            for plant in data['data']:
                # The 'id' is the relevant Plant ID.
                plant_ids.append({
                    'id': plant.get('id'),
                    'common_name': plant.get('common_name'),
                    'scientific_name': plant.get('scientific_name'),
                    # You can add more relevant details if needed
                })
            return plant_ids
        else:
            print("API response structure is unexpected or empty.")
            return []

    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the API request: {e}")
        return []

def get_plant_conditions(id: int) -> str:
    api_key = os.getenv("PERENUAL_API_KEY")
    api_url = "https://perenual.com/api/v2/species/details/{id}".format(id=id)
    print(api_url)
    params = {
        'key': api_key,  # Your Perenual API key
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()
        
        # Check if 'data' is a key in the response and is a list
        if 'data' in data and isinstance(data['data'], list):
            plant_data = []
            for plant in data['data']:
                # The 'id' is the relevant Plant ID.
                plant_data.append({
                    'sunlight': plant.get('sunlight'),
                    'sunlight_level': plant.get('xSunlightDuration'),
                    'watering_rate': plant.get('watering'),
                    'watering_days': plant.get('watering_general_benchmark'),
                    'watering_schedule': plant.get('xWateringPeriod'),
                    'hardiness_zone': plant.get('hardiness'),
                    # You can add more relevant details if needed
                })
            return plant_data
        else:
            print("API response structure is unexpected or empty.")
            print(data)
            return []

    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the second API request: {e}")
        return []





# Find the plant IDs
#plant = input("Enter plant name: ")
plant = "April Rose"
plantID = get_perenual_plant_id(plant)
print(plantID)
results = get_plant_conditions(plantID[0]['id'])
print(results)


# --- Important Considerations ---
# 1. Location to Hardiness Zone: You need a separate step or a different API 
#    to convert a text location (city, state, zip) into a **USDA Hardiness Zone**.
#    Perenual has a hardiness map, but the main search API requires the zone number.
# 2. Plant Age: The Perenual API does not use 'age' as a search filter. 
#    You would need to filter your results manually based on the characteristics of 
#    the plants returned (e.g., if you're looking for an 'established' plant, 
#    you might look at the 'watering' or 'maintenance' details, which are 
#    available in the *species details* endpoint (`/v2/species/details/{id}`), 
#    not the list endpoint).