import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { manifiestoService } from '@/services/manifiestoService'
import { agenciasService } from '@/services/agenciasService'
import { Agencia, Manifiesto } from '@/types'
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
import { CalendarIcon, Search, Eye, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import GrtsDialog from '@/components/dialogs/GrtsDialog'
import SolicitudGrtDialog from '@/components/dialogs/SolicitudGrtDialog'

export default function GuiaRemisionPage() {
  const [selectedAgencia, setSelectedAgencia] = useState<string>('')
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date())
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [grtsDialogOpen, setGrtsDialogOpen] = useState(false)
  const [solicitudDialogOpen, setSolicitudDialogOpen] = useState(false)
  const [selectedManifiesto, setSelectedManifiesto] = useState<Manifiesto | null>(null)

  const { data: agencias = [] } = useQuery({
    queryKey: ['agencias'],
    queryFn: async () => {
      const response = await agenciasService.getAgencias()
      return response.out_data || []
    },
  })

  useEffect(() => {
    if (agencias.length > 0 && !selectedAgencia) {
      setSelectedAgencia(agencias[0].codigo)
    }
  }, [agencias, selectedAgencia])

  const { data: manifiestos, isLoading, refetch } = useQuery({
    queryKey: ['manifiestos', page, pageSize, selectedAgencia, selectedFecha],
    queryFn: async () => {
      const fechaStr = format(selectedFecha, 'yyyy-MM-dd')
      const response = await manifiestoService.getManifiestos(page, pageSize, selectedAgencia, fechaStr)
      return response.out_data
    },
    enabled: !!selectedAgencia,
  })

  const handleSearch = () => {
    setPage(0)
    refetch()
  }

  const handleVerGrts = (manifiesto: Manifiesto) => {
    setSelectedManifiesto(manifiesto)
    setGrtsDialogOpen(true)
  }

  const handleSolicitudGrt = (manifiesto: Manifiesto) => {
    setSelectedManifiesto(manifiesto)
    setSolicitudDialogOpen(true)
  }

  const getBadgeClass = (generado: number) => {
    switch (generado) {
      case 0:
        return 'badge-no-generado'
      case 2:
        return 'badge-en-proceso'
      case 1:
        return 'badge-generado'
      default:
        return 'badge-no-generado'
    }
  }

  const getEstadoText = (generado: number) => {
    switch (generado) {
      case 0:
        return 'No Generado'
      case 2:
        return 'En Proceso'
      case 1:
        return 'Generado'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manifiestos - Guías de Remisión Transportista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agencia</label>
              <Select value={selectedAgencia} onValueChange={setSelectedAgencia}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione agencia" />
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
                    <TableHead>ID</TableHead>
                    <TableHead>Agencia</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Bultos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manifiestos?.content?.map((manifiesto: Manifiesto) => (
                    <TableRow key={manifiesto.id}>
                      <TableCell>{manifiesto.id}</TableCell>
                      <TableCell>{manifiesto.agencia}</TableCell>
                      <TableCell>{manifiesto.bus}</TableCell>
                      <TableCell>{manifiesto.destino}</TableCell>
                      <TableCell>{manifiesto.fecha}</TableCell>
                      <TableCell>{manifiesto.servicioD}</TableCell>
                      <TableCell>{manifiesto.cantidadb}</TableCell>
                      <TableCell>
                        <span className={getBadgeClass(manifiesto.generado)}>
                          {getEstadoText(manifiesto.generado)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerGrts(manifiesto)}
                            disabled={manifiesto.generado === 0}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSolicitudGrt(manifiesto)}
                            disabled={manifiesto.generado !== 0}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {manifiestos && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {manifiestos.number + 1} de {manifiestos.totalPages} ({manifiestos.totalElements} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={manifiestos.first}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={manifiestos.last}
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

      {selectedManifiesto && (
        <>
          <GrtsDialog
            open={grtsDialogOpen}
            onOpenChange={setGrtsDialogOpen}
            manifiesto={selectedManifiesto}
          />
          <SolicitudGrtDialog
            open={solicitudDialogOpen}
            onOpenChange={setSolicitudDialogOpen}
            manifiesto={selectedManifiesto}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  )
}
