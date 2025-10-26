// ===== Soil Moisture Calibration (ESP32) =====
// What it does:
// Waits for you to type 'd' (dry) or 'w' (wet) in Serial Monitor
// Averages analog readings for 60s (mean + std dev)
// Prints #defines to paste into your main project

#include <Arduino.h>

#define PIN_SOIL 34 
#define SAMPLE_MS 50 // sample every 50ms (~20 samples/sec)
#define WINDOW_MS 60000UL // 1 minute window
#define BAUD 115200

// Helpers
uint32_t calibrateOneMinute(const char* label);
void printResult(const char* label, uint32_t mean, float stdev);

void setup() {
  Serial.begin(BAUD);
  while (!Serial) {}  // allow native serial to attach

  // ADC config for 0–3.3V
  analogReadResolution(12);       // 0..4095
  analogSetPinAttenuation(PIN_SOIL, ADC_11db);

  Serial.println();
  Serial.println(F("=== Soil Moisture Sensor Calibration ==="));
  Serial.println(F("Instructions:"));
  Serial.println(F(" 1) Open Serial Monitor @ 115200."));
  Serial.println(F(" 2) For DRY: clean and keep sensor in dry air/dry soil."));
  Serial.println(F(" 3) Type 'd' and press Enter to start 1-minute averaging."));
  Serial.println(F(" 4) For WET: fully submerge the sensing area in water (or fully saturated soil)."));
  Serial.println(F(" 5) Type 'w' and press Enter to start 1-minute averaging."));
  Serial.println(F("The sketch will print #define lines you can paste into your main code."));
  Serial.println();

  Serial.print(F("Waiting for command — enter 'd' for DRY or 'w' for WET... "));
}

bool gotDry = false;
uint32_t dryMean = 0;
uint32_t wetMean = 0;

void loop() {
  if (Serial.available()) {
    char c = tolower(Serial.read());
    if (c == 'd') {
      Serial.println();
      dryMean = calibrateOneMinute("DRY");
      gotDry = true;
      Serial.print(F("\nNow set up the WET condition and type 'w' to start... "));
    } else if (c == 'w') {
      Serial.println();
      wetMean = calibrateOneMinute("WET");
      Serial.println();
      Serial.println(F("====== Suggested #defines (paste into your project) ======"));
      // If sensor reads higher when wet, keep as-is; if opposite, swap them.
      if (gotDry) {
        Serial.print(F("#define SOIL_RAW_DRY "));
        Serial.println(dryMean);
      } else {
        Serial.println(F("// NOTE: You haven't run DRY yet; run 'd' for a proper DRY value."));
        Serial.print(F("#define SOIL_RAW_DRY "));
        Serial.println(wetMean); // placeholder
      }
      Serial.print(F("#define SOIL_RAW_WET "));
      Serial.println(wetMean);
      Serial.println(F("=========================================================\n"));
      Serial.println(F("Tip: If your % goes DOWN when soil gets wetter, swap the two values."));
      Serial.print(F("You can repeat calibration at any time. Enter 'd' or 'w'... "));
    } else if (!isspace(c)) {
      Serial.println();
      Serial.print(F("Unknown command '"));
      Serial.print(c);
      Serial.println(F("'. Use 'd' (dry) or 'w' (wet)."));
      Serial.print(F("Enter command: "));
    }
  }
}

uint32_t calibrateOneMinute(const char* label) {
  Serial.print(F("["));
  Serial.print(label);
  Serial.println(F("] Starting 60s averaging... Keep the sensor steady."));

  uint32_t start = millis();
  uint32_t nextSample = start;
  uint64_t sum = 0; // 64-bit to avoid overflow
  uint64_t sumSq = 0;
  uint32_t count = 0;

  while (millis() - start < WINDOW_MS) {
    if ((int32_t)(millis() - nextSample) >= 0) {
      int raw = analogRead(PIN_SOIL);
      sum += raw;
      sumSq += (uint64_t)raw * (uint64_t)raw;
      count++;

      nextSample += SAMPLE_MS;

      // Simple progress dot every ~1s
      if (count % (1000 / SAMPLE_MS) == 0) {
        Serial.print('.');
      }
    }
    // tiny sleep to yield
    delay(1);
  }
  Serial.println();

  if (count == 0) count = 1;
  float mean = (float)sum / (float)count;
  float variance = ((float)sumSq / (float)count) - (mean * mean);
  if (variance < 0) variance = 0;
  float stdev = sqrtf(variance);

  printResult(label, (uint32_t)(mean + 0.5f), stdev);
  return (uint32_t)(mean + 0.5f);
}

void printResult(const char* label, uint32_t mean, float stdev) {
  Serial.print('['); Serial.print(label); Serial.println(F("] Results:"));
  Serial.print(F("  Samples: ~"));
  Serial.println(WINDOW_MS / SAMPLE_MS);
  Serial.print(F("  Mean raw: "));
  Serial.println(mean);
  Serial.print(F("  Std dev:  "));
  Serial.println(stdev, 1);
}
