#include <Arduino.h>
#include <DHT.h>

// Pins
#define DHTPIN 4
#define DHTTYPE DHT11

const int PIN_SOIL = 34;
const int PIN_AIR = 35;
const int PIN_LDR = 33;

// Calibration
// Set these after taking the "dry" and "wet" readings for the probe (Serial shows raw).
// Put the soil probe in dry air/dry soil for DRY_CAL; in water-saturated soil for WET_CAL.
int SOIL_DRY_CAL = 3000;   // example 3000; adjust after seeing raw values
int SOIL_WET_CAL = 1200;   // example 1200; adjust after seeing raw values

// Air-quality rough thresholds (raw 0–4095). TUNE these for your room after warm-up.
int AIR_GOOD_MAX = 1300;  // example 1300
int AIR_MODERATE_MAX = 2200;  // example 2200

// LDR thresholds for a quick qualitative label (tune by watching raw values)
int LDR_DARK_MIN = 2800; // higher raw often = darker with typical Grove divider
int LDR_BRIGHT_MAX = 1200;

// Reading helpers
int readAveraged(int pin, uint8_t samples = 10, uint16_t delayMs = 2) {
  long sum = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(delayMs);
  }
  return (int)(sum / samples);
}

// Map soil raw to 0–100% moisture with clamping
int soilPercentFromRaw(int raw) {
  int pct = map(raw, SOIL_DRY_CAL, SOIL_WET_CAL, 0, 100);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

const char* airQualityLabelFromRaw(int raw) {
  if (raw <= AIR_GOOD_MAX) return "Good";
  else if (raw <= AIR_MODERATE_MAX) return "Moderate";
  else return "Poor";
}

const char* lightLabelFromRaw(int raw) {
  if (raw <= LDR_BRIGHT_MAX) return "Bright";
  else if (raw >= LDR_DARK_MIN) return "Dark";
  else return "Medium";
}

// Global
DHT dht(DHTPIN, DHTTYPE);
unsigned long airWarmupStart = 0;
const unsigned long AIR_WARMUP_MS = 30000; // ~30s warm-up

void setup() {
  Serial.begin(115200);
  delay(200);

  // ADC config (ESP32-specific)
  analogReadResolution(12); // 0..4095
  analogSetPinAttenuation(PIN_SOIL, ADC_11db); // better 0–3.3V range
  analogSetPinAttenuation(PIN_AIR,  ADC_11db);
  analogSetPinAttenuation(PIN_LDR,  ADC_11db);

  dht.begin();

  // Start warm-up timer for air quality sensor
  airWarmupStart = millis();

  Serial.println("\n=== Multi-Sensor Test: DHT11 + Soil + Air + LDR (ESP32) ===");
  Serial.println("Let the air-quality sensor warm up ~30 seconds before trusting readings.");
  Serial.println("Watch raw values first, then tune SOIL_DRY_CAL / SOIL_WET_CAL & thresholds.\n");
}

void loop() {
  // DHT11
  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Celsius
  bool dhtOK = !(isnan(h) || isnan(t));

  // Other sensors
  int rawSoil = readAveraged(PIN_SOIL);
  int rawAir  = readAveraged(PIN_AIR);
  int rawLdr  = readAveraged(PIN_LDR);

  // Convert soil to percent (requires calibration)
  int soilPct = soilPercentFromRaw(rawSoil);

  // Qualitative labels
  const char* airLabel = airQualityLabelFromRaw(rawAir);
  const char* lightLbl = lightLabelFromRaw(rawLdr);

  // Warm-up info
  unsigned long now = millis();
  long airWarmLeft = (long)(AIR_WARMUP_MS - (now - airWarmupStart));
  bool airWarmed = airWarmLeft <= 0;

  // Nice print (thanks mr chat gpt)
  Serial.println(F("----------------------------------------------------"));
  if (dhtOK) {
    Serial.print(F("DHT11  | Temp: ")); Serial.print(t, 1); Serial.print(F(" °C"));
    Serial.print(F("  Hum: ")); Serial.print(h, 1); Serial.println(F(" %"));
  } else {
    Serial.println(F("DHT11  | Read failed (check wiring/pull-up)."));
  }

  Serial.print(F("SOIL   | Raw: ")); Serial.print(rawSoil);
  Serial.print(F("  Moisture: ")); Serial.print(soilPct); Serial.println(F(" %"));

  Serial.print(F("AIR    | Raw: ")); Serial.print(rawAir);
  Serial.print(F("  Qual: ")); Serial.print(airLabel);
  if (!airWarmed) {
    Serial.print(F("  [warming... ~"));
    Serial.print(airWarmLeft / 1000);
    Serial.print(F("s left]"));
  }
  Serial.println();

  Serial.print(F("LDR    | Raw: ")); Serial.print(rawLdr);
  Serial.print(F("  Light: ")); Serial.println(lightLbl);

  // JSON-like one-liner (easy for logging)
  Serial.print(F("{"));
  Serial.print(F("\"temp_c\":"));   Serial.print(dhtOK ? t : NAN); Serial.print(F(","));
  Serial.print(F("\"hum_pct\":"));  Serial.print(dhtOK ? h : NAN); Serial.print(F(","));
  Serial.print(F("\"soil_raw\":")); Serial.print(rawSoil); Serial.print(F(","));
  Serial.print(F("\"soil_pct\":")); Serial.print(soilPct); Serial.print(F(","));
  Serial.print(F("\"air_raw\":"));  Serial.print(rawAir);  Serial.print(F(","));
  Serial.print(F("\"air_label\":\"")); Serial.print(airLabel); Serial.print(F("\","));
  Serial.print(F("\"ldr_raw\":"));  Serial.print(rawLdr);  Serial.print(F(","));
  Serial.print(F("\"light\":\""));  Serial.print(lightLbl); Serial.print(F("\""));
  Serial.println(F("}"));

  delay(1000);
}
