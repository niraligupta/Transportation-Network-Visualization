import React from 'react'
import Header from './components/Header'
// import TripPlanner from './components/oldTripPlanner'
import TripPlanner from './components/tripPlanner/TripPlanner'
// const HERO = '/images/hero.jpg' // or '/mnt/data/860b4cc8-f8b5-4b0a-849d-0a7f39010c5e.png'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-main">
        <section
          className="relative bg-center bg-cover"
        // style={{ backgroundImage: `url(${HERO})`, minHeight: '80vh' }}
        >
          <div className="absolute inset-0 bg-black/20"></div>

          <div className="container mx-auto px-4 py-12 relative z-10">
            {/* Top Schedules card */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl text-slate-700 font-semibold">Schedules</h2>
                <div className="mt-4 flex items-center gap-3">
                  <input aria-label="Search by route"
                    className="flex-1 border border-gray-200 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-metro-blue"
                    placeholder="Search by route" />
                  <button className="p-3 rounded bg-gray-100 hover:bg-gray-200">🔍</button>
                </div>
              </div>
            </div>

            {/* Trip planner centered */}
            <div className="max-w-xl mx-auto">
              <TripPlanner />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
