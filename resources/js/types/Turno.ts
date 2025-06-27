// src/types/Turno.ts
export interface Turno {
  Nombre: string
  Fecha: string
  Turno: 'N' | 'M' | 'T'
}

export type TurnosAgrupados = {
  [fecha: string]: {
    N: string[]
    M: string[]
    T: string[]
  }
}
