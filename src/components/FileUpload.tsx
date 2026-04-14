import React, { useRef, useState } from 'react';
import { Upload, FileText, X, LogIn, LogOut, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CargoData } from '../types';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface FileUploadProps {
  onDataLoaded: (data: CargoData[]) => void;
  onReset: () => void;
  hasData: boolean;
  isRealData: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onReset, hasData, isRealData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.value ? e.target.files?.[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsUploading(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mappedData: CargoData[] = data.map((item, index) => ({
          Ticket: String(item.Ticket || item['TICKET'] || `FILE-${index}`),
          Data: item.Data || item['DATA'] || new Date().toISOString().split('T')[0],
          'Liquido Sem Desc': parseFloat(item['Liquido Sem Desc'] || item['LIQUIDO'] || item['PESO'] || 0),
          'Umidade (%)': parseFloat(item['Umidade (%)'] || item['UMIDADE'] || 0),
          Produtor: item.Produtor || item['PRODUTOR'] || 'Desconhecido',
          Cultivar: item.Cultivar || item['CULTIVAR'] || 'Desconhecida',
          Moega: String(item.Moega || item['MOEGA'] || ''),
        }));

        // Save to Firebase (Open Access)
        const batch = writeBatch(db);
        const cargasCol = collection(db, 'cargas');
        
        mappedData.forEach((cargo) => {
          const cargoRef = doc(cargasCol, cargo.Ticket);
          batch.set(cargoRef, {
            ...cargo,
            uploadedAt: new Date().toISOString()
          });
        });

        await batch.commit();
        onDataLoaded(mappedData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'cargas');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-sleek-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {isUploading ? 'Enviando...' : 'Atualizar Dados (Planilha)'}
        </button>
      </div>

      {isRealData && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-white border border-sleek-danger text-sleek-danger px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors shadow-sm"
        >
          <X className="w-3.5 h-3.5" />
          Limpar Vista
        </button>
      )}
      
      <div className="text-[10px] text-sleek-text-secondary max-w-[120px] leading-tight hidden sm:block">
        {isRealData ? (
          <span className="text-sleek-success font-bold flex items-center gap-1">
            <FileText className="w-3 h-3" /> Banco de Dados Online
          </span>
        ) : (
          "Modo Demonstração"
        )}
      </div>
    </div>
  );
};
