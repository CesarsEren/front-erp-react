import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useMutation } from '@tanstack/react-query'
import { grtEncomiendaService } from '@/services/grtEncomiendaService'
import { agenciasService } from '@/services/agenciasService'
import { GrtEncomiendaDto, Agencia } from '@/types'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { CalendarIcon, Search, Download, Loader2, FileText, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import AnularGrtDialog from '@/components/dialogs/AnularGrtDialog'

export default function ReportGrtEncomiendaPage() {
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date())
  const [fechaFin, setFechaFin] = useState<Date>(new Date())
  const [nroEncomienda, setNroEncomienda] = useState('')
  const [nroGuia, setNroGuia] = useState('')
  const [selectedAgencia, setSelectedAgencia] = useState<string>('')
  const [anularDialogOpen, setAnularDialogOpen] = useState(false)
  const [selectedGrt, setSelectedGrt] = useState<GrtEncomiendaDto | null>(null)
  const { toast } = useToast()

  const { data: agencias = [] } = useQuery({
    queryKey: ['agencias'],
    queryFn: async () => {
      const response = await agenciasService.getAgencias()
      return response.out_data || []
    },
  })

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['grt-encomienda', fechaInicio, fechaFin, nroEncomienda, nroGuia, selectedAgencia],
    queryFn: async () => {
      const response = await grtEncomiendaService.getGrtEncomiendas(
        format(fechaInicio, 'yyyy-MM-dd'),
        format(fechaFin, 'yyyy-MM-dd'),
        nroEncomienda || null,
        nroGuia || null,
        selectedAgencia || null
      )
      return response.out_data || []
    },
    enabled: false,
  })

  const handleSearch = () => {
    refetch()
  }

  const handleExportCsv = () => {
    if (!reportData || reportData.length === 0) return

    const headers = ['Nro', 'Encomienda', 'GRT', 'Destino', 'Agencia', 'Fecha Emisión', 'Estado Gen.', 'Estado SUNAT']
    const rows = reportData.map((item: GrtEncomiendaDto) => [
      item.nro,
      item.encomienda,
      item.grt || '-',
      item.destinoD,
      item.agenciaD,
      item.fechaEmision,
      item.estadoGeneracion === 2 ? 'Generado' : 'No Generado',
      item.estadoSunat === 2 ? 'Aceptado' : item.estadoSunat === 3 ? 'Rechazado' : 'Pendiente',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-grt-encomienda-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async (item: GrtEncomiendaDto) => {
    try {
      const response = await api.post('/download-grt/pdf/0', {
        nroGuia: item.nro || '',
        nombreDocumento: item.grt || ''
      }, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.encomienda}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar PDF:', error)
    }
  }

  const anularMutation = useMutation({
    mutationFn: async ({ nroGuia, motivoAnulado }: { nroGuia: number; motivoAnulado: string }) => {
      return grtEncomiendaService.anularGrt(nroGuia, motivoAnulado)
    },
    onSuccess: (response) => {
      if (response.out_estado === 200) {
        toast({ title: 'Éxito', description: 'GRT anulado correctamente' })
        setAnularDialogOpen(false)
        setSelectedGrt(null)
        refetch()
      } else {
        toast({
          title: 'Error',
          description: response.out_mensaje_cliente || response.out_mensaje_interno || 'Error al anular el GRT',
          variant: 'destructive'
        })
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.out_mensaje_cliente ||
        error.response?.data?.out_mensaje_interno ||
        'Error al anular el GRT'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    },
  })

  const handleAnularGrt = (item: GrtEncomiendaDto) => {
    setSelectedGrt(item)
    setAnularDialogOpen(true)
  }

  const handleConfirmAnular = async (motivoAnulado: string) => {
    if (selectedGrt && selectedGrt.nro) {
      await anularMutation.mutateAsync({
        nroGuia: selectedGrt.nro,
        motivoAnulado,
      })
    }
  }

  const getBadgeClass = (estado: number) => {
    switch (estado) {
      case 2:
        return 'badge-generado'
      case 3:
        return 'badge-error'
      default:
        return 'badge-no-generado'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reporte GRT - Encomienda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaInicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? format(fechaInicio, 'PPP', { locale: es }) : 'Seleccione fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={(date) => date && setFechaInicio(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaFin && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFin ? format(fechaFin, 'PPP', { locale: es }) : 'Seleccione fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={(date) => date && setFechaFin(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agencia</label>
              <Select value={selectedAgencia} onValueChange={setSelectedAgencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las agencias" />
                </SelectTrigger>
                <SelectContent>
                  {agencias.map((agencia: Agencia) => (
                    <SelectItem key={agencia.codigo} value={agencia.codigo}>
                      {agencia.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nro Encomienda</label>
              <Input
                placeholder="Ingrese (F001-01-0000074)"
                value={nroEncomienda}
                onChange={(e) => setNroEncomienda(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nro Guía</label>
              <Input
                placeholder="Ingrese (V001-31-00002178)"
                value={nroGuia}
                onChange={(e) => setNroGuia(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleExportCsv} disabled={!reportData?.length}>
                <Download className="mr-2 h-4 w-4" />
                CSV
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nro</TableHead>
                  <TableHead>Encomienda</TableHead>
                  <TableHead>GRT</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Estado Gen.</TableHead>
                  <TableHead>Estado SUNAT</TableHead>
                  <TableHead>Encomienda Anulada</TableHead>
                  <TableHead>GRT Anulado</TableHead>
                  <TableHead>Acciones</TableHead>
                  <TableHead>Anular</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.map((item: GrtEncomiendaDto, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.nro}</TableCell>
                    <TableCell>{item.encomienda}</TableCell>
                    <TableCell>{item.grt || '-'}</TableCell>
                    <TableCell>{item.destinoD}</TableCell>
                    <TableCell>{item.agenciaD}</TableCell>
                    <TableCell>{item.fechaEmision}</TableCell>
                    <TableCell>
                      <span className={getBadgeClass(item.estadoGeneracion)}>
                        {item.estadoGeneracion === 2 ? 'Generado' : 'No Generado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getBadgeClass(item.estadoSunat)}>
                        {item.estadoSunat === 2 ? 'Aceptado' : item.estadoSunat === 3 ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.encomiendaAnulado === '1' ? 'badge-error' : item.encomiendaAnulado === '0' ? 'badge-gray' : ''}>
                        {item.encomiendaAnulado === '1' ? 'Anulado' : item.encomiendaAnulado === '0' ? 'No' : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.grtAnulado ? 'badge-error' : 'badge-gray'}>
                        {item.grtAnulado ? 'Anulado' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(item)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Descargar PDF
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnularGrt(item)}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Anular GRT
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData || reportData.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      No se encontraron resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedGrt && (
        <AnularGrtDialog
          open={anularDialogOpen}
          onOpenChange={setAnularDialogOpen}
          nroGuia={selectedGrt.nro || 0}
          encomienda={selectedGrt.encomienda}
          onConfirm={handleConfirmAnular}
          isLoading={anularMutation.isPending}
        />
      )}
    </div>
  )
}
