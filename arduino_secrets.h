#include <Arduino_ConnectionHandler.h>

/* A complete list of supported boards with WiFi is available here:
 * https://github.com/arduino-libraries/ArduinoIoTCloud/#what
 */

// I repurposed both .h files, didn't delete anything so unused code is present in this file

#if defined(BOARD_HAS_WIFI)
  #define SECRET_WIFI_SSID "" // WiFi name
  #define SECRET_WIFI_PASS "" // WiFi password
  #define SECRET_TS_WRITE_KEY "" // ThingSpeak key
#endif

/* ESP8266 ESP32 */
#if !defined(BOARD_HAS_SECURE_ELEMENT)
  #define SECRET_DEVICE_KEY "" // Client secret
#endif

/* MKR GSM 1400 */ /* MKR NB 1500 */ /* Portenta CAT.M1/NB IoT GNSS Shield */
/* Portenta H7 and C33 + Portenta Mid Carrier + 4G Module */
#if defined(BOARD_HAS_GSM) || defined(BOARD_HAS_NB) || \
    defined(BOARD_HAS_CATM1_NBIOT) || defined(BOARD_HAS_CELLULAR)
  #define SECRET_PIN ""
  #define SECRET_APN ""
  #define SECRET_LOGIN ""
  #define SECRET_PASS ""
#endif

/* MKR WAN 1300/1310 */
#if defined(BOARD_HAS_LORA)
  #define SECRET_APP_EUI ""
  #define SECRET_APP_KEY ""
#endif

/* Portenta H7 + Ethernet shield */
#if defined(BOARD_HAS_ETHERNET)
  #define SECRET_OPTIONAL_IP ""
  #define SECRET_OPTIONAL_DNS ""
  #define SECRET_OPTIONAL_GATEWAY ""
  #define SECRET_OPTIONAL_NETMASK ""
#endif
