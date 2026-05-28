import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { guiasService } from '@/services/guiasService'
import { solicitudGrtService } from '@/services/solicitudGrtService'
import { Manifiesto, GrtGeneradas } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from './ConfirmDialog'

interface GrtsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manifiesto: Manifiesto
}

export default function GrtsDialog({
  open,
  onOpenChange,
  manifiesto,
}: GrtsDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(5)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAllPdfOpen, setConfirmAllPdfOpen] = useState(false)
  const [regeneratingGrt, setRegeneratingGrt] = useState<number | null>(null)

  const { data: grtsData, isLoading, refetch } = useQuery({
    queryKey: ['grts-manifiesto', manifiesto.id, page, pageSize],
    queryFn: async () => {
      const response = await guiasService.getGuiasRemisionEnlazadas(page, pageSize, manifiesto.id)
      return response.out_data
    },
    enabled: open,
  })

  // Regenerar todas las GRTs
  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      return solicitudGrtService.postSolicitud({ idManifiesto: manifiesto.id })
    },
    onSuccess: (data) => {
      toast({ title: 'Éxito', description: data.out_mensaje_interno || 'Solicitud de regeneración enviada' })
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['grts-manifiesto'] })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al regenerar las GRTs', variant: 'destructive' })
    },
  })

  // Regenerar GRT individual
  const regenerateIndividualMutation = useMutation({
    mutationFn: async ({ nro }: { nro: number; serieNumero: string }) => {
      return solicitudGrtService.postGenerarGrtIndividual({
        idManifiesto: manifiesto.id,
        idGuiaRemisionTransportista: nro,
      })
    },
    onSuccess: (_data, variables) => {
      toast({ title: 'Éxito', description: `GRT ${variables.serieNumero} regenerado correctamente` })
      setRegeneratingGrt(null)
      refetch()
    },
    onError: (error: unknown, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast({ title: 'Error', description: `Error al regenerar GRT ${variables.serieNumero}: ${errorMessage}`, variant: 'destructive' })
      setRegeneratingGrt(null)
    },
  })

  const handleDownloadPdf = async (grt: GrtGeneradas) => {
    try {
      const blob = await guiasService.downloadLink(
        { nroGuia: grt.nro.toString(), nombreDocumento: grt.serieNumeroGuia },
        grt.link_pdf
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${grt.serieNumeroGuia}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: 'Error al descargar el PDF', variant: 'destructive' })
    }
  }

  const handleDownloadXml = async (grt: GrtGeneradas) => {
    try {
      const blob = await guiasService.downloadLink(
        { nroGuia: grt.nro.toString(), nombreDocumento: grt.serieNumeroGuia },
        grt.link_xml
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${grt.serieNumeroGuia}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: 'Error al descargar el XML', variant: 'destructive' })
    }
  }

  const handleDownloadAllPdf = async () => {
    setConfirmAllPdfOpen(false)
    try {
      const blob = await guiasService.getGuiaRemisionEnlazadasPdf(manifiesto.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Guías_Remisiones_Total-${manifiesto.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error', description: 'Error al descargar los PDFs', variant: 'destructive' })
    }
  }

  const handleRegenerateIndividual = (grt: GrtGeneradas) => {
    setRegeneratingGrt(grt.nro)
    regenerateIndividualMutation.mutate({ nro: grt.nro, serieNumero: grt.serieNumeroGuia })
  }

  const handleRegenerateAll = () => {
    setConfirmOpen(false)
    regenerateAllMutation.mutate()
  }

  const grts = grtsData?.content || []
  const totalItems = grtsData?.totalElements || 0
  const totalPages = grtsData?.totalPages || 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Guías de Remisión Transportista Generadas
            </DialogTitle>
          </DialogHeader>

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
                    <TableHead>Encomienda</TableHead>
                    <TableHead>Guía Remisión Transportista</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        PDF
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmAllPdfOpen(true)}
                          title="Descargar todos los PDFs"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>XML</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grts.map((grt: GrtGeneradas) => (
                    <TableRow key={grt.nro}>
                      <TableCell>{grt.nro}</TableCell>
                      <TableCell>{grt.serieNumeroEncomienda}</TableCell>
                      <TableCell>{grt.serieNumeroGuia}</TableCell>
                      <TableCell>
                        {grt.generado ? (
                          <span className="badge-generado">Generado</span>
                        ) : (
                          <span className="badge-no-generado">Sin Generar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(grt)}
                          disabled={!grt.generado}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadXml(grt)}
                          disabled={!grt.generado}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateIndividual(grt)}
                          disabled={regeneratingGrt === grt.nro}
                        >
                          {regeneratingGrt === grt.nro ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Regenerar GRT
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {grts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay GRTs generadas para este manifiesto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages} ({totalItems} registros)
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
                      disabled={page >= totalPages - 1}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={regenerateAllMutation.isPending}
            >
              {regenerateAllMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerando...
                </>
              ) : (
                'Regenerar Todos'
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message="¿Desea generar nuevas GRTS? Solo se regenerarán las que no hayan sido aceptadas por SUNAT"
        onConfirm={handleRegenerateAll}
      />

      <ConfirmDialog
        open={confirmAllPdfOpen}
        onOpenChange={setConfirmAllPdfOpen}
        message="¿Desea descargar el total de GRTs en formato PDF? Esto tomará un tiempo, todos los PDFs se unificarán en uno solo listo para imprimir."
        onConfirm={handleDownloadAllPdf}
      />
    </>
  )
}
