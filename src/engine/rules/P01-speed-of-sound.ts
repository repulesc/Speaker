/**
 * P01 · Speed of sound (🔴 physics). Sources: [KUT], [EVP].
 * c = 331.3 · sqrt(1 + T/273.15) m/s, T in °C. Humidity ignored (< 0.5 % at room conditions).
 */
export function speedOfSound(temperatureC: number): number {
  return 331.3 * Math.sqrt(1 + temperatureC / 273.15);
}
