type TurnoResumen = {
  [turno: string]: number
}

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
}

const contarTurnos = (datos: TurnoData[]): TurnoResumen => {
  const conteo: TurnoResumen = {}
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

export default contarTurnos

