import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

type TurnoTipo = "N" | "M" | "T"

interface Turno {
  Nombre: string
  Fecha: string
  Turno: TurnoTipo
}

type TurnosAgrupados = {
  [K in TurnoTipo]: string[]
}

const TurnColumn: React.FC = () => {
  const [agrupados, setAgrupados] = useState<TurnosAgrupados>({
    N: [],
    M: [],
    T: [],
  })

  useEffect(() => {
    fetch("http://localhost:8000/api/turnos")
      .then((res) => res.json())
      .then((data: Turno[]) => {
        const hoy = new Date().toISOString().split("T")[0]

        const filtrados = data.filter((t) => t.Fecha === hoy && ["N", "M", "T"].includes(t.Turno))

        const porTurno: TurnosAgrupados = { N: [], M: [], T: [] }

        filtrados.forEach((t) => {
          porTurno[t.Turno].push(t.Nombre)
        })

        setAgrupados(porTurno)
      })
  }, [])

  const turnosOrdenados: TurnoTipo[] = ["N", "M", "T"]

  const nombreTurno = {
    N: "Noche",
    M: "Mañana",
    T: "Tarde",
  }

  const iconoTurno = {
    N: "🕘",
    M: "🌅",
    T: "🌇",
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Patrullas de hoy</h1>

      {turnosOrdenados.map((tipo) => (
        <Card key={tipo}>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">
              {iconoTurno[tipo]} Turno {nombreTurno[tipo]} ({agrupados[tipo].length})
            </h2>
            {agrupados[tipo].length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {agrupados[tipo].map((nombre, idx) => (
                  <li key={idx}>{nombre}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin asignaciones</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TurnColumn
