import React, { useEffect, useState } from 'react';
import { useUiStore } from '../state/uiStore.ts';
import { ModelPicker } from '../components/ModelPicker.tsx';

export const WelcomeScreen: React.FC = () => {
    const { selectedAdapterId, adapterStatuses, startGame } = useUiStore();
    const [hasSnapshot, setHasSnapshot] = useState(false);

    const canContinue = selectedAdapterId && adapterStatuses[selectedAdapterId].status === 'success';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setHasSnapshot(Boolean(window.localStorage.getItem('rg:snap')));
    }, []);

    const handleLoadLastRun = () => {
        if (typeof window === 'undefined') return;
        const raw = window.localStorage.getItem('rg:snap');
        if (!raw) return;
        try {
            const snapshotData = JSON.parse(raw);
            console.log('[PMM] Loaded snapshot from storage:', snapshotData);
        } catch (error) {
            console.error('Failed to load snapshot:', error);
        }
    };

    return (
        <div className="screen screen--welcome">
            <header className="welcome-header">
                <h1 className="welcome-title">Chronicles of Rustgate</h1>
                <p className="welcome-subtitle">Please Select Your Game Master To Begin</p>
            </header>
            
            <ModelPicker />

            <button 
                className="btn btn-primary btn-lg"
                onClick={startGame}
                disabled={!canContinue}
            >
                Continue
            </button>
            {hasSnapshot && (
                <button
                    type="button"
                    className="btn btn-outline btn-sm load-last-run"
                    onClick={handleLoadLastRun}
                >
                    Load Last Run
                </button>
            )}
        </div>
    );
};
