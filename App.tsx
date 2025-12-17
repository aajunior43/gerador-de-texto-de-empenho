import React, { useState, useRef, useCallback } from 'react';
import { generateEmpenhoDescription } from './services/geminiService';
import { ProcessingStatus, FileData } from './types';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const processFile = (file: File) => {
    // Basic validation
    if (file.size > 20 * 1024 * 1024) { 
      setErrorMsg("O arquivo é muito grande. O limite é 20MB.");
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Tipo de arquivo inválido. Use PDF ou Imagens (JPG, PNG).");
      return;
    }

    let previewUrl: string | undefined = undefined;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    } else if (file.type === 'application/pdf') {
      previewUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg'; 
    }

    setFileData({ file, previewUrl });
    setErrorMsg(null);
    setStatus(ProcessingStatus.IDLE);
    setGeneratedText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleProcess = async () => {
    if (!fileData) return;

    setStatus(ProcessingStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const text = await generateEmpenhoDescription(fileData.file);
      setGeneratedText(text);
      setStatus(ProcessingStatus.SUCCESS);
      setIsEditing(true); // Enable edit mode/focus immediately
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    alert("Texto copiado para a área de transferência!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'descricao_empenho.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFileData(null);
    setGeneratedText('');
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-200 tracking-tight sm:text-4xl drop-shadow-sm">
            GERADOR DE EMPENHO
          </h1>
          <p className="mt-4 text-lg text-gray-400 font-medium">
            Arraste um documento e gere a descrição automaticamente.
          </p>
        </div>

        {/* Main Neomorphic Card */}
        <div className="bg-[#212121] rounded-[40px] shadow-[20px_20px_60px_#191919,-20px_-20px_60px_#292929] p-8 sm:p-10">
          
          {/* Upload Section */}
          <div className="mb-8">
            {!fileData ? (
              <div 
                className={`
                  group relative cursor-pointer rounded-[30px] p-12 text-center transition-all duration-300
                  ${isDragging 
                    ? "bg-[#212121] shadow-[inset_12px_12px_24px_#191919,inset_-12px_-12px_24px_#292929] border-2 border-transparent" // Active Drag State (Deep Inset)
                    : "bg-[#212121] shadow-[inset_9px_9px_18px_#191919,inset_-9px_-9px_18px_#292929] hover:shadow-[inset_12px_12px_24px_#191919,inset_-12px_-12px_24px_#292929]" // Default Inset
                  }
                `}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`mx-auto h-16 w-16 text-gray-500 mb-4 transition-transform duration-300 ${isDragging ? "scale-110 text-blue-500" : "group-hover:scale-110"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <h3 className={`mt-2 text-lg font-semibold transition-colors ${isDragging ? "text-blue-400" : "text-gray-300"}`}>
                  {isDragging ? "Solte o arquivo aqui" : "Toque ou arraste para selecionar"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 font-medium">Suporta PDF e Imagens</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#212121] p-6 rounded-[30px] shadow-[inset_6px_6px_12px_#191919,inset_-6px_-6px_12px_#292929]">
                 {/* File Preview */}
                 <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-[#212121] shadow-[6px_6px_12px_#191919,-6px_-6px_12px_#292929] flex items-center justify-center overflow-hidden p-2">
                    {fileData.file.type.startsWith('image/') ? (
                      <img src={fileData.previewUrl} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">PDF</span>
                    )}
                 </div>
                 
                 <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-bold text-gray-200 truncate max-w-[200px] sm:max-w-xs">{fileData.file.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>

                 <div className="flex gap-4">
                   <Button variant="secondary" onClick={handleReset} disabled={status === ProcessingStatus.PROCESSING}>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </Button>
                   <Button 
                    variant="primary"
                    onClick={handleProcess} 
                    disabled={status === ProcessingStatus.PROCESSING}
                    className="min-w-[140px]"
                   >
                     {status === ProcessingStatus.PROCESSING ? (
                       <>
                        <LoadingSpinner /> Processando
                       </>
                     ) : (
                       <span className="flex items-center">
                         Gerar Texto
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l2.846-.813a1.125 1.125 0 00.41-.192l6.83-6.83a2.812 2.812 0 10-3.98-3.98l-6.83 6.83a1.125 1.125 0 00-.192.41z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5L12 12" />
                         </svg>
                       </span>
                     )}
                   </Button>
                 </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-6 p-4 rounded-[20px] bg-[#212121] shadow-[inset_3px_3px_6px_#191919,inset_-3px_-3px_6px_#292929] text-red-400 text-sm font-semibold flex items-center justify-center">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Result Section */}
          {status === ProcessingStatus.SUCCESS && (
            <div className="animate-fade-in pt-4 border-t border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-gray-400 ml-2">
                  DESCRIÇÃO DA NOTA DE EMPENHO
                </label>
                <span className="text-xs font-semibold text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-800/50">
                  Editável
                </span>
              </div>
              
              <div className="relative group">
                <textarea
                  ref={textAreaRef}
                  className="w-full h-48 p-6 bg-[#212121] rounded-[20px] shadow-[inset_6px_6px_12px_#191919,inset_-6px_-6px_12px_#292929] text-gray-300 font-mono text-sm uppercase leading-relaxed resize-none focus:outline-none focus:shadow-[inset_9px_9px_18px_#191919,inset_-9px_-9px_18px_#292929] transition-shadow duration-300"
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value.toUpperCase())}
                  placeholder="O texto gerado aparecerá aqui..."
                />
                
                {/* Floating Edit Indicator (optional visual cue) */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="text-xs text-gray-400 bg-[#212121] px-2 py-1 rounded-md shadow-sm">
                    Clique para editar
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
                 <Button variant="secondary" onClick={handleReset} className="text-red-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Limpar tudo
                 </Button>

                 <Button variant="secondary" onClick={() => textAreaRef.current?.focus()}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar
                 </Button>
                 
                 <Button variant="secondary" onClick={handleDownload}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m3 3 3-3m-3 3V3" />
                    </svg>
                    Baixar .txt
                 </Button>

                 <Button variant="primary" onClick={handleCopy}>
                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                   Copiar Texto
                 </Button>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 font-medium">
                <p>Verifique os dados (contratos, valores) antes de efetivar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;