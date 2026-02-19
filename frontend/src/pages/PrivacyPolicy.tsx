import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Shield, Lock, Database, Share2, Cookie, Scale, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 1, title: 'Responsable del tratamiento', icon: Shield, content: 'CONSTRUCTODO («nosotros», «la plataforma») es la responsable del tratamiento de los datos personales que recogemos a través del sitio web y la aplicación en constructodo.tech. Si tienes preguntas sobre esta política, puedes contactarnos a través de los medios indicados en la plataforma.' },
  { id: 2, title: 'Datos que recogemos', icon: Database, content: null, list: [
    { label: 'Datos de cuenta', text: 'correo electrónico, nombre, contraseña (encriptada) y, si usas inicio de sesión con Google, el identificador y datos de perfil que Google comparte.' },
    { label: 'Perfil', text: 'tipo de usuario (cliente o profesional), nombre completo, teléfono/WhatsApp, documento de identidad, biografía, servicios ofrecidos (profesionales) e imagen de perfil.' },
    { label: 'Proyectos y cotizaciones', text: 'descripción de proyectos, presupuestos, ofertas, estados y archivos que subas.' },
    { label: 'Comunicación', text: 'mensajes en el chat de la plataforma vinculados a cada proyecto.' },
    { label: 'Pagos y transacciones', text: 'información necesaria para procesar pagos, métodos de pago y retiros (por ejemplo PayPal, Payoneer o datos bancarios según corresponda).' },
    { label: 'Uso técnico', text: 'dirección IP, tipo de navegador, páginas visitadas y tiempos de uso para el correcto funcionamiento y la seguridad del servicio.' },
  ]},
  { id: 3, title: 'Finalidad del tratamiento', icon: Lock, content: 'Utilizamos tus datos para: crear y gestionar tu cuenta; poner en contacto a clientes y profesionales; gestionar proyectos, cotizaciones, pagos y garantías; ofrecer soporte y resolver incidencias; enviar comunicaciones necesarias del servicio; mejorar la plataforma y la seguridad; y cumplir obligaciones legales. No vendemos tus datos personales a terceros para marketing.' },
  { id: 4, title: 'Base legal y conservación', icon: Scale, content: 'El tratamiento se basa en la ejecución del contrato (uso de la plataforma), tu consentimiento cuando lo exija la ley (por ejemplo, envío de comunicaciones comerciales) y el legítimo interés (seguridad, mejora del servicio). Conservamos los datos mientras mantengas la cuenta activa y, tras la baja, durante el tiempo necesario para reclamaciones, obligaciones legales o contables.' },
  { id: 5, title: 'Compartir datos con terceros', icon: Share2, content: 'Podemos compartir datos con: proveedores que nos ayudan a operar (hosting, correo, análisis); procesadores de pago para transacciones; Google (inicio de sesión con Google, según su política de privacidad); y autoridades cuando la ley lo exija. No vendemos ni alquilamos tus datos personales.' },
  { id: 6, title: 'Cookies y tecnologías similares', icon: Cookie, content: 'Utilizamos cookies y almacenamiento local para el funcionamiento de la sesión, preferencias y seguridad. Puedes configurar tu navegador para limitar o bloquear cookies; algunas funciones de la plataforma podrían verse afectadas.' },
  { id: 7, title: 'Tus derechos', icon: Scale, content: 'Puedes acceder, rectificar, suprimir o limitar el tratamiento de tus datos, oponerte a determinados tratamientos y, cuando corresponda, solicitar la portabilidad. Para ejercer estos derechos o presentar una reclamación, contacta con nosotros o con la autoridad de protección de datos de tu país.' },
  { id: 8, title: 'Seguridad', icon: ShieldCheck, content: 'Aplicamos medidas técnicas y organizativas para proteger tus datos (incluido el cifrado de contraseñas y el uso de HTTPS). Ningún sistema es infalible; te pedimos que mantengas tu contraseña en secreto y nos avises de cualquier uso no autorizado.' },
  { id: 9, title: 'Cambios', icon: RefreshCw, content: 'Podemos actualizar esta política de privacidad. La fecha de «Última actualización» se modificará y, si los cambios son relevantes, te lo indicaremos en la plataforma o por correo. El uso continuado del servicio tras los cambios implica la aceptación de la nueva versión.' },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 rounded-lg px-1 -ml-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">CONSTRUCTODO</span>
          </Link>
          <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 pb-20">
        {/* Hero */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-700 px-4 py-1.5 text-xs font-medium tracking-wide mb-6">
            <Shield className="w-3.5 h-3.5" />
            Documento legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Última actualización: Febrero 2026
          </p>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            {sections.map(({ id, title, icon: Icon, content, list }) => (
              <section key={id} className="relative pl-8 sm:pl-10 border-l-2 border-amber-500/30 border-solid first:pt-0">
                <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3 tracking-tight">
                  {id}. {title}
                </h2>
                {content && (
                  <p className="text-slate-600 text-[15px] leading-relaxed">
                    {content}
                  </p>
                )}
                {list && (
                  <ul className="space-y-3 mt-2">
                    {list.map((item, i) => (
                      <li key={i} className="flex gap-3 text-[15px] text-slate-600 leading-relaxed">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" aria-hidden />
                        <span>
                          <strong className="text-slate-800 font-medium">{item.label}:</strong> {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200" asChild>
            <Link to="/" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700" asChild>
            <Link to="/terms-of-service">Ver Términos de Servicio</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
