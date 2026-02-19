import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, FileText, CheckCircle, Briefcase, UserPlus, AlertTriangle, CreditCard, Copyright, Scale, LogOut, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 1, title: 'Aceptación de los términos', icon: CheckCircle, content: 'Al acceder o utilizar la plataforma CONSTRUCTODO («la plataforma», «el servicio») en constructodo.tech, aceptas estos Términos de Servicio y nuestra Política de Privacidad. Si no estás de acuerdo, no uses el servicio. El servicio está dirigido a usuarios en territorios donde su uso sea legal.' },
  { id: 2, title: 'Descripción del servicio', icon: Briefcase, content: 'CONSTRUCTODO es una plataforma que conecta a clientes que buscan realizar proyectos de construcción o reformas con profesionales que ofrecen cotizaciones y servicios. La plataforma facilita la publicación de proyectos, el envío y la gestión de cotizaciones, la comunicación entre las partes, el pago con garantía (incluida la comisión de garantía del 4,5% sobre la cotización) y la valoración de profesionales. No somos parte del contrato entre cliente y profesional; actuamos como intermediario tecnológico y de garantía según lo descrito en la plataforma.' },
  { id: 3, title: 'Registro y cuenta', icon: UserPlus, content: 'Debes registrarte con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de toda la actividad en tu cuenta. Debes tener al menos la edad mínima legal en tu jurisdicción para contratar. Al registrarte como profesional, declaras tener la capacidad legal y, si aplica, las licencias o permisos necesarios para prestar los servicios ofrecidos.' },
  { id: 4, title: 'Uso aceptable', icon: AlertTriangle, content: null, list: [
    'Usar la plataforma para fines fraudulentos, ilegales o que infrinjan derechos de terceros.',
    'Suplantar identidad o proporcionar información falsa.',
    'Eludir pagos, comisiones o la garantía ofrecida por la plataforma.',
    'Realizar transacciones fuera de la plataforma para evitar las condiciones y comisiones de CONSTRUCTODO.',
    'Dañar, sobrecargar o interferir en el funcionamiento del servicio o de las cuentas de otros usuarios.',
    'Extraer datos de otros usuarios de forma masiva o no autorizada.',
  ], footer: 'El incumplimiento puede dar lugar a la suspensión o cierre de la cuenta y, en su caso, a acciones legales.' },
  { id: 5, title: 'Proyectos, cotizaciones y pagos', icon: CreditCard, content: 'Los proyectos publicados y las cotizaciones enviadas deben ser reales y vinculantes según lo que indiques en la plataforma. Los pagos entre cliente y profesional se gestionan según las reglas de la plataforma (incluido el depósito en garantía y la liberación de fondos). Las comisiones (por ejemplo, 4,5% para clientes sobre la cotización y 10% para profesionales sobre el pago recibido) se aplican según lo publicado en el sitio. Es responsabilidad de cada parte cumplir con sus obligaciones fiscales y legales en su país.' },
  { id: 6, title: 'Contenido y propiedad intelectual', icon: Copyright, content: 'Conservas los derechos sobre el contenido que publicas (textos, fotos, archivos). Al publicar, nos concedes una licencia necesaria para operar el servicio (mostrar, almacenar, transmitir). No debes subir contenido que infrinja derechos de terceros o que sea ilegal. Nos reservamos el derecho a eliminar contenido que viole estos términos o la ley.' },
  { id: 7, title: 'Limitación de responsabilidad', icon: Scale, content: 'CONSTRUCTODO se ofrece «tal cual». No garantizamos resultados concretos entre clientes y profesionales. No somos responsables de los actos, omisiones o incumplimientos de los usuarios, ni de daños indirectos, consecuentes o lucro cesante, salvo en la medida en que la ley no permita su exclusión. En la medida permitida por la ley, nuestra responsabilidad se limita al importe pagado por ti a la plataforma en los últimos doce meses o a la cantidad que la ley aplique.' },
  { id: 8, title: 'Resolución y suspensión', icon: LogOut, content: 'Puedes cerrar tu cuenta en cualquier momento desde la configuración. Nos reservamos el derecho de suspender o dar de baja cuentas que incumplan estos términos o que pongan en riesgo la seguridad o la integridad del servicio, sin perjuicio de otras medidas legales.' },
  { id: 9, title: 'Modificaciones', icon: RefreshCw, content: 'Podemos modificar estos Términos de Servicio. Los cambios relevantes se comunicarán en la plataforma o por correo. El uso continuado del servicio tras la entrada en vigor de los cambios constituye la aceptación de los nuevos términos. Si no estás de acuerdo, debes dejar de usar el servicio y, si procede, solicitar la baja de tu cuenta.' },
  { id: 10, title: 'Ley aplicable y contacto', icon: BookOpen, content: 'Estos términos se rigen por las leyes aplicables en la jurisdicción que corresponda al operador de CONSTRUCTODO. Cualquier disputa se resolverá en los tribunales competentes de dicha jurisdicción, salvo disposición legal en contrario. Para consultas sobre estos términos o el servicio, utiliza los canales de contacto indicados en la plataforma.' },
];

export default function TermsOfService() {
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
            <FileText className="w-3.5 h-3.5" />
            Documento legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Términos de Servicio
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Última actualización: Febrero 2026
          </p>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            {sections.map(({ id, title, icon: Icon, content, list, footer }) => (
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
                  <ul className="space-y-2.5 mt-2">
                    {list.map((item, i) => (
                      <li key={i} className="flex gap-3 text-[15px] text-slate-600 leading-relaxed">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {footer && (
                  <p className="mt-3 text-slate-600 text-[15px] leading-relaxed">
                    {footer}
                  </p>
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
            <Link to="/privacy-policy">Ver Política de Privacidad</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
