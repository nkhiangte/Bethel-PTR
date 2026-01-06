


import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { AggregateReportData } from '../types.ts';
import { AIInsightsModal } from './AIInsightsModal.tsx';

interface AIInsightsProps {
    reportData: AggregateReportData;
    upaBials: string[];
    period: string; // e.g., "for the month of March, 2024" or "for the year 2024"
}

const AIEnhancedIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.5 8a.5.5 0 00-1 0v4.755a2.755 2.755 0 00-1.035.318.5.5 0 00-.43.894 3.755 3.755 0 001.965-.818V8zM12 18a1 1 0 100-2 1 1 0 000 2z"/>
        <path d="M11.625 5.625a.375.375 0 11.75 0 .375.375 0 01-.75 0zM7.125 7.875a.375.375 0 11.75 0 .375.375 0 01-.75 0zM16.125 7.875a.375.375 0 11.75 0 .375.375 0 01-.75 0z"/>
    </svg>
);

export const AIInsights: React.FC<AIInsightsProps> = ({ reportData, upaBials, period }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInsights = async () => {
        if (!process.env.API_KEY) {
            setError("Gemini API Key is not configured. Please contact the administrator.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setInsights(null);

        try {
            // Fix: Initialize GoogleGenAI with apiKey property
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = "You are a friendly and encouraging church financial analyst. Your role is to analyze tithe data and provide a positive summary for church leaders and members. Your tone should be optimistic and appreciative. Format your response using simple markdown with bolding for emphasis on key figures, names, or categories, and use newlines for paragraphs. Do not use markdown headings (#).";

            const dataSummary = upaBials.map(bial => {
                const bialData = reportData[bial];
                if (!bialData) return `${bial}: No contributions.`;
                return `${bial}: Pathian Ram - ${bialData.pathianRam}, Ramthar - ${bialData.ramthar}, Tualchhung - ${bialData.tualchhung}, Total - ${bialData.total}`;
            }).join('\n');

            const prompt = `
                Please analyze the following tithe contribution data for ${period}.
                
                Data (in local currency):
                ${dataSummary}
                
                Based on this data, please provide:
                1. A brief, high-level summary of the total giving.
                2. Identify the highest contributing Upa Bial and the category with the most contributions.
                3. Write an encouraging and appreciative message to the congregation about their faithfulness and generosity.
            `;

            // Fix: Use ai.models.generateContent with model name and contents, update to gemini-3-flash-preview
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            
            // Fix: response.text is a property, not a method
            const text = response.text;
            setInsights(text);

        } catch (err: any) {
            console.error("Error generating insights:", err);
             if (err.message?.includes('API key not valid')) {
                 setError("The configured Gemini API Key is invalid. Please contact the administrator.");
            } else {
                setError("Failed to generate insights. Please check your network connection and the developer console for details.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCloseModal = () => {
        setInsights(null);
        setError(null);
    };

    return (
        <>
            <button
                onClick={handleGenerateInsights}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                        <AIEnhancedIcon className="w-5 h-5" />
                        <span>Get AI Insights</span>
                    </>
                )}
            </button>

            {insights && (
                <AIInsightsModal insights={insights} onClose={handleCloseModal} />
            )}
            {error && (
                 <div 
                    className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-red-50 p-6 rounded-lg shadow-lg text-center max-w-sm m-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-bold text-red-800">Error</h3>
                        <p className="text-red-700 mt-2">{error}</p>
                        <button onClick={handleCloseModal} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md">
                            Close
                        </button>
                    </div>
                 </div>
            )}
        </>
    );
};