#include "thingProperties.h"
#include <DHT.h>
#include <WiFi.h>
#include <ArduinoHttpClient.h> 
#include "arduino_secrets.h" // must define: SECRET_TS_WRITE_KEY

// Pin mapping
#define DHTPIN 4
#define DHTTYPE DHT11 // Temperature & humidity

// Use ONLY ADC1 pins when Wi-Fi is on
#define PIN_LIGHT 33 // Grove Light -> SIG
#define PIN_AIR 35 // Grove Air Quality v1.3 -> SIG
#define PIN_SOIL 34 // Capacitive soil moisture -> SIG

// Global values, used for Cloud
float temperature = 0.0f; // C
float humidity = 0.0f; // %RH
float lightPercent = 0.0f; // %
float airQualityRaw = 0.0f; // raw 0..4095
float soilPercent = 0.0f; // %

const uint16_t RAW_NEAR_ZERO = 5; // treat <5 as disconnected/shorted
const uint16_t RAW_NEAR_FULL = 4090; // treat >4090 as saturated (over-voltage or wrong attenuation)

// Sensors
DHT dht(DHTPIN, DHTTYPE);

// ThingSpeak connection
WiFiClient tsNet; // plain TCP
HttpClient tsHttp(tsNet, "api.thingspeak.com", 80); // host + port

// Helpers
static uint16_t readADC_Avg(gpio_num_t pin, uint8_t samples = 16) {
  uint32_t sum = 0;
  for (uint8_t i = 0; i < samples; ++i) {
    sum += analogRead(pin);
    delayMicroseconds(500);
  }
  return (uint16_t)(sum / samples);
}

// Map with clamping — works for either order of endpoints (a>b or a<b)
static float fmapc(float x, float a, float b, float y0, float y1) {
  if (a == b) return (y0 + y1) * 0.5f;
  if (a < b) { if (x < a) x = a; if (x > b) x = b; }
  else       { if (x > a) x = a; if (x < b) x = b; }
  return (x - a) * (y1 - y0) / (b - a) + y0;
}

// Calibration based on user results 
static const float SOIL_RAW_DRY = 3016.0f; // dry air/dry soil
static const float SOIL_RAW_WET = 68.0f; // fully wet/submerged

// ThingSpeak sender
void sendToThingSpeak(float tC, float h, float lPct, float airRaw, float soilPct) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[TS] WiFi not connected, skip");
    return;
  }

  String body = String("api_key=") + SECRET_TS_WRITE_KEY +
                "&field1=" + String(tC, 2) +
                "&field2=" + String(h, 1) +
                "&field3=" + String(lPct, 1) +
                "&field4=" + String(airRaw, 0) +
                "&field5=" + String(soilPct, 1);

  tsHttp.beginRequest();
  tsHttp.post("/update");
  tsHttp.sendHeader("Content-Type", "application/x-www-form-urlencoded");
  tsHttp.sendHeader("Content-Length", body.length());
  tsHttp.beginBody();
  tsHttp.print(body);
  tsHttp.endRequest();

  int status = tsHttp.responseStatusCode();
  String resp = tsHttp.responseBody();
  Serial.print("[TS] HTTP "); Serial.print(status);
  Serial.print("  resp: ");   Serial.println(resp);

  tsHttp.stop(); // close connection each write
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // ADC config for 0–3.3V
  analogReadResolution(12); // 0..4095
  analogSetPinAttenuation(PIN_LIGHT, ADC_11db);
  analogSetPinAttenuation(PIN_AIR,   ADC_11db);
  analogSetPinAttenuation(PIN_SOIL,  ADC_11db);

  initProperties();
  ArduinoCloud.begin(ArduinoIoTPreferredConnection);

  Serial.print("Connecting to Arduino IoT Cloud");
  while (!ArduinoCloud.connected()) {
    ArduinoCloud.update();
    delay(400);
    Serial.print('.');
  }
  Serial.println("\nConnected to Arduino IoT Cloud ✅");
}

void loop() {
  ArduinoCloud.update();

  static unsigned long lastRead   = 0;
  static unsigned long lastTsPost = 0; // ThingSpeak throttle (>=15s free tier)

  if (millis() - lastRead >= 10000UL) { // every 10s (unchanged)
    lastRead = millis();

    // DHT
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!isnan(h) && !isnan(t)) {
      humidity    = h;
      temperature = t;
    } else {
      Serial.println("[DHT] Failed to read");
    }

    // Light debug
    uint16_t rawLight = readADC_Avg((gpio_num_t)PIN_LIGHT);
    if      (rawLight <= RAW_NEAR_ZERO) lightPercent = 0;
    else if (rawLight >= RAW_NEAR_FULL) lightPercent = 100;
    else                                lightPercent = (rawLight / 4095.0f) * 100.0f;

    // Air Quality
    uint16_t rawAir = readADC_Avg((gpio_num_t)PIN_AIR);
    airQualityRaw = (float)rawAir;

    // Soil moisture
    uint16_t rawSoil = readADC_Avg((gpio_num_t)PIN_SOIL);
    soilPercent = fmapc(rawSoil, SOIL_RAW_DRY, SOIL_RAW_WET, 0.0f, 100.0f);

    // Printing in the serial
    Serial.print("[Cloud] T="); Serial.print(temperature, 1);
    Serial.print("°C H=");      Serial.print(humidity, 0);
    Serial.print("% Light=");   Serial.print(lightPercent, 0);
    Serial.print("% AirRaw=");  Serial.print(airQualityRaw, 0);
    Serial.print(" Soil=");     Serial.print(soilPercent, 0);
    Serial.println("%");

    // ThingSpeak send 
    if (millis() - lastTsPost >= 20000UL) { // post every 20s (20s due to ThingSpeak)
      lastTsPost = millis();
      sendToThingSpeak(temperature, humidity, lightPercent, airQualityRaw, soilPercent);
    }
  }
}
