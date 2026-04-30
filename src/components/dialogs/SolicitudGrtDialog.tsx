import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { solicitudGrtService } from '@/services/solicitudGrtService'
import { encomiendasService } from '@/services/encomiendasService'
import { programacionService } from '@/services/programacionService'
import { Manifiesto, Encomiendas } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import ConfirmDialog from './ConfirmDialog'

interface SolicitudGrtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manifiesto: Manifiesto
  onSuccess: () => void
}

export default function SolicitudGrtDialog({
  open,
  onOpenChange,
  manifiesto,
  onSuccess,
}: SolicitudGrtDialogProps) {
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(5)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fechaActual = format(new Date(), 'dd-MM-yyyy')

  // Obtener datos de programación (conductores, vehículo, etc.)
  const { data: programacion, isLoading: loadingProgramacion } = useQuery({
    queryKey: ['programacion', manifiesto.id],
    queryFn: async () => {
      const response = await programacionService.getConductores(manifiesto.id)
      return response.out_data
    },
    enabled: open,
  })

  // Obtener encomiendas enlazadas
  const { data: encomiendasData, isLoading: loadingEncomiendas } = useQuery({
    queryKey: ['encomiendas', manifiesto.id, page, pageSize],
    queryFn: async () => {
      const response = await encomiendasService.getEncomiendas(page, pageSize, manifiesto.id)
      return response.out_data
    },
    enabled: open,
  })

  // Angular usa POST /solicitudgrt con body { idManifiesto: number }
  const generateMutation = useMutation({
    mutationFn: async () => {
      return solicitudGrtService.postSolicitud({
        idManifiesto: manifiesto.id,
      })
    },
    onSuccess: (data) => {
      toast({ title: 'Éxito', description: data.out_mensaje_interno || 'Solicitud de GRT enviada correctamente' })
      onOpenChange(false)
      onSuccess()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al generar las GRTs', variant: 'destructive' })
    },
  })

  const handleConfirmGenerate = () => {
    setConfirmOpen(true)
  }

  const handleGenerate = () => {
    setConfirmOpen(false)
    generateMutation.mutate()
  }

  const isLoading = loadingProgramacion || loadingEncomiendas
  const encomiendas = encomiendasData?.content || []
  const totalItems = encomiendasData?.totalElements || 0
  const totalPages = encomiendasData?.totalPages || 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Solicitud de Generación de Guía Remisión Transportista</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Datos informativos en formato compacto horizontal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Destino</span>
                  <span className="font-medium">{programacion?.destinod || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Agencia Origen</span>
                  <span className="font-medium">{programacion?.agenciaOrigen || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Fecha emisión</span>
                  <span className="font-medium">{fechaActual}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Dirección</span>
                  <span className="font-medium truncate block" title={programacion?.direccionAgenciaOrigen || ''}>{programacion?.direccionAgenciaOrigen || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Vehículo</span>
                  <span className="font-medium">{programacion?.marcaBus || '-'} - {programacion?.placaBus || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Nro Bus</span>
                  <span className="font-medium">{programacion?.nroBus || '-'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-xs text-muted-foreground block">Conductor(es)</span>
                  <span className="font-medium">
                    {programacion?.conductores?.map(c => c.nombreConductor).join(' | ') || '-'}
                  </span>
                </div>
              </div>

              {/* Tabla de encomiendas - Prioridad visual */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Encomiendas Enlazadas</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="overflow-auto max-h-[45vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Nro</TableHead>
                          <TableHead className="w-28">Serie-Número</TableHead>
                          <TableHead className="w-16">Destino</TableHead>
                          <TableHead>Remitente</TableHead>
                          <TableHead>Consignado</TableHead>
                          <TableHead className="w-28">¿Domiciliado?</TableHead>
                          <TableHead className="w-14 text-right">Bultos</TableHead>
                          <TableHead className="w-16 text-right">Peso</TableHead>
                          <TableHead className="w-20 text-right">Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {encomiendas.map((encomienda: Encomiendas) => (
                          <TableRow key={encomienda.nro}>
                            <TableCell className="font-medium">{encomienda.nro}</TableCell>
                            <TableCell className="text-xs">{encomienda.serienumero}</TableCell>
                            <TableCell className="text-xs">{encomienda.destinod}</TableCell>
                            <TableCell className="max-w-[140px] truncate text-xs" title={encomienda.remitente}>
                              {encomienda.remitente}
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate text-xs" title={encomienda.consignado}>
                              {encomienda.consignado}
                            </TableCell>
                            <TableCell className="text-xs">
                              {encomienda.domiciliado ? 'Sí' : 'No'}
                            </TableCell>
                            <TableCell className="text-right">{encomienda.nrobultos}</TableCell>
                            <TableCell className="text-right text-xs">{encomienda.pesototal}</TableCell>
                            <TableCell className="text-right text-xs">{encomienda.costototal}</TableCell>
                          </TableRow>
                        ))}
                        {encomiendas.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              No hay encomiendas enlazadas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages || 1} ({totalItems} registros)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1 || totalPages === 0}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button
              onClick={handleConfirmGenerate}
              disabled={generateMutation.isPending || isLoading}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar GRTs'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message="¿Iniciamos con la generación masiva de GRT?"
        onConfirm={handleGenerate}
      />
    </>
  )
}
