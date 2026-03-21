import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Appointment } from '@/types/appointments'
import { createAppointment, confirmAppointment, cancelAppointment, rescheduleAppointment, markAsWaiting, callPatient } from './actions'
import { Calendar, Clock, Plus, User, Check, Stethoscope, X, AlertCircle, Megaphone, UserCheck } from 'lucide-react'
import Link from 'next/link'
import DatePicker from './DatePicker'
import DoctorSelector from './DoctorSelector'

export default async function AppointmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    // Get current user role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const params = await searchParams
    const filterDate = typeof params.date === 'string' ? params.date : null
    const selectedDoctorId = typeof params.doctor_id === 'string' ? params.doctor_id : null

    // 2. Dates setup
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selectedDate = filterDate || todayISO;

    // 3. Fetch Data
    let apptQuery = supabase
        .from('appointments')
        .select('*, patients(first_name, last_name, phone)')
        .gte('date', `${selectedDate}T00:00:00.000Z`)
        .lte('date', `${selectedDate}T23:59:59.999Z`)
        .order('date', { ascending: true });

    if (selectedDoctorId) {
        apptQuery = apptQuery.eq('doctor_id', selectedDoctorId);
    } else if (profile?.role?.toLowerCase() === 'medecin') {
        // By default, a doctor only sees their own appointments
        apptQuery = apptQuery.eq('doctor_id', user?.id);
    }

    const [
        { data: allAppointmentsRaw, error: apptError },
        { data: patients },
        { data: allProfiles }
    ] = await Promise.all([
        apptQuery,
        supabase
            .from('patients')
            .select('id, first_name, last_name')
            .order('last_name'),
        supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .order('full_name')
    ]);

    // Filtrer les médecins
    const doctors = allProfiles?.filter(p => p.role?.toLowerCase() === 'medecin');

    const allAppointments = (allAppointmentsRaw as unknown as Appointment[]) || [];

    // 4. Slots Logic (24/24)
    const slots = [];
    let current = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${selectedDate}T23:30:00`);
    while (current <= end) {
        slots.push(new Date(current));
        current.setMinutes(current.getMinutes() + 30);
    }

    // Role helpers
    const role = profile?.role || '';
    const canManage = ['admin', 'secretaire', 'medecin'].includes(role.toLowerCase());
    const isDoctor = ['medecin', 'admin'].includes(role.toLowerCase());

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {/* Header section with Date Picker */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Planning & Agenda
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    {['admin', 'secretaire'].includes(role.toLowerCase()) && (
                        <>
                            <span className="text-xs font-bold text-gray-400 uppercase ml-2">Médecin</span>
                            {doctors && doctors.length > 0 ? (
                                <DoctorSelector doctors={doctors as any} currentDoctorId={selectedDoctorId || undefined} />
                            ) : (
                                <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded">Aucun médecin trouvé</span>
                            )}
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        </>
                    )}
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2">Changer de jour</span>
                    <DatePicker defaultValue={selectedDate} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* TIMELINE (Left Column) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Timeline de la journée
                        </h2>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase text-gray-400">Programmé</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-black uppercase text-gray-400">En attente</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[10px] font-black uppercase text-gray-400">Appelé</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div><span className="text-[10px] font-black uppercase text-gray-400">Annulé</span></div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {slots.map((slot) => {
                            const timeStr = slot.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            const apptsInSlot = allAppointments.filter(a => {
                                const aTime = new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                return aTime === timeStr;
                            });

                            return (
                                <div key={timeStr} className={`group flex items-stretch gap-6 p-4 min-h-[90px] transition-colors ${apptsInSlot.length > 0 ? 'bg-indigo-50/5' : 'hover:bg-gray-50/50'}`}>
                                    <div className="w-16 flex flex-col justify-center border-r border-gray-100 pr-4">
                                        <span className="text-sm font-black text-gray-900">{timeStr}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">30 min</span>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center gap-2">
                                        {apptsInSlot.length > 0 ? (
                                            apptsInSlot.map((appt) => (
                                                <div key={appt.id} className={`relative p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${
                                                    appt.status === 'annulé' 
                                                    ? 'bg-white border-red-100 grayscale-[0.5]' 
                                                    : 'bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-500/5'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${appt.status === 'annulé' ? 'bg-red-50' : 'bg-indigo-50'}`}>
                                                            <User className={`w-5 h-5 ${appt.status === 'annulé' ? 'text-red-400' : 'text-indigo-600'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Link href={`/dashboard/patients/${appt.patient_id}`} className={`font-black text-gray-900 hover:text-primary transition-colors ${appt.status === 'annulé' ? 'line-through opacity-50' : ''}`}>
                                                                    {appt.patients?.first_name} {appt.patients?.last_name}
                                                                </Link>
                                                                {!selectedDoctorId && (
                                                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                                                        Dr. {doctors?.find(d => d.id === appt.doctor_id)?.full_name || '...'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                                    appt.type === 'Urgence' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {appt.type}
                                                                </span>
                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                                    appt.status === 'programmé' ? 'bg-indigo-100 text-indigo-700' : 
                                                                    appt.status === 'en attente' ? 'bg-orange-100 text-orange-700' :
                                                                    appt.status === 'appelé' ? 'bg-green-100 text-green-700 animate-pulse' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {appt.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {appt.status !== 'annulé' && isDoctor && (appt.doctor_id === user?.id || role === 'admin') && (
                                                            <Link 
                                                                href={`/dashboard/patients/${appt.patient_id}/notes/new`}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-[11px] font-black uppercase rounded-lg shadow-sm hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                                                            >
                                                                <Stethoscope className="w-3.5 h-3.5" />
                                                                Consulter
                                                            </Link>
                                                        )}
                                                        
                                                        {appt.status === 'programmé' && ['admin', 'secretaire'].includes(role.toLowerCase()) && (
                                                            <form action={markAsWaiting}>
                                                                <input type="hidden" name="appointment_id" value={appt.id} />
                                                                <button type="submit" className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-[11px] font-black uppercase rounded-lg shadow-sm hover:bg-orange-600 transition-all">
                                                                    <UserCheck className="w-3.5 h-3.5" />
                                                                    Arrivé
                                                                </button>
                                                            </form>
                                                        )}

                                                        {appt.status === 'en attente' && (appt.doctor_id === user?.id || role === 'admin' || role === 'secretaire') && (
                                                            <form action={callPatient}>
                                                                <input type="hidden" name="appointment_id" value={appt.id} />
                                                                <button type="submit" className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white text-[11px] font-black uppercase rounded-lg shadow-sm hover:bg-green-600 transition-all animate-bounce">
                                                                    <Megaphone className="w-3.5 h-3.5" />
                                                                    Appeler
                                                                </button>
                                                            </form>
                                                        )}

                                                        {appt.status !== 'annulé' && appt.status !== 'terminé' && canManage && (
                                                            <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                                                <form action={cancelAppointment}>
                                                                    <input type="hidden" name="appointment_id" value={appt.id} />
                                                                    <button type="submit" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Annuler">
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        )}

                                                        {appt.status === 'annulé' && (
                                                            <span className="text-[10px] font-black text-red-400 uppercase italic mr-2">Annulé</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center">
                                                <div className="text-gray-300 text-xs font-bold uppercase tracking-widest pl-2 group-hover:text-primary/40 transition-colors">
                                                    Disponible
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FORM PANEL (Right Column) */}
                <div className="space-y-6 lg:sticky lg:top-8">
                    {/* Creation Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-primary" />
                            Nouveau Rendez-vous
                        </h3>

                        <form action={createAppointment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Choisir le Patient</label>
                                <select 
                                    name="patient_id" 
                                    required 
                                    className="block w-full rounded-xl border-gray-200 bg-gray-50 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary h-11"
                                >
                                    <option value="">Sélectionner...</option>
                                    {patients?.map(p => (
                                        <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                                    ))}
                                </select>
                            </div>

                            {['admin', 'secretary'].includes(role) && doctors && (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Médecin assigné</label>
                                    <select 
                                        name="doctor_id" 
                                        required 
                                        defaultValue={selectedDoctorId || ''}
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary h-11"
                                    >
                                        <option value="">Sélectionner le médecin...</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>Dr. {d.full_name || d.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Date</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        required 
                                        defaultValue={selectedDate}
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 text-sm font-bold h-11" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Heure</label>
                                    <input 
                                        type="time" 
                                        name="time" 
                                        required 
                                        defaultValue="08:30"
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 text-sm font-bold h-11" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Type de visite</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Consultation', 'Suivi', 'Urgence', 'Contrôle'].map(type => (
                                        <div key={type} className="relative">
                                            <input type="radio" name="type" value={type} id={type} className="peer sr-only" defaultChecked={type === 'Consultation'} />
                                            <label htmlFor={type} className="flex justify-center py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 cursor-pointer peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all">
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full h-12 mt-4 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Enregistrer le RDV
                            </button>
                        </form>
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Résumé du jour</h4>
                            <div className="text-3xl font-black mb-1">
                                {allAppointments.filter(a => a.status === 'programmé').length} RDV
                            </div>
                            <p className="text-xs font-medium opacity-70">En attente de consultation</p>
                        </div>
                        <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    )
}
