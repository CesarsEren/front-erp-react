import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useMutation } from '@tanstack/react-query'
import { invoicesService } from '@/services/invoicesService'
import { solicitudInvoiceService } from '@/services/solicitudInvoiceService'
import { InvoiceGeneradas } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarIcon, Search, FileText, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tiposDocumento = [
  { codigo: '01', descripcion: 'Factura' },
  { codigo: '03', descripcion: 'Boleta' },
  { codigo: '07', descripcion: 'Nota de Crédito' },
  { codigo: '08', descripcion: 'Nota de Débito' },
]

export default function SearchInvoicesPage() {
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date())
  const [selectedTipos, setSelectedTipos] = useState<string[]>(['01', '03'])
  const [generado, setGenerado] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const { toast } = useToast()

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices', page, pageSize, selectedFecha, selectedTipos, generado],
    queryFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      const response = await invoicesService.getInvoices(page, pageSize, selectedTipos, fechaStr, generado)
      return response.out_data
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (invoice: InvoiceGeneradas) => {
      return solicitudInvoiceService.postGenerarInvoiceIndividual({
        idEncomienda: invoice.nro,
        tipoDocumento: invoice.tipoDocumento,
        tipoServicio: invoice.tipoPago,
      })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Comprobante generado correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al generar el comprobante', variant: 'destructive' })
    },
  })

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      return solicitudInvoiceService.postGenerarInvoiceMasiva({
        fechaEmision: fechaStr,
        tipoDocumento: selectedTipos,
        generado: false,
      })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Comprobantes generados correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al generar los comprobantes', variant: 'destructive' })
    },
  })

  const handleSearch = () => {
    setPage(0)
    refetch()
  }

  const handleTipoChange = (codigo: string, checked: boolean) => {
    if (checked) {
      setSelectedTipos([...selectedTipos, codigo])
    } else {
      setSelectedTipos(selectedTipos.filter((t) => t !== codigo))
    }
  }

  const handleDownload = async (invoice: InvoiceGeneradas, tipo: 'pdf' | 'xml') => {
    try {
      const blob = await invoicesService.downloadLink(
        {
          nroInvoice: invoice.nro,
          tipoDocumento: invoice.tipoDocumento,
          tipoServicio: invoice.tipoPago,
          nombreDocumento: `${invoice.serieNumero}.${tipo}`,
        },
        tipo
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.serieNumero}.${tipo}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: `Error al descargar el ${tipo.toUpperCase()}`, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda de Comprobantes de Pago</CardTitle>
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
              <label className="text-sm font-medium">Tipo de Documento</label>
              <div className="flex gap-4 flex-wrap">
                {tiposDocumento.map((tipo) => (
                  <div key={tipo.codigo} className="flex items-center space-x-2">
                    <Checkbox
                      id={tipo.codigo}
                      checked={selectedTipos.includes(tipo.codigo)}
                      onCheckedChange={(checked) => handleTipoChange(tipo.codigo, checked as boolean)}
                    />
                    <label htmlFor={tipo.codigo} className="text-sm">
                      {tipo.descripcion}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filtros</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generado"
                  checked={generado}
                  onCheckedChange={(checked) => setGenerado(checked as boolean)}
                />
                <label htmlFor="generado" className="text-sm">
                  Solo generados
                </label>
              </div>
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
                    <TableHead>Nro</TableHead>
                    <TableHead>Tipo Doc.</TableHead>
                    <TableHead>Tipo Pago</TableHead>
                    <TableHead>Serie-Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.content?.map((invoice: InvoiceGeneradas) => (
                    <TableRow key={invoice.nro}>
                      <TableCell>{invoice.nro}</TableCell>
                      <TableCell>{invoice.tipoDocumento}</TableCell>
                      <TableCell>{invoice.tipoPago}</TableCell>
                      <TableCell>{invoice.serieNumero}</TableCell>
                      <TableCell>
                        <span className={invoice.generado ? 'badge-generado' : 'badge-no-generado'}>
                          {invoice.generado ? 'Generado' : 'No Generado'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!invoice.generado && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateMutation.mutate(invoice)}
                              disabled={generateMutation.isPending}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.generado && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(invoice, 'pdf')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {invoices && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {invoices.number + 1} de {invoices.totalPages} ({invoices.totalElements} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={invoices.first}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={invoices.last}
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

      {!generado && (
        <div className="flex justify-end">
          <Button onClick={() => generateAllMutation.mutate()} disabled={generateAllMutation.isPending}>
            {generateAllMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Generar Todos
          </Button>
        </div>
      )}
    </div>
  )
}
