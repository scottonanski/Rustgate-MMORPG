import React from 'react';
import { useUiStore } from '../state/uiStore.ts';
import { ModelPicker } from '../components/ModelPicker.tsx';

export const WelcomeScreen: React.FC = () => {
    const { selectedAdapterId, adapterStatuses, startGame } = useUiStore();
    
    const canContinue = selectedAdapterId && adapterStatuses[selectedAdapterId].status === 'success';

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
        </div>
    );
};
