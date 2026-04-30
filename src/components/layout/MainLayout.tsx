import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { environment } from '@/config/environment'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  X,
  Truck,
  Send,
  Search,
  FileText,
  User,
  LogOut,
} from 'lucide-react'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({
    to,
    icon: Icon,
    children,
  }: {
    to: string
    icon: React.ElementType
    children: React.ReactNode
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
        )
      }
      onClick={() => setSidebarOpen(false)}
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  )

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center p-4">
        <img
          src={environment.logo}
          alt="Logo"
          className="h-16 w-auto object-contain"
        />
      </div>
      <Separator />
      <div className="p-4 text-center">
        <strong className="text-sm">{environment.companyName}</strong>
      </div>
      <Separator />

      <nav className="flex-1 space-y-1 p-4">
        <Accordion type="multiple" defaultValue={['administrativos', 'tributarios', 'reportes']}>
          <AccordionItem value="administrativos" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2 text-sm">
              Comprobantes Administrativos
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="space-y-1 pl-2">
                <NavItem to="/main/grt-generacion" icon={Truck}>
                  Manifiestos (GRT)
                </NavItem>
                <NavItem to="/main/grt-send" icon={Send}>
                  Envío a Sunat
                </NavItem>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tributarios" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2 text-sm">
              Comprobantes de Pago
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="space-y-1 pl-2">
                <NavItem to="/main/tributarios/search" icon={Search}>
                  Búsqueda de Comprobantes
                </NavItem>
                <NavItem to="/main/tributarios/send" icon={Send}>
                  Envío a Sunat
                </NavItem>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reportes" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2 text-sm">
              Reportes
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="space-y-1 pl-2">
                <NavItem to="/main/reportes/grt-encomienda" icon={FileText}>
                  Reportes GRT-Encomienda
                </NavItem>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground shadow-lg">
            <div className="flex items-center justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-primary px-4 text-primary-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-primary-foreground hover:bg-primary/90"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <span className="font-semibold">{environment.companyName}</span>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm hidden sm:inline">{user?.out_usuario}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary/90"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>Perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
