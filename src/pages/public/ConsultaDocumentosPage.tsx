import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Search, FileText, Loader2 } from 'lucide-react'
import { documentosService, DocumentoDatos } from '@/services/documentosService'
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
  { codigo: '03', descripcion: 'BOLETA / ENCOMIENDA CARGA' },
  { codigo: '07', descripcion: 'NOTA CRÉDITO' },
  { codigo: '08', descripcion: 'NOTA DÉBITO' },
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
  const [consultaRealizada, setConsultaRealizada] = useState(false)
  const [loadingRuc, setLoadingRuc] = useState(false)
  const [documentoDatos, setDocumentoDatos] = useState<DocumentoDatos | null>(null)

  // Consultar razón social cuando RUC tiene 11 caracteres
  useEffect(() => {
    const consultarRazonSocial = async () => {
      if (ruc.length === 11 && tipoDocumento !== '03') {
        setLoadingRuc(true)
        try {
          const response = await documentosService.consultarContribuyente(ruc)
          if (response) {
            setRazonSocial(response.razon)
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

  // Limpiar RUC y razón social cuando se selecciona Boleta (03)
  useEffect(() => {
    if (tipoDocumento === '03') {
      setRuc('')
      setRazonSocial('')
    }
  }, [tipoDocumento])

  const handleConsultar = async () => {
    if (!serie || !numero || !tipoDocumento) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete Serie, Número y Tipo Documento',
        variant: 'destructive',
      })
      return
    }

    // RUC es requerido para documentos que no son Boleta (03)
    if (tipoDocumento !== '03' && !ruc) {
      toast({
        title: 'RUC requerido',
        description: 'Por favor ingrese el RUC del cliente',
        variant: 'destructive',
      })
      return
    }

    try {
      const datos = await documentosService.obtenerDatosDocumento({
        fecha: format(fecha, 'yyyy-MM-dd'),
        empresa: '001',
        serie,
        numero,
        tipoDocumento,
        ruc: tipoDocumento !== '03' ? ruc : undefined,
        monto: monto ? parseFloat(monto) : undefined,
      })
      
      setDocumentoDatos(datos)
      setConsultaRealizada(true)
      
      toast({
        title: 'Documento encontrado',
        description: `${datos.tipoDocumentoD} ${datos.documentoElectronico}`,
      })
    } catch (error) {
      setDocumentoDatos(null)
      setConsultaRealizada(true)
      toast({
        title: 'Documento no encontrado',
        description: 'No se encontró el documento con los datos proporcionados',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadPdf = async (formatoSeleccionado: 'A4' | 'TICKET') => {
    if (!documentoDatos) return
    
    try {
      const blob = await documentosService.generarPdfPost({
        fecha: format(fecha, 'yyyy-MM-dd'),
        empresa: '001',
        serie,
        numero,
        tipoDocumento,
        ruc: tipoDocumento !== '03' ? ruc : undefined,
        razon: razonSocial || undefined,
        monto: monto ? parseFloat(monto) : undefined,
        formato: formatoSeleccionado,
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${documentoDatos.documentoElectronico}_${formatoSeleccionado}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Descarga exitosa',
        description: `PDF en formato ${formatoSeleccionado} descargado`,
      })
    } catch (error) {
      toast({
        title: 'Error al descargar',
        description: 'No se pudo generar el PDF',
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
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Search className="mr-2 h-4 w-4" />
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
              {/* RUC - Solo visible cuando NO es Boleta (03) */}
              {tipoDocumento !== '03' && (
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

              {/* Razón Social - Solo visible cuando NO es Boleta (03) */}
              {tipoDocumento !== '03' && (
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
              <div className={cn("space-y-2", tipoDocumento === '03' && "md:col-span-3")}>
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

            {/* Resultados de la consulta */}
            {consultaRealizada && documentoDatos && (
              <div className="space-y-4">
                {/* Información del documento */}
                <div className="border rounded-lg p-6 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Tipo de Documento</Label>
                      <p className="font-semibold">{documentoDatos.tipoDocumentoD}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Número de Documento</Label>
                      <p className="font-semibold">{documentoDatos.documentoElectronico}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Emisión</Label>
                      <p className="font-semibold">{documentoDatos.fechaEmisionD}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cliente</Label>
                      <p className="font-semibold">{documentoDatos.razonCliente}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">RUC/DNI</Label>
                      <p className="font-semibold">{documentoDatos.numeroDocumentoCliente}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total</Label>
                      <p className="font-semibold text-lg">{documentoDatos.simboloMoneda}{(documentoDatos.total ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Monto en letras */}
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground">Monto en Letras</Label>
                    <p className="font-semibold">{documentoDatos.montoLetras}</p>
                  </div>
                </div>

                {/* Tabla de items */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-accent">
                        <TableHead className="text-accent-foreground font-semibold">#</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">Descripción</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">Cantidad</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">P. Unit.</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">Valor Venta</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">IGV</TableHead>
                        <TableHead className="text-accent-foreground font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentoDatos.items?.map((item) => (
                        <TableRow key={item.numeroOrden}>
                          <TableCell>{item.numeroOrden}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.cantidad ?? 0}</TableCell>
                          <TableCell>{documentoDatos.simboloMoneda}{(item.precioUnitario ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{documentoDatos.simboloMoneda}{(item.valorVenta ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{documentoDatos.simboloMoneda}{(item.igv ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">{documentoDatos.simboloMoneda}{(item.total ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted font-semibold">
                        <TableCell colSpan={4} className="text-right">SUBTOTAL:</TableCell>
                        <TableCell>{documentoDatos.simboloMoneda}{(documentoDatos.totalSinIGV ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{documentoDatos.simboloMoneda}{(documentoDatos.igv ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{documentoDatos.simboloMoneda}{(documentoDatos.total ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Botones de descarga */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDownloadPdf('A4')}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    DESCARGAR PDF A4
                  </Button>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleDownloadPdf('TICKET')}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    DESCARGAR PDF TICKET
                  </Button>
                </div>
              </div>
            )}

            {/* Mensaje cuando no se encuentra el documento */}
            {consultaRealizada && !documentoDatos && (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground text-lg">No se encontró el documento solicitado</p>
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
