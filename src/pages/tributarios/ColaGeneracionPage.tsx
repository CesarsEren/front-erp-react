import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation } from '@tanstack/react-query'
import { colaGeneracionService } from '@/services/colaGeneracionService'
import { SolicitudGeneracionDto } from '@/types'
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
import { Ban, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

const TIPOS: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota de Crédito',
  '08': 'Nota de Débito',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mensajeError = (error: any, porDefecto: string) =>
  error?.response?.data?.out_mensaje_cliente || error?.response?.data?.out_mensaje_interno || porDefecto

export default function ColaGeneracionPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [seleccionada, setSeleccionada] = useState<SolicitudGeneracionDto | null>(null)
  const { toast } = useToast()

  const { data: solicitudes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cola-generacion'],
    queryFn: async () => (await colaGeneracionService.listar()).out_data ?? [],
    refetchInterval: 10000,
  })

  const quitarMutation = useMutation({
    mutationFn: (s: SolicitudGeneracionDto) => colaGeneracionService.quitar(s.tipoDocumento, s.nro),
    onSuccess: () => {
      toast({ title: 'Quitado de la cola', description: 'Ya no se regenerará automáticamente.' })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: mensajeError(error, 'No se pudo quitar de la cola de generación'),
        variant: 'destructive',
      })
      refetch()
    },
  })

  const handleQuitar = (s: SolicitudGeneracionDto) => {
    setSeleccionada(s)
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Cola de Generación de XML</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprobantes que el sistema está generando o reintentando. Si uno se queda aquí con error,
              quítelo de la cola y regenérelo desde "Envío a Sunat".
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !solicitudes?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay comprobantes pendientes de generación.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nro</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Último error</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((s) => (
                  <TableRow key={`${s.tipoDocumento}-${s.nro}`}>
                    <TableCell>{TIPOS[s.tipoDocumento] ?? s.tipoDocumento}</TableCell>
                    <TableCell>{s.nro}</TableCell>
                    <TableCell>{s.servicio}</TableCell>
                    <TableCell>
                      {s.fechaSolicitud ? format(new Date(s.fechaSolicitud), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell>{s.estado}</TableCell>
                    <TableCell>{s.intento ?? '-'}</TableCell>
                    <TableCell>
                      <span className="block max-w-xs truncate text-xs" title={s.ultimoError ?? ''}>
                        {s.ultimoError || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuitar(s)}
                        disabled={quitarMutation.isPending}
                        title="Quitar de la cola de generación"
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={
          seleccionada
            ? `¿Quitar ${TIPOS[seleccionada.tipoDocumento] ?? seleccionada.tipoDocumento} ${seleccionada.nro} ` +
              'de la cola de generación? El sistema dejará de regenerarlo. El XML ya generado no se borra.'
            : ''
        }
        onConfirm={() => {
          if (seleccionada) quitarMutation.mutate(seleccionada)
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
