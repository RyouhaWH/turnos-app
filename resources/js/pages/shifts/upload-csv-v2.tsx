import React, { useState } from "react"
import { useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

const ImportCSV = () => {
  const [fileName, setFileName] = useState(null)
  const [rowErrors, setRowErrors] = useState([])
  const [progress, setProgress] = useState(0)

  const { data, setData, post, reset } = useForm({
    file: null,
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      setData("file", file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!data.file) {
      toast.error("Debes seleccionar un archivo CSV.")
      return
    }

    setProgress(30)

    post("/upload-csv", {
      forceFormData: true,
      onSuccess: () => {
        toast.success("¡Archivo importado!", {
          description: "Los turnos fueron procesados correctamente.",
        })
        reset()
        setFileName(null)
        setProgress(100)
        setTimeout(() => setProgress(0), 1000)
      },
      onError: (errors) => {
        toast.error("Error al importar", {
          description: errors.file || "Hubo errores en algunas filas.",
        })
        if (errors.rows) {
          setRowErrors(errors.rows)
        }
        setProgress(0)
      },
    })
  }

  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Archivo CSV</Label>
          <Input
            type="file"
            accept=".csv"
            id="file"
            onChange={handleFileChange}
          />
          {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
        </div>

        {progress > 0 && (
          <Progress value={progress} className="transition-all duration-500" />
        )}

        <Button type="submit">Importar</Button>
      </form>

      {rowErrors.length > 0 && (
        <div className="mt-6 border border-destructive rounded-lg p-4">
          <h3 className="font-semibold text-destructive mb-2">Errores en el archivo</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
            {rowErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ImportCSV
