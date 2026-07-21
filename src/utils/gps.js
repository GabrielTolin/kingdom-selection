// Raio máximo permitido para bater o ponto (metros)
export const RAIO_MAXIMO = 200

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

// Obter localização atual do dispositivo.
// Em vez de uma única leitura (que costuma vir imprecisa/desatualizada), acompanha
// a posição durante alguns segundos e devolve a leitura mais precisa que conseguir.
export function obterLocalizacao({ timeout = 12000, precisaoAceitavel = 30 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS não suportado neste dispositivo'))
      return
    }

    let melhor = null
    let watchId = null
    let terminado = false

    const limpar = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      clearTimeout(timer)
    }

    const finalizar = () => {
      if (terminado) return
      terminado = true
      limpar()
      if (melhor) {
        resolve({
          latitude: melhor.coords.latitude,
          longitude: melhor.coords.longitude,
          precisao: melhor.coords.accuracy,
        })
      } else {
        reject(new Error('Não foi possível obter uma localização fiável. Tenta ao ar livre.'))
      }
    }

    const timer = setTimeout(finalizar, timeout)

    watchId = navigator.geolocation.watchPosition(
      pos => {
        // Guarda sempre a leitura com melhor precisão (accuracy mais baixo = melhor)
        if (!melhor || pos.coords.accuracy < melhor.coords.accuracy) melhor = pos
        // Assim que tivermos uma leitura fiável, terminamos mais cedo
        if (pos.coords.accuracy <= precisaoAceitavel) finalizar()
      },
      err => {
        if (terminado) return
        // Se já temos alguma leitura, usamos a melhor em vez de falhar
        if (melhor) return finalizar()
        terminado = true
        limpar()
        if (err.code === 1) reject(new Error('Permissão de localização negada'))
        else if (err.code === 2) reject(new Error('Localização indisponível'))
        else reject(new Error('Tempo esgotado ao obter localização'))
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    )
  })
}

// Distância (em metros) entre a localização atual e a obra. Devolve null se a obra não tem GPS.
export function distanciaAObra(localizacao, obra) {
  if (!obra?.latitude || !obra?.longitude) return null
  return calcularDistancia(
    localizacao.latitude, localizacao.longitude,
    parseFloat(obra.latitude), parseFloat(obra.longitude)
  )
}

// Verificar se está dentro do raio permitido da obra (máximo 200 m por defeito).
// Obra sem coordenadas não pode ser validada — devolve false (o ponto só é permitido na obra).
export function estaDentroDoRaio(localizacao, obra) {
  if (!obra?.latitude || !obra?.longitude) return false
  const distancia = distanciaAObra(localizacao, obra)
  return distancia <= (obra.raio_metros || RAIO_MAXIMO)
}
