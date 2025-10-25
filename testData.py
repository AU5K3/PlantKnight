import datetime
import json

data = {
    "timestamp": datetime.datetime.now().isoformat(),
    "device_id": "device_1",
    "species": "Ficus lyrata",
    "temperature": 82,  # in Fahrenheit
    "moisture": 65,     # in percentage
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
