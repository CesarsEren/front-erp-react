import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Search, FileText, FileCode, Download, Loader2 } from 'lucide-react'
import { documentosService, DocumentoElectronico, ConsultaDocumentoRequest } from '@/services/documentosService'
import { environment } from '@/config/environment'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const TIPOS_DOCUMENTO = [
  { codigo: '01', descripcion: 'FACTURA / ENCOMIENDA CARGA' },
  { codigo: '02', descripcion: 'BOLETA / ENCOMIENDA CARGA' },
  { codigo: '05', descripcion: 'NOTA CRÉDITO' },
  { codigo: '06', descripcion: 'NOTA DÉBITO' },
]

export default function ConsultaDocumentosPage() {
  useTheme()
  const { toast } = useToast()
  
  const [fecha, setFecha] = useState<Date>(new Date())
  const [serie, setSerie] = useState('')
  const [numero, setNumero] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [ruc, setRuc] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [monto, setMonto] = useState('')
  const [documentos, setDocumentos] = useState<DocumentoElectronico[]>([])
  const [consultaRealizada, setConsultaRealizada] = useState(false)
  const [loadingRuc, setLoadingRuc] = useState(false)

  // Consultar razón social cuando RUC tiene 11 caracteres
  useEffect(() => {
    const consultarRazonSocial = async () => {
      if (ruc.length === 11 && tipoDocumento !== '02') {
        setLoadingRuc(true)
        try {
          const response = await documentosService.consultarContribuyente(ruc)
          if (response.out_data) {
            setRazonSocial(response.out_data.razonSocial)
          }
        } catch {
          setRazonSocial('')
          toast({
            title: 'RUC no encontrado',
            description: 'No se pudo obtener la razón social',
            variant: 'destructive',
          })
        } finally {
          setLoadingRuc(false)
        }
      }
    }
    consultarRazonSocial()
  }, [ruc, tipoDocumento, toast])

  // Limpiar RUC y razón social cuando se selecciona Boleta (02)
  useEffect(() => {
    if (tipoDocumento === '02') {
      setRuc('')
      setRazonSocial('')
    }
  }, [tipoDocumento])

  const consultaMutation = useMutation({
    mutationFn: async (request: ConsultaDocumentoRequest) => {
      return documentosService.consultarDocumento(request)
    },
    onSuccess: (data) => {
      setDocumentos(data.out_data || [])
      setConsultaRealizada(true)
      if (!data.out_data || data.out_data.length === 0) {
        toast({
          title: 'Sin resultados',
          description: 'No se encontraron documentos con los criterios especificados',
        })
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al consultar el documento',
        variant: 'destructive',
      })
    },
  })

  const handleConsultar = () => {
    if (!serie || !numero || !tipoDocumento) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete Serie, Número y Tipo Documento',
        variant: 'destructive',
      })
      return
    }

    // RUC es requerido para documentos que no son Boleta (02)
    if (tipoDocumento !== '02' && !ruc) {
      toast({
        title: 'RUC requerido',
        description: 'Por favor ingrese el RUC del cliente',
        variant: 'destructive',
      })
      return
    }

    consultaMutation.mutate({
      fecha: format(fecha, 'yyyy-MM-dd'),
      empresa: environment.companyName || '',
      serie,
      numero,
      tipoDocumento,
      ruc: tipoDocumento !== '02' ? ruc : undefined,
      monto: monto ? parseFloat(monto) : undefined,
    })
  }

  const handleDownload = (url: string, type: string) => {
    if (url) {
      window.open(url, '_blank')
    } else {
      toast({
        title: 'No disponible',
        description: `El archivo ${type} no está disponible`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header con logo y nombre de empresa */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {environment.logo && (
            <img 
              src={environment.logo} 
              alt={environment.companyName} 
              className="h-12 object-contain"
            />
          )}
          <h1 className="text-xl font-semibold">{environment.companyName}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-primary">
              CONSULTA DOCUMENTOS ELECTRÓNICOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros de búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Fecha */}
              <div className="md:col-span-3 space-y-2">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fecha && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, 'dd/MM/yyyy', { locale: es }) : 'Seleccione fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(date) => date && setFecha(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Empresa (solo lectura) */}
              <div className="md:col-span-4 space-y-2">
                <Label>Empresa</Label>
                <Input 
                  value={environment.companyName || ''} 
                  readOnly 
                  className="bg-muted"
                />
              </div>

              {/* Botón Consultar */}
              <div className="md:col-span-5 flex justify-end">
                <Button 
                  onClick={handleConsultar}
                  disabled={consultaMutation.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {consultaMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  CONSULTAR DOCUMENTO
                </Button>
              </div>
            </div>

            {/* Segunda fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Serie */}
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input 
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder="F004"
                />
              </div>

              {/* Número */}
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input 
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="0000076"
                />
              </div>

              {/* Tipo Documento */}
              <div className="space-y-2">
                <Label>Tipo Documento</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.codigo} value={tipo.codigo}>
                        {tipo.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tercera fila de filtros: RUC, Razón Social, Monto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RUC - Solo visible cuando NO es Boleta (02) */}
              {tipoDocumento !== '02' && (
                <div className="space-y-2">
                  <Label>Ruc</Label>
                  <div className="relative">
                    <Input 
                      value={ruc}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setRuc(value)
                        if (value.length < 11) {
                          setRazonSocial('')
                        }
                      }}
                      placeholder="20527551154"
                      maxLength={11}
                    />
                    {loadingRuc && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              )}

              {/* Razón Social - Solo visible cuando NO es Boleta (02) */}
              {tipoDocumento !== '02' && (
                <div className="space-y-2">
                  <Label>Razon</Label>
                  <Input 
                    value={razonSocial}
                    readOnly
                    className="bg-muted"
                    placeholder="Se autocompleta con el RUC"
                  />
                </div>
              )}

              {/* Monto */}
              <div className={cn("space-y-2", tipoDocumento === '02' && "md:col-span-3")}>
                <Label>Monto</Label>
                <Input 
                  value={monto}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    setMonto(value)
                  }}
                  placeholder="455.02"
                  type="text"
                />
              </div>
            </div>

            {/* Tabla de resultados */}
            {consultaRealizada && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-accent">
                      <TableHead className="text-accent-foreground font-semibold">Fecha Emision</TableHead>
                      <TableHead className="text-accent-foreground font-semibold">Documento</TableHead>
                      <TableHead className="text-accent-foreground font-semibold">Agencia</TableHead>
                      <TableHead className="text-accent-foreground font-semibold">Descargar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell>{doc.fechaEmision}</TableCell>
                        <TableCell>{doc.documento}</TableCell>
                        <TableCell>{doc.agencia}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleDownload(doc.linkXml, 'XML')}
                            >
                              <FileCode className="h-4 w-4 mr-1" />
                              XML
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                              onClick={() => handleDownload(doc.linkCdr, 'CDR')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              CDR
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDownload(doc.linkPdf, 'PDF')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              PDF TICKET
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documentos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No se encontraron documentos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {environment.companyName} - Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}
