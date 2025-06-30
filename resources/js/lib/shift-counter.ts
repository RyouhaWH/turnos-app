type TurnoResumen = {
  [turno: string]: number
}

const contarTurnos = (datos: any[]): Record<string, number> => {
  const conteo: Record<string, number> = {}

  for (const fila of datos) {
    for (const key in fila) {
      if (key === 'nombre' || key === 'id') continue

      const valor = (fila[key] || '').toUpperCase().trim()

      if (!valor) continue

      if (!conteo[valor]) {
        conteo[valor] = 0
      }

      conteo[valor] += 1
    }
  }

  return conteo
}

