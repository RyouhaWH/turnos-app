import React, { useEffect, useState } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { parse, format, startOfWeek, getDay } from "date-fns"
import { es } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"

type TurnoTipo = "N" | "M" | "T"

interface Turno {
    Nombre: string
    Fecha: string
    Turno: TurnoTipo
}

interface EventoCalendario {
    title: string
    start: Date
    end: Date
}

const locales = {
    es: es,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
})

const TurnCalendar: React.FC = () => {
    const [eventos, setEventos] = useState<EventoCalendario[]>([])

    useEffect(() => {
        fetch("http://localhost:8000/api/turnos-alerta_movil")
            .then((res) => res.json())
            .then((data: Turno[]) => {
                const eventos: EventoCalendario[] = data
                    .filter((t) => ["N", "M", "T"].includes(t.Turno))
                    .sort((a, b) => {
                        const ordenTurno = { N: 0, M: 1, T: 2 }
                        const diff = ordenTurno[a.Turno as "N" | "M" | "T"] - ordenTurno[b.Turno as "N" | "M" | "T"]
                        return diff !== 0 ? diff : a.Nombre.localeCompare(b.Nombre)
                    })
                    .map((t) => ({
                        title: `${t.Nombre} (${t.Turno})`,
                        start: new Date(t.Fecha),
                        end: new Date(t.Fecha),
                    }))
                setEventos(eventos)
            })
    }, [])

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Calendario de Turnos</h1>
            <Calendar
                localizer={localizer}
                events={eventos}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                views={["month"]}
                popup
                showAllEvents={true}
                messages={{
                    next: "Siguiente",
                    previous: "Anterior",
                    today: "Hoy",
                    month: "Mes",
                    week: "Semana",
                    day: "Día",
                }}
            />
        </div>
    )
}

export default TurnCalendar
