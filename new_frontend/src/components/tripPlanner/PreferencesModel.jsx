import React, { useEffect } from 'react'

export default function PreferencesModal({ open, onClose }) {
    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose() }
        if (open) window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-40 modal-backdrop" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                    <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 bg-gray-100 p-1 rounded">✕</button>
                    <div className="p-6">
                        <h4 className="text-lg font-semibold mb-4">Trip preferences</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Trip priority</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2"><input type="radio" name="priority" defaultChecked /> Faster trip</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="priority" /> Fewer transfers</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="priority" /> Less walking</label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Willing to walk</label>
                                <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
                                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                    <span>1 / 4 mile</span><span>1 / 2 mile</span><span>1 mile</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Service type</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2"><input type="radio" name="service" defaultChecked /> Any service type</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="service" /> Rail only</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="service" /> Bus only</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" name="accessible" /> Accessible stops only</label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 text-right">
                                <button onClick={onClose} className="px-4 py-2 rounded bg-metro-blue text-white">Apply preferences</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
