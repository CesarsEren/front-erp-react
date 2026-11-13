import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useMutation } from '@tanstack/react-query'
import { invoicesService } from '@/services/invoicesService'
import { solicitudInvoiceService } from '@/services/solicitudInvoiceService'
import { colaGeneracionService } from '@/services/colaGeneracionService'
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
import { CalendarIcon, Search, FileText, Loader2,FileCode, SquareCode, RefreshCw, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

const tiposDocumento = [
  { codigo: '01', descripcion: 'Factura' },
  { codigo: '03', descripcion: 'Boleta' },
  { codigo: '07', descripcion: 'Nota de Crédito' },
  { codigo: '08', descripcion: 'Nota de Débito' },
]

// Estado de envío a SUNAT (enviado): mismos códigos en facturas, boletas, NC y ND.
const estadosSunat: Record<number, { texto: string; clase: string }> = {
  0: { texto: 'Por enviar', clase: 'badge-por-enviar' },
  1: { texto: 'En proceso', clase: 'badge-en-proceso' },
  2: { texto: 'Aceptado', clase: 'badge-aceptado' },
  3: { texto: 'Exception', clase: 'badge-error' },
  4: { texto: 'Reintentos superados', clase: 'badge-error' },
  5: { texto: 'Por verificar', clase: 'badge-en-proceso' },
}
// Código de empresa del módulo de PDF (igual que la consulta pública)
const EMPRESA_PDF = '001'
const ESTADO_EN_PROCESO = 1
const ESTADO_ACEPTADO = 2
const ESTADO_POR_VERIFICAR = 5

// Ni aceptado ni en pleno envío: se puede generar (o regenerar) uno a uno.
// Las boletas no: van por resumen diario y se generan con "Generar Todos".
const puedeGenerarse = (invoice: InvoiceGeneradas) =>
  invoice.tipoDocumento !== '03' &&
  invoice.enviado !== ESTADO_ACEPTADO &&
  invoice.enviado !== ESTADO_EN_PROCESO

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mensajeError = (error: any, porDefecto: string) =>
  error?.response?.data?.out_mensaje_cliente || error?.response?.data?.out_mensaje_interno || porDefecto

export default function SearchInvoicesPage() {
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date())
  const [selectedTipos, setSelectedTipos] = useState<string[]>(['01', '03'])
  const [generado, setGenerado] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [porRegenerar, setPorRegenerar] = useState<InvoiceGeneradas | null>(null)
  const { toast } = useToast()

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices', page, pageSize, selectedFecha, selectedTipos, generado],
    queryFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      const response = await invoicesService.getInvoices(page, pageSize, selectedTipos, fechaStr, generado)
      return response.out_data
    },
  })

