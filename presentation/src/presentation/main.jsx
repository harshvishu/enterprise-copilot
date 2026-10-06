import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import Presentation from './Presentation';
import '@/index.css';
import './presentation.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="system" storageKey="copilot-presentation-theme">
            <Presentation />
        </ThemeProvider>
    </React.StrictMode>,
);
