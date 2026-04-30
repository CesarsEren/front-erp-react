import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useMutation } from '@tanstack/react-query'
import { invoicesStateService } from '@/services/invoicesStateService'
import { InvoiceStateDto } from '@/types'
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
import { CalendarIcon, Search, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

const estados = [
  { codigo: 0, descripcion: 'Pendientes de Envío' },
  { codigo: 2, descripcion: 'Comprobantes Aceptados' },
  { codigo: 3, descripcion: 'Comprobantes con Errores' },
]

export default function SendSunatTributariosPage() {
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date())
  const [selectedEstado, setSelectedEstado] = useState<string>('0')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState('')
  const { toast } = useToast()

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices-state', page, pageSize, selectedFecha, selectedEstado],
    queryFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      const response = await invoicesStateService.getInvoicesState(
        page,
        pageSize,
        fechaStr,
        parseInt(selectedEstado)
      )
      return response.out_data
    },
  })

  // Angular: POST /sunat-tributarios/send/invoice con body RequestFileInvoice
  const sendMutation = useMutation({
    mutationFn: async (invoice: InvoiceStateDto) => {
      return invoicesStateService.sendInvoice({
        nroInvoice: invoice.nroInvoice,
        tipoDocumento: invoice.tipoDocumento,
        tipoServicio: invoice.servicio,
        nombreDocumento: `${invoice.tipoDocumento}-${invoice.serieNumeroInvoice}`,
      })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Comprobante enviado correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al enviar el comprobante', variant: 'destructive' })
    },
  })

  // Angular: POST /sunat-tributarios/send/invoice/all con body RequestAllGuia { fechaemision: string }
  const sendAllMutation = useMutation({
    mutationFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      return invoicesStateService.sendAllCpes({ fechaemision: fechaStr })
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Comprobantes enviados correctamente' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al enviar los comprobantes', variant: 'destructive' })
    },
  })

  const handleSearch = () => {
    setPage(0)
    refetch()
  }

  const handleSendInvoice = (invoice: InvoiceStateDto) => {
    setConfirmMessage(`¿Desea enviar el comprobante ${invoice.serieNumeroInvoice} a SUNAT?`)
    setConfirmAction(() => () => sendMutation.mutate(invoice))
    setConfirmOpen(true)
  }

  const handleSendAll = () => {
    setConfirmMessage('¿Desea enviar todos los comprobantes pendientes a SUNAT?')
    setConfirmAction(() => () => sendAllMutation.mutate())
    setConfirmOpen(true)
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
          <CardTitle>Envío de Comprobantes a SUNAT</CardTitle>
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
                    <TableHead>Nro</TableHead>
                    <TableHead>Tipo Doc.</TableHead>
                    <TableHead>Serie-Número</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.content?.map((invoice: InvoiceStateDto) => (
                    <TableRow key={invoice.nroInvoice}>
                      <TableCell>{invoice.nroInvoice}</TableCell>
                      <TableCell>{invoice.tipoDocumento}</TableCell>
                      <TableCell>{invoice.serieNumeroInvoice}</TableCell>
                      <TableCell>{invoice.ticket || '-'}</TableCell>
                      <TableCell>
                        <span className={getBadgeClass(invoice.sunatState)}>
                          {invoice.sunatStateD}
                        </span>
                      </TableCell>
                      <TableCell>
                        {selectedEstado === '0' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
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
