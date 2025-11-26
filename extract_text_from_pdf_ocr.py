#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script per estrarre testo da PDF scansionato usando OCR
Usa pdf2image per convertire PDF in immagini e pytesseract per OCR
"""

import os
import sys
from pathlib import Path

try:
    from pdf2image import convert_from_path
except ImportError:
    print("[ERR] Errore: pdf2image non installato")
    print("   Installa con: pip install pdf2image")
    print("   Nota: Richiede anche poppler (vedi README)")
    sys.exit(1)

try:
    import pytesseract
except ImportError:
    print("[ERR] Errore: pytesseract non installato")
    print("   Installa con: pip install pytesseract")
    print("   Nota: Richiede anche Tesseract OCR (vedi README)")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("[ERR] Errore: Pillow non installato")
    print("   Installa con: pip install Pillow")
    sys.exit(1)

# Configurazione
PDF_PATH = os.path.join("Ulteriori quiz", "ssfo-quiz-modello3.pdf")
OUTPUT_TEXT_FILE = os.path.join("Ulteriori quiz", "ssfo-quiz-modello3.txt")

# Configurazione OCR
# Cerca Tesseract in percorsi comuni su Windows
import platform
if platform.system() == 'Windows':
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME', '')),
    ]
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"[OK] Tesseract trovato: {path}")
            break

# Lingua per OCR (italiano + inglese)
OCR_LANG = 'ita+eng'

def check_dependencies():
    """Verifica che tutte le dipendenze siano installate"""
    print("[*] Verifica dipendenze...")
    
    # Verifica Tesseract
    try:
        version = pytesseract.get_tesseract_version()
        print(f"[OK] Tesseract OCR versione: {version}")
    except Exception as e:
        print(f"[ERR] Tesseract OCR non trovato")
        print("\n[INFO] INSTALLAZIONE RICHIESTA:")
        print("   Windows:")
        print("   1. Scarica da: https://github.com/UB-Mannheim/tesseract/wiki")
        print("   2. Installa Tesseract (default: C:\\Program Files\\Tesseract-OCR)")
        print("   3. Durante l'installazione, seleziona anche 'Italian' language pack")
        print("   4. Rilancia questo script")
        print("\n   Mac: brew install tesseract tesseract-lang")
        print("   Linux: sudo apt-get install tesseract-ocr tesseract-ocr-ita")
        return False
    
    # Verifica poppler (per pdf2image)
    try:
        from pdf2image import convert_from_path
        print("[OK] pdf2image disponibile")
        # Prova a verificare se poppler è disponibile (non facciamo una conversione reale)
        print("   (Poppler verrà verificato durante la conversione)")
    except Exception as e:
        print(f"  pdf2image potrebbe richiedere poppler: {e}")
        print("\n[INFO] INSTALLAZIONE RICHIESTA:")
        print("   Windows:")
        print("   1. Scarica poppler da: https://github.com/oschwartz10612/poppler-windows/releases")
        print("   2. Estrai l'archivio in una cartella (es: C:\\poppler)")
        print("   3. Aggiungi C:\\poppler\\Library\\bin al PATH di sistema")
        print("   4. Rilancia questo script")
        print("\n   Oppure usa conda: conda install -c conda-forge poppler")
        print("   Mac: brew install poppler")
        print("   Linux: sudo apt-get install poppler-utils")
    
    return True

def extract_text_from_pdf_ocr(pdf_path, output_file, lang='ita+eng', dpi=300):
    """
    Estrae testo da PDF scansionato usando OCR
    
    Args:
        pdf_path: percorso del file PDF
        output_file: percorso del file di output per il testo
        lang: lingua per OCR (default: 'ita+eng')
        dpi: risoluzione per la conversione PDF->immagine (default: 300)
    """
    
    if not os.path.exists(pdf_path):
        print(f"[ERR] File PDF non trovato: {pdf_path}")
        return False
    
    print(f" Apertura PDF: {pdf_path}")
    
    try:
        # Converti PDF in immagini
        print(f" Conversione PDF in immagini (DPI: {dpi})...")
        print("   (Questo può richiedere alcuni minuti per PDF grandi)")
        
        images = convert_from_path(
            pdf_path,
            dpi=dpi,
            fmt='png',
            thread_count=4  # Usa 4 thread per velocizzare
        )
        
        total_pages = len(images)
        print(f"[OK] Convertite {total_pages} pagine in immagini\n")
        
    except Exception as e:
        print(f"[ERR] Errore durante la conversione PDF: {e}")
        print("\n[INFO] Assicurati che poppler sia installato e nel PATH")
        return False
    
    # Estrai testo da ogni immagine usando OCR
    all_text = []
    
    print(f"🔍 Estrazione testo con OCR (lingua: {lang})...")
    print("   (Questo può richiedere tempo, specialmente per PDF grandi)\n")
    
    for i, image in enumerate(images, 1):
        try:
            print(f"    Pagina {i}/{total_pages}...", end=' ', flush=True)
            
            # Applica OCR all'immagine
            text = pytesseract.image_to_string(image, lang=lang)
            
            if text.strip():
                all_text.append(f"=== PAGINA {i} ===\n{text}\n")
                print("[OK]")
            else:
                print("  (nessun testo rilevato)")
                
        except Exception as e:
            print(f"[ERR] Errore pagina {i}: {e}")
            continue
    
    # Salva il testo estratto
    if all_text:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(all_text))
        
        print(f"\n[OK] Testo estratto salvato in: {output_file}")
        print(f" Totale pagine processate: {total_pages}")
        print(f" Totale caratteri estratti: {sum(len(t) for t in all_text)}")
        return True
    else:
        print("\n  Nessun testo estratto")
        return False

def main():
    """Funzione principale"""
    
    print("=" * 60)
    print("  ESTRATTORE TESTO DA PDF SCANNERIZZATO - OCR")
    print("=" * 60)
    print()
    
    # Verifica dipendenze
    if not check_dependencies():
        print("\n[ERR] Dipendenze mancanti. Installa le dipendenze necessarie.")
        return
    
    print()
    
    # Estrai testo
    success = extract_text_from_pdf_ocr(
        PDF_PATH,
        OUTPUT_TEXT_FILE,
        lang=OCR_LANG,
        dpi=300  # Aumenta a 400-600 per migliore qualità, ma più lento
    )
    
    if success:
        print("\n" + "=" * 60)
        print("[OK] Estrazione completata con successo!")
        print("=" * 60)
        print(f"\n File di output: {OUTPUT_TEXT_FILE}")
        print("\n[INFO] Prossimi passi:")
        print("   1. Verifica il file di testo estratto")
        print("   2. Se necessario, correggi errori di OCR manualmente")
        print("   3. Riesegui extractModello3Quizzes.js per estrarre le domande")
    else:
        print("\n[ERR] Estrazione fallita. Controlla gli errori sopra.")

if __name__ == "__main__":
    main()

