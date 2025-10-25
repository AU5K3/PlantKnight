import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_plant_conditions(plant_name: str) -> str:
    api_key = os.getenv("PERENUAL_API_KEY")
    def get_plant_id(plant_name: str) -> list:
        base_url = "https://perenual.com/api/v2/species-list"
    

        params = {
            'key': api_key,  # Your Perenual API key
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
        
    id = get_plant_id(plant_name)[0]['id']
    api_url = "https://perenual.com/api/v2/species/details/{id}".format(id=id)
    params = {
        'key': api_key,  # Your Perenual API key
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()

        return [data['sunlight'], data['watering'], data['watering_general_benchmark'], data['hardiness']]

    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the second API request: {e}")
        return []






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