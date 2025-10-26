#pragma once
#include <ArduinoIoTCloud.h>
#include <Arduino_ConnectionHandler.h>
#include "arduino_secrets.h"

// Cloud variables (from the main sketch)
extern float temperature; // °C
extern float humidity; // %RH
extern float lightPercent; // 0–100 (% of ADC range)
extern float airQualityRaw; // raw ADC (0–4095)
extern float soilPercent; // 0–100 (% moisture estimate)

// Replace with values from Arduino IoT Cloud

#define THING_ID  "" // found in the settings of the cloud
#define BOARD_ID  "" // client secret

inline void initProperties() {
  ArduinoCloud.setThingId(THING_ID);
  ArduinoCloud.setBoardId(BOARD_ID);
  ArduinoCloud.setSecretDeviceKey(SECRET_DEVICE_KEY);

  ArduinoCloud.addProperty(temperature, Permission::Read).publishEvery(10);
  ArduinoCloud.addProperty(humidity,    Permission::Read).publishEvery(10);

  ArduinoCloud.addProperty(lightPercent, Permission::Read).publishEvery(10);
  ArduinoCloud.addProperty(airQualityRaw, Permission::Read).publishEvery(10);
  ArduinoCloud.addProperty(soilPercent,   Permission::Read).publishEvery(10);
}

// Wi-Fi connection (SSID/PASS in arduino_secrets.h)
WiFiConnectionHandler ArduinoIoTPreferredConnection(SECRET_WIFI_SSID, SECRET_WIFI_PASS);
