export interface ApiResponse<T> {
  out_data: T
  out_mensaje_interno: string
  out_mensaje_cliente: string
  out_estado: number
}

export interface Token {
  out_token: string
  out_usuario: string
  out_mensaje: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
  pageable: Pageable
  sort: Sort
  numberOfElements: number
}

export interface Pageable {
  sort: Sort
  pageNumber: number
  pageSize: number
  offset: number
  paged: boolean
  unpaged: boolean
}

export interface Sort {
  sorted: boolean
  unsorted: boolean
  empty: boolean
}

export interface Agencia {
  codigo: string
  descripcion: string
}

export interface Manifiesto {
  id: number
  agencia: string
  bus: string
  destino: string
  fecha: string
  servicio: string
  servicioD: string
  cantidadb: number
  generado: number
}

export interface Conductores {
  nombreConductor: string
  licenciaConductor: string
}

export interface Encomiendas {
  id: number
  nro: string
  serienumero: string
  destinod: string
  consignado: string
  remitente: string
  nrobultos: string
  pesototal: string
  costototal: string
  domiciliado: boolean
  domicilio: string
  descripcion: string
  cantidadBultos: number
  pesoTotal: number
}

export interface ProgramacionDto {
  nro: string
  destinod: string
  agenciaOrigen: string
  direccionAgenciaOrigen: string | null
  nroBus: string
  placaBus: string
  marcaBus: string
  conductores: Conductores[]
}

export interface GrtGeneradas {
  nro: number
  nroGuia: number
  serieNumeroEncomienda: string
  serieNumeroGuia: string
  fechaEmision: string
  destinatario: string
  link_pdf: string
  link_xml: string
  generado: boolean
}

export interface GrtStateDto {
  nroGuia: number
  nroEncomienda: number
  serieNumeroGuia: string
  respuestaGeneracion: string
  ticket: string
  respuestaSunat: string
  sunatState: string
  sunatStateD: string
  xmlGenerado: boolean
}

export interface InvoiceGeneradas {
  nro: number
  tipoDocumento: string
  tipoPago: string
  serieNumero: string
  link_pdf: string
  link_xml: string
  generado: boolean
  enviado: number
}

export interface InvoiceStateDto {
  nroInvoice: number
  nroEncomienda: number
  tipoDocumento: string
  servicio: string
  serieNumeroInvoice: string
  respuestaGeneracion: string
  ticket: string
  xmlGenerado: boolean
  sunatState: string
  sunatStateD: string
}

export interface GrtEncomiendaDto {
  estadoGeneracion: number
  nro: number | null
  destinoD: string
  anulado: string
  agenciaD: string
  fechaEmision: string
  nroEncomienda: number | null
  salida: number
  encomienda: string
  estadoSunat: number
  nroAperturas: number
  grt: string | null
  encomiendaAnulado: string | null
  grtAnulado: boolean | null
}

export interface RequestFile {
  nroGuia: string
  nombreDocumento: string
}

export interface RequestFileInvoice {
  nroInvoice: number
  tipoDocumento: string
  tipoServicio: string
  nombreDocumento: string
}

export interface RequestAllGuia {
  fechaemision: string
}

export interface SolicitudGrt {
  idManifiesto: number
}

export interface SolicitudGrtIndividual {
  idManifiesto: number
  idGuiaRemisionTransportista: number
}

export interface SolicitudInvoiceIndividual {
  idEncomienda: number
  tipoDocumento: string
  tipoServicio: string
}

export interface SolicitudAllInvoicesDto {
  fechaEmision: string
  tipoDocumento: string[]
  generado: boolean
}

export interface ResponseGrt {
  id: number
  idManifiesto: number
  generado: number
  fecha_solicitud: string
}

export type PageManifiesto = PageResponse<Manifiesto>
export type PageEncomienda = PageResponse<Encomiendas>
export type PageGrtGeneradas = PageResponse<GrtGeneradas>
export type PageGrtSunat = PageResponse<GrtStateDto>
export type PageInvoices = PageResponse<InvoiceGeneradas>
export type PageInvoiceSunat = PageResponse<InvoiceStateDto>
