import React from 'react'

export default function Header() {
    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 text-white font-bold">IIT</div>
                    <div className="text-xl font-semibold text-slate-700">Transportation System</div>
                </div>

                <nav className="hidden md:flex gap-6 text-sm text-slate-600">
                    <a className="hover:text-slate-800">Trip Tools</a>
                    <a className="hover:text-slate-800">Schedules & Maps</a>
                    <a className="hover:text-slate-800">Fares</a>
                    <a className="hover:text-slate-800">How to Ride</a>
                    <a className="hover:text-slate-800">Contact Us</a>
                </nav>

                <div className="flex items-center gap-3">
                    <button className="hidden md:inline px-3 py-2 rounded hover:bg-gray-100">🔍</button>
                    <button className="px-3 py-2 rounded bg-metro-blue text-white">Sign in</button>
                </div>
            </div>
        </header>
    )
}
