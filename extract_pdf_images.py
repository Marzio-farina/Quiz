#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script per estrarre le immagini dal PDF dei quiz
Usa PyMuPDF (fitz) per estrarre tutte le immagini incorporate nel PDF
"""

import fitz  # PyMuPDF
import os
import json
from pathlib import Path

# Configurazione
PDF_PATH = "Banca dati unisa farmacia ospedaliera.pdf"
OUTPUT_DIR = "quiz-images"
METADATA_FILE = "images-metadata.json"

def extract_images_from_pdf(pdf_path, output_dir, max_pages=None):
    """
    Estrae tutte le immagini dal PDF
    
    Args:
        pdf_path: percorso del file PDF
        output_dir: directory di output per le immagini
        max_pages: numero massimo di pagine da processare (None = tutte)
    """
    
    # Crea la directory di output se non esiste
    Path(output_dir).mkdir(exist_ok=True)
    
    # Apri il PDF
    print(f"📖 Apertura PDF: {pdf_path}")
    pdf_document = fitz.open(pdf_path)
    total_pages = pdf_document.page_count
    
    if max_pages:
        pages_to_process = min(max_pages, total_pages)
    else:
        pages_to_process = total_pages
    
    print(f"📄 Pagine totali: {total_pages}")
    print(f"🔍 Pagine da processare: {pages_to_process}\n")
    
    all_images_metadata = []
    total_images = 0
    
    # Processa ogni pagina
    for page_num in range(pages_to_process):
        page = pdf_document[page_num]
        image_list = page.get_images(full=True)
        
        if image_list:
            print(f"📄 Pagina {page_num + 1}: {len(image_list)} immagini trovate")
        
        # Estrai ogni immagine dalla pagina
        for img_index, img in enumerate(image_list):
            try:
                xref = img[0]  # XREF dell'immagine
                
                # Estrai l'immagine
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Nome file
                image_filename = f"page_{page_num + 1:04d}_img_{img_index + 1:02d}.{image_ext}"
                image_path = os.path.join(output_dir, image_filename)
                
                # Salva l'immagine
                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)
                
                # Metadata
                metadata = {
                    "filename": image_filename,
                    "page": page_num + 1,
                    "image_index": img_index + 1,
                    "width": base_image["width"],
                    "height": base_image["height"],
                    "colorspace": base_image["colorspace"],
                    "bpc": base_image["bpc"],  # bits per component
                    "xref": xref,
                    "size_bytes": len(image_bytes)
                }
                
                all_images_metadata.append(metadata)
                total_images += 1
                
                print(f"  ✓ Salvata: {image_filename} ({base_image['width']}x{base_image['height']}px, {len(image_bytes)//1024}KB)")
                
            except Exception as e:
                print(f"  ✗ Errore immagine {img_index + 1}: {str(e)}")
    
    pdf_document.close()
    
    # Salva metadata
    metadata_path = os.path.join(output_dir, METADATA_FILE)
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump({
            "total_images": total_images,
            "total_pages_processed": pages_to_process,
            "extraction_date": None,  # Verrà aggiunto dopo
            "images": all_images_metadata
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n✨ Estrazione completata!")
    print(f"📊 Statistiche:")
    print(f"   - Pagine processate: {pages_to_process}/{total_pages}")
    print(f"   - Immagini estratte: {total_images}")
    print(f"   - Directory output: {output_dir}/")
    print(f"   - Metadata salvato: {metadata_path}")
    
    return total_images, all_images_metadata


def main():
    """Funzione principale"""
    
    print("=" * 60)
    print("  ESTRATTORE IMMAGINI PDF - Quiz Farmacia")
    print("=" * 60)
    print()
    
    # Verifica che il PDF esista
    if not os.path.exists(PDF_PATH):
        print(f"❌ Errore: File PDF non trovato: {PDF_PATH}")
        return
    
    # Chiedi all'utente
    print("⚠️  IMPORTANTE: L'estrazione di tutte le 1500 pagine può richiedere tempo!")
    print()
    print("Opzioni:")
    print("  1. Estrai solo le prime 10 pagine (test veloce)")
    print("  2. Estrai solo le prime 100 pagine")
    print("  3. Estrai tutte le 1500 pagine (completo)")
    print()
    
    choice = input("Scelta (1/2/3) [default: 1]: ").strip() or "1"
    
    if choice == "1":
        max_pages = 10
        print(f"\n🔍 Modalità TEST: prime {max_pages} pagine\n")
    elif choice == "2":
        max_pages = 100
        print(f"\n🔍 Modalità MEDIA: prime {max_pages} pagine\n")
    elif choice == "3":
        max_pages = None
        print(f"\n🔍 Modalità COMPLETA: tutte le pagine\n")
    else:
        print("❌ Scelta non valida")
        return
    
    # Estrai le immagini
    try:
        total_images, metadata = extract_images_from_pdf(PDF_PATH, OUTPUT_DIR, max_pages)
        
        if total_images > 0:
            print(f"\n💡 Le immagini sono state salvate in: {OUTPUT_DIR}/")
            print(f"💡 Puoi aprirle per vedere strutture chimiche, grafici, etc.")
        else:
            print("\n⚠️  Nessuna immagine trovata nelle pagine processate")
            
    except Exception as e:
        print(f"\n❌ Errore durante l'estrazione: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

