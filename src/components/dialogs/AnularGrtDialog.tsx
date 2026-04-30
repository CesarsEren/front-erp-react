import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface AnularGrtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nroGuia: number
  encomienda: string
  onConfirm: (motivoAnulado: string) => Promise<void>
  isLoading?: boolean
}

export default function AnularGrtDialog({
  open,
  onOpenChange,
  nroGuia,
  encomienda,
  onConfirm,
  isLoading = false,
}: AnularGrtDialogProps) {
  const [motivoAnulado, setMotivoAnulado] = useState('')

  const handleSubmit = async () => {
    if (!motivoAnulado.trim()) {
      return
    }
    await onConfirm(motivoAnulado)
    setMotivoAnulado('')
  }

  const handleClose = () => {
    setMotivoAnulado('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular GRT</DialogTitle>
          <DialogDescription>
            Encomienda: {encomienda} - Nro Guía: {nroGuia}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de Anulación *</Label>
            <Input
              id="motivo"
              placeholder="Ingrese el motivo de anulación"
              value={motivoAnulado}
              onChange={(e) => setMotivoAnulado(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!motivoAnulado.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Anulando...
              </>
            ) : (
              'Anular'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
