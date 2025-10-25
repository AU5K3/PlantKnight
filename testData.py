import datetime
import json

data = {
    "timestamp": datetime.datetime.now().isoformat(),
    "species": "Ficus lyrata",
    "temperature": 75,  # in Fahrenheit
    "moisture": 40,     # in percentage
    "light_levels": 300,  # in lumens
    "soil_ph": 6.5
}

filename = "test_data.json"
try:
    with open(filename, 'w') as json_file:
        json.dump(data, json_file, indent=4)
    print(f"Test data written to {filename}")
except IOError as e:
    print(f"An error occurred while writing to the file: {e}")
