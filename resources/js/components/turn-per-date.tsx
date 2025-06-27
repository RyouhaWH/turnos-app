import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type TurnoTipo = "N" | "M" | "T"

interface Turno {
  Nombre: string
  Fecha: string
  Turno: TurnoTipo
}

type TurnosAgrupados = {
  [K in TurnoTipo]: string[]
}

const TurnPerDate: React.FC = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })

  const [agrupados, setAgrupados] = useState<TurnosAgrupados>({
    N: [],
    M: [],
    T: [],
  })

  useEffect(() => {
    fetch("http://localhost:8000/api/turnos-alerta_movil")
      .then((res) => res.json())
      .then((data: Turno[]) => {
        const filtrados = data.filter(
          (t) => t.Fecha === fechaSeleccionada && ["N", "M", "T"].includes(t.Turno)
        )

        const porTurno: TurnosAgrupados = { N: [], M: [], T: [] }

        filtrados.forEach((t) => {
          porTurno[t.Turno].push(t.Nombre)
        })

        setAgrupados(porTurno)
      })
  }, [fechaSeleccionada])

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
      <h1 className="text-2xl font-bold">Patrullas por fecha</h1>

      <div>
        <label className="text-sm font-medium block mb-1">Selecciona fecha:</label>
        <Input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="w-fit"
        />
      </div>

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

export default TurnPerDate
