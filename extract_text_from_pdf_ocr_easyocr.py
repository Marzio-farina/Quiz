#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script per estrarre testo da PDF scansionato usando EasyOCR
EasyOCR non richiede installazione manuale di Tesseract
"""

import os
import sys
from pathlib import Path

# Prova prima con PyMuPDF (non richiede Poppler)
try:
    import fitz  # PyMuPDF
    USE_PYMUPDF = True
except ImportError:
    USE_PYMUPDF = False
    try:
        from pdf2image import convert_from_path
        USE_PDF2IMAGE = True
    except ImportError:
        print("[ERR] Errore: PyMuPDF o pdf2image non installati")
        print("   Installa con: pip install PyMuPDF")
        print("   Oppure: pip install pdf2image (richiede Poppler)")
        sys.exit(1)

try:
    import easyocr
except ImportError:
    print("[ERR] Errore: easyocr non installato")
    print("   Installa con: pip install easyocr")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("[ERR] Errore: Pillow non installato")
    print("   Installa con: pip install Pillow")
    sys.exit(1)

# Configurazione
PDF_PATH = os.path.join("Ulteriori quiz", "ssfo-quiz-modello7.pdf")
OUTPUT_TEXT_FILE = os.path.join("Ulteriori quiz", "ssfo-quiz-modello7.txt")

# Lingue per OCR (italiano + inglese)
OCR_LANGUAGES = ['it', 'en']

def check_dependencies():
    """Verifica che tutte le dipendenze siano installate"""
    print("[*] Verifica dipendenze...")
    
    # Verifica EasyOCR
    try:
        print("[*] Inizializzazione EasyOCR (prima volta puo' richiedere download modelli)...")
        print("    (Il download dei modelli puo' richiedere alcuni minuti e ~500MB)")
        
        # Disabilita la barra di progresso per evitare problemi di encoding su Windows
        import sys
        import io
        
        # Salva stdout originale
        original_stdout = sys.stdout
        
        # Crea un wrapper che filtra i caratteri problematici
        class SafeStdout:
            def __init__(self, original):
                self.original = original
                
            def write(self, text):
                # Filtra caratteri problematici per Windows
                try:
                    safe_text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
                    # Rimuovi caratteri di progresso problematici
                    safe_text = safe_text.replace('\u2588', '#').replace('\u2589', '#').replace('\u258a', '#')
                    safe_text = safe_text.replace('\u258b', '#').replace('\u258c', '#').replace('\u258d', '#')
                    safe_text = safe_text.replace('\u258e', '#').replace('\u258f', '#')
                    self.original.write(safe_text)
                except:
                    pass
                    
            def flush(self):
                self.original.flush()
                
            def __getattr__(self, name):
                return getattr(self.original, name)
        
        # Usa il wrapper durante l'inizializzazione
        sys.stdout = SafeStdout(sys.stdout)
        
        try:
            reader = easyocr.Reader(OCR_LANGUAGES, gpu=False, verbose=False)
        finally:
            # Ripristina stdout originale
            sys.stdout = original_stdout
            
        print("[OK] EasyOCR inizializzato correttamente")
        return reader
    except Exception as e:
        print(f"[ERR] Errore inizializzazione EasyOCR: {e}")
        print("\n[INFO] EasyOCR richiede il download dei modelli alla prima esecuzione")
        print("   Questo puo' richiedere alcuni minuti e ~500MB di spazio")
        return None

def extract_text_from_pdf_ocr(pdf_path, output_file, reader, dpi=300):
    """
    Estrae testo da PDF scansionato usando EasyOCR
    
    Args:
        pdf_path: percorso del file PDF
        output_file: percorso del file di output per il testo
        reader: oggetto EasyOCR Reader
        dpi: risoluzione per la conversione PDF->immagine (default: 300)
    """
    
    if not os.path.exists(pdf_path):
        print(f"[ERR] File PDF non trovato: {pdf_path}")
        return False
    
    print(f"Apertura PDF: {pdf_path}")
    
    try:
        # Converti PDF in immagini
        print(f"Conversione PDF in immagini (DPI: {dpi})...")
        print("   (Questo puo' richiedere alcuni minuti per PDF grandi)")
        
        if USE_PYMUPDF:
            # Usa PyMuPDF (non richiede Poppler)
            pdf_document = fitz.open(pdf_path)
            total_pages = pdf_document.page_count
            images = []
            
            for page_num in range(total_pages):
                page = pdf_document[page_num]
                # Converti pagina in immagine con la risoluzione specificata
                mat = fitz.Matrix(dpi/72, dpi/72)  # 72 è il DPI standard di PDF
                pix = page.get_pixmap(matrix=mat)
                # Converti in PIL Image
                img_data = pix.tobytes("png")
                from io import BytesIO
                img = Image.open(BytesIO(img_data))
                images.append(img)
                
            pdf_document.close()
        else:
            # Usa pdf2image (richiede Poppler)
            images = convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt='png',
                thread_count=4
            )
        
        total_pages = len(images)
        print(f"[OK] Convertite {total_pages} pagine in immagini\n")
        
    except Exception as e:
        print(f"[ERR] Errore durante la conversione PDF: {e}")
        if not USE_PYMUPDF:
            print("\n[INFO] Assicurati che poppler sia installato")
            print("   Windows: Scarica da https://github.com/oschwartz10612/poppler-windows/releases")
            print("   Oppure: conda install -c conda-forge poppler")
        return False
    
    # Estrai testo da ogni immagine usando OCR
    all_text = []
    
    print(f"Estrazione testo con EasyOCR (lingue: {', '.join(OCR_LANGUAGES)})...")
    print("   (Questo puo' richiedere tempo, specialmente per PDF grandi)\n")
    
    for i, image in enumerate(images, 1):
        try:
            print(f"   Pagina {i}/{total_pages}...", end=' ', flush=True)
            
            # Converti PIL Image in numpy array per EasyOCR
            import numpy as np
            if isinstance(image, Image.Image):
                img_array = np.array(image)
            else:
                img_array = image
            
            # Applica OCR all'immagine
            results = reader.readtext(img_array)
            
            # Estrai solo il testo (ignora coordinate e confidenza)
            page_text = '\n'.join([result[1] for result in results])
            
            if page_text.strip():
                all_text.append(f"=== PAGINA {i} ===\n{page_text}\n")
                print("[OK]")
            else:
                print("[WARN] (nessun testo rilevato)")
                
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
        print(f"Totale pagine processate: {total_pages}")
        print(f"Totale caratteri estratti: {sum(len(t) for t in all_text)}")
        return True
    else:
        print("\n[WARN] Nessun testo estratto")
        return False

def main():
    """Funzione principale"""
    
    print("=" * 60)
    print("  ESTRATTORE TESTO DA PDF SCANNERIZZATO - EasyOCR")
    print("=" * 60)
    print()
    
    # Verifica e inizializza EasyOCR
    reader = check_dependencies()
    if reader is None:
        print("\n[ERR] Impossibile inizializzare EasyOCR")
        return
    
    print()
    
    # Estrai testo
    success = extract_text_from_pdf_ocr(
        PDF_PATH,
        OUTPUT_TEXT_FILE,
        reader,
        dpi=300
    )
    
    if success:
        print("\n" + "=" * 60)
        print("[OK] Estrazione completata con successo!")
        print("=" * 60)
        print(f"\nFile di output: {OUTPUT_TEXT_FILE}")
        print("\n[INFO] Prossimi passi:")
        print("   1. Verifica il file di testo estratto")
        print("   2. Se necessario, correggi errori di OCR manualmente")
        print("   3. Riesegui extractModello3Quizzes.js per estrarre le domande")
    else:
        print("\n[ERR] Estrazione fallita. Controlla gli errori sopra.")

if __name__ == "__main__":
    main()

