import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import axios from "axios"

type Log = {
  id: number
  old_shift: string
  new_shift: string
  changed_at: string
  comment: string | null
  user?: { name: string }
}

export default function History({ employeeShiftId }: { employeeShiftId: number }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    const res = await axios.get(`/api/turnos/${employeeShiftId}/historial`)
    setLogs(res.data)
  }

  const revertTo = async (logId: number) => {
    setLoading(true)
    await axios.post(`/api/turnos/${employeeShiftId}/revertir`, { log_id: logId })
    await fetchLogs()
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [employeeShiftId])

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Historial de cambios</h2>
        <ScrollArea className="h-[400px] pr-2">
          {logs.map((log) => (
            <div key={log.id} className="mb-4 border-b pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p><strong>De:</strong> {log.old_shift} → <strong>A:</strong> {log.new_shift}</p>
                  <p className="text-sm text-gray-500">{format(new Date(log.changed_at), "dd/MM/yyyy HH:mm")}</p>
                  {log.user?.name && <p className="text-sm">Por: {log.user.name}</p>}
                  {log.comment && <p className="text-sm italic text-gray-600">"{log.comment}"</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => revertTo(log.id)}
                >
                  Revertir
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