/*  const generateMutation = useMutation({
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
  })*/

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

  const regenerarMutation = useMutation({
    mutationFn: async (invoice: InvoiceGeneradas) => {
      return colaGeneracionService.regenerar({
        nroInvoice: invoice.nro,
        tipoDocumento: invoice.tipoDocumento,
        // En facturas el tipo de pago distingue encomienda (contado) de canje (crédito)
        tipoServicio: invoice.tipoPago === 'Credito' ? 'C' : 'E',
        nombreDocumento: invoice.serieNumero,
      })
    },
    onSuccess: (_data, invoice) => {
      toast({
        title: invoice.generado ? 'XML regenerado' : 'XML generado',
        description: `${invoice.serieNumero} quedó "Por enviar". Envíelo desde Envío a Sunat.`,
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'No se pudo generar',
        description: mensajeError(error, 'Error al generar el XML'),
        variant: 'destructive',
      })
      refetch()
    },
  })

  const mensajeRegenerar = (invoice: InvoiceGeneradas) =>
    (invoice.generado
      ? `¿Regenerar el XML de ${invoice.serieNumero}? Se reemplaza el XML anterior y el comprobante `
      : `¿Generar el XML de ${invoice.serieNumero}? El comprobante `) +
    'queda "Por enviar".' +
    (invoice.enviado === ESTADO_POR_VERIFICAR
      ? ' IMPORTANTE: primero confirme en SUNAT que el comprobante NO existe. ' +
        'Si SUNAT ya lo tiene, no lo regenere: envíelo desde Envío a Sunat y quedará aceptado.'
      : '')

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

  const handleDownload = async (invoice: InvoiceGeneradas, tipo: 'pdf' | 'xml' | 'zip' | 'cdr') => {
    try {
      const blob = await invoicesService.downloadLink(
        {
          nroInvoice: invoice.nro,
          tipoDocumento: invoice.tipoDocumento,
          tipoServicio: invoice.tipoPago,
          nombreDocumento: `${invoice.serieNumero}.${tipo}`,
        },
        tipo + '/0'
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // El CDR de SUNAT es un ZIP (R-<serie-número>.zip), no un archivo .cdr
      a.download = tipo === 'cdr' ? `R-${invoice.serieNumero}.zip` : `${invoice.serieNumero}.${tipo}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: `Error al descargar el ${tipo.toUpperCase()}`, variant: 'destructive' })
    }
  }

  // PDF a demanda (A4 / Ticket) generado por back-erp, distinto del PDF que devolvió la API de generación del XML.
  // serieNumero viene como SERIE-TIPODOC-NUMERO (p. ej. F004-01-0000031).
  const [pdfEnCurso, setPdfEnCurso] = useState<string | null>(null)
  const handlePdfFormato = async (invoice: InvoiceGeneradas, formato: 'A4' | 'TICKET') => {
    const partes = invoice.serieNumero.split('-')
    const serie = partes[0]
    const numero = Number(partes[partes.length - 1])
    if (partes.length < 3 || !serie || Number.isNaN(numero)) {
      toast({ title: 'Error', description: `No se pudo leer la serie y el número de ${invoice.serieNumero}`, variant: 'destructive' })
      return
    }
    const clave = `${invoice.tipoDocumento}-${invoice.tipoPago}-${invoice.nro}-${formato}`
    setPdfEnCurso(clave)
    try {
      const blob = await invoicesService.generarPdf({
        fecha: format(selectedFecha, 'yyyy-MM-dd'),
        empresa: EMPRESA_PDF,
        serie,
        numero,
        tipoDocumento: invoice.tipoDocumento,
        // Crédito = canje (C); contado = encomienda (E), que usa el ticket de encomienda
        tipoServicio: invoice.tipoPago === 'Credito' ? 'C' : 'E',
        formato,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.serieNumero}_${formato}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: `No se pudo generar el PDF ${formato === 'A4' ? 'A4' : 'Ticket'} de ${invoice.serieNumero}`, variant: 'destructive' })
    } finally {
      setPdfEnCurso(null)
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
                    <TableHead>Estado Interno</TableHead>
                    <TableHead>Estado Sunat</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.content?.map((invoice: InvoiceGeneradas) => (
                    <TableRow key={`${invoice.tipoDocumento}-${invoice.tipoPago}-${invoice.nro}`}>
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
                        <span className={estadosSunat[invoice.enviado]?.clase ?? 'badge-error'}>
                          {estadosSunat[invoice.enviado]?.texto ?? `Estado ${invoice.enviado}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">

                          {invoice.generado && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Descargar PDF"
                                onClick={() => handleDownload(invoice, 'pdf')}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {(['A4', 'TICKET'] as const).map((formato) => {
                                const clave = `${invoice.tipoDocumento}-${invoice.tipoPago}-${invoice.nro}-${formato}`
                                return (
                                  <Button
                                    key={formato}
                                    variant="outline"
                                    size="sm"
                                    title={formato === 'A4' ? 'Descargar PDF A4' : 'Descargar PDF Ticket'}
                                    onClick={() => handlePdfFormato(invoice, formato)}
                                    disabled={pdfEnCurso === clave}
                                  >
                                    {pdfEnCurso === clave ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : formato === 'A4' ? (
                                      <>A4</>
                                    ) : (
                                      <Receipt className="h-4 w-4" />
                                    )}
                                  </Button>
                                )
                              })}
                            </>
                          )}
                          {
                            invoice.generado && (
                              <Button
                                variant="outline"
                                title="Descargar XML"
                                size="sm"
                                onClick={() => handleDownload(invoice, 'zip')}
                              >
                                <FileCode className="h-4 w-4" />
                              </Button>
                            )
                          }
                          {
                            invoice.generado && invoice.enviado === 2 && (
                              <Button
                                variant={'outline'}
                                title='Descargar Cdr'
                                size={'sm'}
                                onClick={() => handleDownload(invoice, 'cdr')}
                              >
                                <SquareCode className="h-4 w-4" />
                              </Button>
                            )
                          }
                          {puedeGenerarse(invoice) && (
                            <Button
                              variant="outline"
                              size="sm"
                              title={invoice.generado ? 'Volver a generar el XML (no fue aceptado por SUNAT)' : 'Generar el XML'}
                              onClick={() => setPorRegenerar(invoice)}
                              disabled={regenerarMutation.isPending}
                            >
                              {regenerarMutation.isPending && regenerarMutation.variables === invoice ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1 h-4 w-4" />
                              )}
                              {invoice.generado ? 'Regenerar' : 'Generar'}
                            </Button>
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

      <ConfirmDialog
        open={porRegenerar !== null}
        onOpenChange={(open) => !open && setPorRegenerar(null)}
        message={porRegenerar ? mensajeRegenerar(porRegenerar) : ''}
        onConfirm={() => {
          if (porRegenerar) regenerarMutation.mutate(porRegenerar)
          setPorRegenerar(null)
        }}
      />
    </div>
  )
}
