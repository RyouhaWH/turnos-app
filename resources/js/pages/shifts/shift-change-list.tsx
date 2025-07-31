'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type TurnoTipo = "M" | "T" | "N";

export interface CambiosPorFecha {
  [fecha: string]: TurnoTipo;
}

export interface CambiosPorFuncionario {
  [nombreCompleto: string]: CambiosPorFecha;
}

interface Props {
  cambios: CambiosPorFuncionario;
  onActualizar?: (comentario: string) => void; // ← permite pasar el comentario al handler
  isProcesing: boolean;
}

const ListaCambios: React.FC<Props> = ({ cambios, onActualizar, isProcesing }) => {
  const [comentario, setComentario] = useState("");

  const formatNombre = (nombreCrudo: string) => {
    const limpio = nombreCrudo.replace(/_/g, " ").trim();
    const partes = limpio.split(" ");

    const capitalizado = partes
      .slice(0, 2)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");

    return capitalizado;
  };

  const renderCambios = () => {
    return Object.entries(cambios).map(([nombre, turnosPorFecha]) => {
      const fechasOrdenadas = Object.entries(turnosPorFecha).sort(
        ([fechaA], [fechaB]) => new Date(fechaA).getTime() - new Date(fechaB).getTime()
      );

      return (
        <div key={nombre} className="mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {formatNombre(nombre)}
          </div>
          <ul className="ml-6 mt-1 list-disc text-sm text-muted-foreground">
            {fechasOrdenadas.map(([fecha, turno]) => (
              <li key={fecha}>
                <span className="font-medium">{fecha}:</span> Turno <span className="uppercase">{turno}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const handleClickActualizar = () => {
    console.log(comentario)
    if (onActualizar) {
      onActualizar(comentario);
      setComentario(""); // limpia después de enviar
    }
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-base">Cambios realizados</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 overflow-y-auto">
        {Object.keys(cambios).length === 0 ? (
          <p className="text-muted-foreground">No hay cambios todavía.</p>
        ) : (
          renderCambios()
        )}
      </CardContent>

      {/* Campo de Comentario */}
      {/* <div className="px-4 pb-2">
        <Label htmlFor="comentario">Comentario</Label>
        <Textarea
          id="comentario"
          placeholder="Describe brevemente el motivo del cambio de turnos (visible en el historial)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div> */}

      <div className="p-4 border-t">
        <Button
          onClick={handleClickActualizar}
          className="w-full"
          disabled={Object.keys(cambios).length === 0 || isProcesing}
        >
          Actualizar cambios
        </Button>
      </div>
    </Card>
  );
};

export default ListaCambios;
