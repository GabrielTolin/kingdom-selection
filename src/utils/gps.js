// Calcular distância entre dois pontos GPS em metros (fórmula Haversine)
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000 // raio da Terra em metros
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Obter localização atual do dispositivo
export function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS não suportado neste dispositivo'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precisao: pos.coords.accuracy,
      }),
      err => {
        if (err.code === 1) reject(new Error('Permissão de localização negada'))
        else if (err.code === 2) reject(new Error('Localização indisponível'))
        else reject(new Error('Tempo esgotado ao obter localização'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

// Verificar se está dentro do raio da obra
export function estaDentroDoRaio(localizacao, obra) {
  if (!obra.latitude || !obra.longitude) return true // sem GPS configurado, permite sempre
  const distancia = calcularDistancia(
    localizacao.latitude, localizacao.longitude,
    parseFloat(obra.latitude), parseFloat(obra.longitude)
  )
  return distancia <= (obra.raio_metros || 200)
}