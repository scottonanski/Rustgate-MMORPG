
import React from 'react';
import { useUiStore } from '../state/uiStore.ts';
import type { LlmAdapter } from '../../adapters/llm/base.ts';

const StatusIndicator: React.FC<{ status: 'unset' | 'pending' | 'success' | 'error'; details: string }> = ({ status, details }) => {
    const statusClasses = {
        unset: 'card-status--unset',
        pending: 'card-status--pending',
        success: 'card-status--success',
        error: 'card-status--error',
    };
    return <p className={`card-status ${statusClasses[status]}`}>{details}</p>;
};


export const ModelPicker: React.FC = () => {
    const { 
        adapters, 
        selectedAdapterId, 
        selectAdapter, 
        testAdapter, 
        adapterStatuses 
    } = useUiStore();

    return (
        <div className="model-picker-container">
            {adapters.map((adapter: LlmAdapter) => {
                const { id, name } = adapter;
                const statusInfo = adapterStatuses[id];
                const isSelected = selectedAdapterId === id;

                return (
                    <div 
                        key={id} 
                        className={`card ${isSelected ? 'card--selected' : ''}`}
                        onClick={() => selectAdapter(id)}
                    >
                        <h3 className="card-title">{name}</h3>
                        <StatusIndicator status={statusInfo.status} details={statusInfo.details} />
                        <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                testAdapter(id);
                            }}
                            disabled={statusInfo.status === 'pending'}
                        >
                            {statusInfo.status === 'pending' ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
