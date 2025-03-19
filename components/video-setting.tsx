"use client"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input"
import { ColorPicker } from '@/components/ui/color-picker';


interface VideoSettingProps {
    videoUrl?: string;
    videoUid: string;
    videoFinal?: string;
}

export function VideoSetting({ videoUrl, videoUid, videoFinal }: VideoSettingProps) {
    const [color, setColor] = useState('#0f0f0f');
    const [uid, setUid] = useState(videoUid);
    const [videoSrc, setvideoSrc] = useState(videoFinal);
    const [msg, setMsg] = useState('');
    const [domain, setDomain] = useState('');
    const [option, setOption] = useState('');
    const [urlSchemaOption, setUrlSchemaOption] = useState('');
    const [errors, setErrors] = useState({ domain: '', option: '', urlSchemaOption: '' });
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                if (isFinite(videoRef.current!.duration)) {
                    videoRef.current!.currentTime = videoRef.current!.duration;
                }
            };
        }
    }, [videoUrl]);

    const validateOption = (value: string) => {
        if (!value) {
            setErrors((prev) => ({ ...prev, option: 'Une option doit être sélectionnée' }));
        } else {
            setErrors((prev) => ({ ...prev, option: '' }));
        }
    };

    const validateUrlSchemaOption = (value: string) => {
        if (option === 'urlSchema' && !value) {
            setErrors((prev) => ({ ...prev, urlSchemaOption: 'Un schéma d\'URL doit être sélectionné' }));
        } else {
            setErrors((prev) => ({ ...prev, urlSchemaOption: '' }));
        }
    };

    const isFormValid = !errors.option && !errors.urlSchemaOption;

    if (!isClient) {
        return null;
    }

    return (
        <div className="h-hull w-full flex items-center justify-center">
            <Card className="w-[800px] max-w-full h-[337,5px] p-4">

                <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-4 ">
                        {/* Première colonne : Vidéo */}
                        <div className="video-container relative">
                            <div className="aspect-[9/16] object-cover object-center">

                            
                            {videoUrl ? (
                                <video ref={videoRef} src={videoUrl} autoPlay controls={true} className="rounded-lg max-h-screen aspect-[9/16] object-cover object-center" >

                                </video>
                            ) : null}
                            <h2 className="absolute top-0 m-6 text-white text-4xl   overflow-hidden break-words">{msg}</h2>
                            </div>
                        </div>

                        {/* Deuxième colonne : Formulaire */}
                        <div className="form-container">
                            <form>
                                <div className="mb-4">
                                    {videoSrc}
                                </div>

                                <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-500">Add text to your VideoPop</label>
                                <ColorPicker 
                                onChange={(v) => {
                                        setColor(v);
                                    }}
                                    value={color}  />

                                </div>


                                    
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-500">Add text to your VideoPop</label>
                                    <Input 
                                    type="text" 
                                    id="msgtodisplay" 
                                    value={msg}
                                    onChange={(e)=>{setMsg(e.target.value)}}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-500">Where to display VideoPop ?</label>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="displayHome"
                                                name="option"
                                                value="displayHome"
                                                checked={option === 'displayHome'}
                                                onChange={(e) => {
                                                    setOption(e.target.value);
                                                    validateOption(e.target.value);
                                                }}
                                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                            />
                                            <label htmlFor="displayHome" className="ml-3 block text-sm font-medium text-gray-700">
                                                Afficher sur la page d'accueil
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="urlSchema"
                                                name="option"
                                                value="urlSchema"
                                                checked={option === 'urlSchema'}
                                                onChange={(e) => {
                                                    setOption(e.target.value);
                                                    validateOption(e.target.value);
                                                }}
                                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                            />
                                            <label htmlFor="urlSchema" className="ml-3 block text-sm font-medium text-gray-700">
                                                Afficher sur un schéma d'URL
                                            </label>
                                        </div>
                                        {option === 'urlSchema' && (
                                            <div className="mt-2">
                                                <label htmlFor="urlSelect" className="block text-sm font-medium text-gray-700">
                                                    Sélectionner un schéma d'URL
                                                </label>
                                                <select
                                                    id="urlSelect"
                                                    value={urlSchemaOption}
                                                    onChange={(e) => {
                                                        setUrlSchemaOption(e.target.value);
                                                        validateUrlSchemaOption(e.target.value);
                                                    }}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                >
                                                    <option value="">Sélectionner</option>
                                                    <option value="schema1">Schéma 1</option>
                                                    <option value="schema2">Schéma 2</option>
                                                    <option value="schema3">Schéma 3</option>
                                                </select>
                                                {errors.urlSchemaOption && <p className="text-red-500 text-xs mt-1">{errors.urlSchemaOption}</p>}
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="setAsLink"
                                                name="option"
                                                value="setAsLink"
                                                checked={option === 'setAsLink'}
                                                onChange={(e) => {
                                                    setOption(e.target.value);
                                                    validateOption(e.target.value);
                                                }}
                                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                            />
                                            <label htmlFor="setAsLink" className="ml-3 block text-sm font-medium text-gray-700">
                                                Définir comme un lien
                                            </label>
                                        </div>
                                    </div>
                                    {errors.option && <p className="text-red-500 text-xs mt-1">{errors.option}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!isFormValid}
                                    className={`mt-4 px-4 w-full py-2 bg-indigo-600 text-white rounded-md ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Soumettre
                                </button>
                            </form>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
