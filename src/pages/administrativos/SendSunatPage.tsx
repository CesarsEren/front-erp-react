import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useMutation } from '@tanstack/react-query'
import { guiasStateService } from '@/services/guiasStateService'
import { guiasService } from '@/services/guiasService'
import { GrtStateDto } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarIcon, Search, Send, Download, Undo2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

const estados = [
  { codigo: 0, descripcion: 'Pendientes de Envío' },
  { codigo: 2, descripcion: 'Comprobantes Aceptados' },
  { codigo: 3, descripcion: 'Comprobantes con Errores' },
]

export default function SendSunatPage() {
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date())
  const [selectedEstado, setSelectedEstado] = useState<string>('0')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState('')
  const { toast } = useToast()

  const { data: guias, isLoading, refetch } = useQuery({
    queryKey: ['guias-state', page, pageSize, selectedFecha, selectedEstado],
    queryFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      const response = await guiasStateService.getGuiasRemisionEnlazadas(
        page,
        pageSize,
        fechaStr,
        parseInt(selectedEstado)
      )
      return response.out_data
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (grt: GrtStateDto) => {
      return guiasStateService.sendGuia({
        nroGuia: grt.nroGuia+'',
        nombreDocumento: `GRT-${grt.serieNumeroGuia}`,
      })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Guía enviada correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al enviar la guía', variant: 'destructive' })
    },
  })

  const sendAllMutation = useMutation({
    mutationFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      return guiasStateService.sendAllGuia({ fechaemision: fechaStr })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Guías enviadas correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al enviar las guías', variant: 'destructive' })
    },
  })

  const volverPorEnviarMutation = useMutation({
    mutationFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      return guiasStateService.volverAEstadoPorEnviar({ fechaemision: fechaStr })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Guías devueltas a estado Por Enviar correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al devolver las guías a estado Por Enviar', variant: 'destructive' })
    },
  })

  const handleSearch = () => {
    setPage(0)
    refetch()
  }

  const handleSendGrt = (grt: GrtStateDto) => {
    setConfirmMessage(`¿Desea enviar la guía ${grt.serieNumeroGuia} a SUNAT?`)
    setConfirmAction(() => () => sendMutation.mutate(grt))
    setConfirmOpen(true)
  }

  const handleSendAll = () => {
    setConfirmMessage('¿Desea enviar todas las guías pendientes a SUNAT?')
    setConfirmAction(() => () => sendAllMutation.mutate())
    setConfirmOpen(true)
  }

  const handleVolverPorEnviar = () => {
    setConfirmMessage('¿Desea devolver todas las guías con errores a estado Por Enviar?')
    setConfirmAction(() => () => volverPorEnviarMutation.mutate())
    setConfirmOpen(true)
  }

  const handleDownloadCdr = async (grt: GrtStateDto) => {
    try {
      const blob = await guiasService.downloadLink(
        { nroGuia: grt.nroGuia+'', nombreDocumento: `CDR-${grt.serieNumeroGuia}` },
        'cdr'
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CDR-${grt.serieNumeroGuia}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: 'Error al descargar el CDR', variant: 'destructive' })
    }
  }

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case 'ACEPTADO':
        return 'badge-generado'
      case 'RECHAZADO':
        return 'badge-error'
      case 'POR_ENVIAR':
        return 'badge-por-enviar'
      default:
        return 'badge-en-proceso'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Envío de GRT a SUNAT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedFecha && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedFecha ? format(selectedFecha, 'PPP', { locale: es }) : 'Seleccione fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedFecha}
                    onSelect={(date) => date && setSelectedFecha(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado.codigo} value={estado.codigo.toString()}>
                      {estado.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nro Guía</TableHead>
                    <TableHead>Serie-Número</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Respuesta SUNAT</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guias?.content?.map((grt: GrtStateDto) => (
                    <TableRow key={grt.nroGuia}>
                      <TableCell>{grt.nroGuia}</TableCell>
                      <TableCell>{grt.serieNumeroGuia}</TableCell>
                      <TableCell>{grt.ticket || '-'}</TableCell>
                      <TableCell className="max-w-md whitespace-normal text-sm">{grt.respuestaSunat || '-'}</TableCell>
                      <TableCell>
                        <span className={getBadgeClass(grt.sunatState)}>
                          {grt.sunatStateD}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {selectedEstado === '0' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendGrt(grt)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {selectedEstado === '2' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCdr(grt)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {guias && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {guias.number + 1} de {guias.totalPages} ({guias.totalElements} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={guias.first}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={guias.last}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedEstado === '0' && (
        <div className="flex justify-end">
          <Button onClick={handleSendAll} disabled={sendAllMutation.isPending}>
            {sendAllMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Todos
          </Button>
        </div>
      )}

      {selectedEstado === '3' && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleVolverPorEnviar}
            disabled={volverPorEnviarMutation.isPending}
          >
            {volverPorEnviarMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="mr-2 h-4 w-4" />
            )}
            Volver a Estado Por Enviar
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => {
          confirmAction()
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
