'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, User, ArrowRight, Volume2, Clock, Activity } from 'lucide-react'

interface Appointment {
    id: string
    date: string
    status: string
    patient_id: string
    doctor_id: string
    patients: {
        first_name: string
        last_name: string
    }
    profiles: {
        full_name: string
    }
}

export default function WaitingMonitor() {
    const supabase = createClient()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [currentCall, setCurrentCall] = useState<Appointment | null>(null)
    const [lastCalledId, setLastCalledId] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [mounted, setMounted] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const fetchData = async () => {
        try {
            const res = await fetch('/api/waiting-room')
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Parse Error' }))
                throw new Error('API ERROR: ' + JSON.stringify(errData))
            }
            const { data } = await res.json()

            if (data) {
                const appts = data as unknown as Appointment[]
                
                // On sépare le patient actuellement appelé (si existe) des autres
                const calledAppt = appts.find(a => a.status === 'appelé')
                const others = appts.filter(a => a.status !== 'appelé')
                
                setAppointments(appts) // On garde tout pour la liste, mais le slice(1) ou autre logic pourra être adapté
                
                if (calledAppt) {
                    if (calledAppt.id !== lastCalledId) {
                        setCurrentCall(calledAppt)
                        setLastCalledId(calledAppt.id)
                        announcePatient(calledAppt)
                    }
                } else {
                    setCurrentCall(null)
                    setLastCalledId(null)
                }
            }
        } catch (error) {
            console.error("DEBUG WAITING ROOM - Error fetching data:", error)
        }
    }

    const announcePatient = (appt: Appointment) => {
        if (!window.speechSynthesis) return

        // Play alert sound if available (optional)
        // new Audio('/alert.mp3').play().catch(() => {})

        const text = `Monsieur ${appt.patients.first_name} ${appt.patients.last_name}, le Docteur ${appt.profiles?.full_name || 'votre médecin'} vous attend.`
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'fr-FR'
        utterance.rate = 0.9
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
    }

    const handleStart = () => {
        // Unlock audio context silently
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('')
            window.speechSynthesis.speak(utterance)
        }
        setHasInteracted(true)
    }

    useEffect(() => {
        setMounted(true)
        fetchData()
        
        // 1. Live Clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        // 2. Real-time Subscription
        const subscription = supabase
            .channel('waiting-room-changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => {
                console.log("Real-time update received")
                fetchData()
            })
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(subscription)
        }
    }, [lastCalledId])

    if (!hasInteracted) {
        return (
            <div className="fixed inset-0 bg-[#0f172a] text-white flex items-center justify-center font-sans">
                <button 
                    onClick={handleStart}
                    className="px-12 py-8 bg-primary hover:bg-indigo-600 rounded-3xl text-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 flex items-center gap-4"
                >
                    <Volume2 className="w-8 h-8" />
                    Démarrer le Moniteur
                </button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#1e293b]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Activity className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">MedNote <span className="text-primary">AI</span></h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Hôpital Universitaire de Psychiatrie</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-black uppercase tracking-widest text-gray-300">Moniteur en direct</span>
                    </div>
                    <div className="text-4xl font-black tabular-nums bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-inner min-w-[200px] text-center">
                        {mounted ? currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 p-8">
                {/* Main Call Section */}
                <div className="col-span-8 flex flex-col gap-8">
                    {currentCall ? (
                        <div className="flex-1 bg-gradient-to-br from-primary/20 to-indigo-600/20 rounded-[3rem] border border-white/10 p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                            {/* Animated Background Rings */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-[500px] h-[500px] border-[20px] border-white rounded-full animate-[ping_3s_linear_infinite]"></div>
                                <div className="absolute w-[700px] h-[700px] border-[1px] border-white rounded-full"></div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-32 h-32 bg-primary rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/40 animate-bounce">
                                    <Volume2 className="w-16 h-16 text-white" />
                                </div>
                                <h2 className="text-4xl font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Patient Appelé</h2>
                                <div className="text-[8rem] font-black leading-none mb-4 drop-shadow-2xl bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                                    {currentCall.patients.last_name}
                                </div>
                                <div className="text-4xl font-black text-white/80 mb-12">
                                    {currentCall.patients.first_name}
                                </div>
                                
                                <div className="px-12 py-6 bg-white rounded-[2rem] text-[#0f172a] flex items-center gap-6 shadow-2xl border-4 border-primary/20">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                        <Bell className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Se diriger vers le</p>
                                        <p className="text-3xl font-black md:whitespace-nowrap">Bureau du Dr. {currentCall.profiles?.full_name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white/5 rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500">
                            <Clock className="w-24 h-24 mb-6 opacity-20" />
                            <p className="text-3xl font-black uppercase tracking-widest opacity-40">En attente des prochains appels...</p>
                        </div>
                    )}
                </div>

                {/* Sidebar History */}
                <div className="col-span-4 bg-[#1e293b]/50 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 flex flex-col overflow-hidden shadow-2xl">
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <Bell className="w-6 h-6 text-primary" />
                        Derniers Appels
                    </h3>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {appointments.filter(a => a.status === 'en attente').map((appt) => (
                            <div key={appt.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <User className="w-6 h-6 text-gray-300 group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black uppercase leading-tight">
                                            {appt.patients.last_name} {appt.patients.first_name}
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 mt-1">
                                            Dr. {appt.profiles?.full_name}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-primary/10 rounded-3xl border border-primary/20">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest leading-relaxed">
                            Veuillez vous présenter au bureau dès l'annonce de votre nom.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes ping {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
