#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script di verifica per controllare che Python e le dipendenze siano installate correttamente
"""

import sys

def check_python_version():
    """Controlla la versione di Python"""
    print("🐍 Python Version Check")
    print(f"   Versione: {sys.version}")
    print(f"   Path: {sys.executable}")
    
    version = sys.version_info
    if version.major >= 3 and version.minor >= 7:
        print("   ✅ Python versione OK (>= 3.7)")
        return True
    else:
        print("   ❌ Python troppo vecchio! Serve >= 3.7")
        return False

def check_pymupdf():
    """Controlla se PyMuPDF è installato"""
    print("\n📦 PyMuPDF (fitz) Check")
    try:
        import fitz
        print(f"   Versione: {fitz.__version__}")
        print("   ✅ PyMuPDF installato correttamente")
        return True
    except ImportError:
        print("   ❌ PyMuPDF NON installato")
        print("   💡 Installa con: pip install PyMuPDF")
        return False

def check_pdf_file():
    """Controlla se il file PDF esiste"""
    import os
    print("\n📄 PDF File Check")
    pdf_path = "Banca dati unisa farmacia ospedaliera.pdf"
    
    if os.path.exists(pdf_path):
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        print(f"   File: {pdf_path}")
        print(f"   Dimensione: {size_mb:.2f} MB")
        print("   ✅ PDF trovato")
        return True
    else:
        print(f"   ❌ PDF non trovato: {pdf_path}")
        return False

def main():
    """Funzione principale"""
    print("=" * 60)
    print("  VERIFICA SETUP PYTHON - Estrazione Immagini PDF")
    print("=" * 60)
    print()
    
    checks = []
    checks.append(("Python Version", check_python_version()))
    checks.append(("PyMuPDF", check_pymupdf()))
    checks.append(("PDF File", check_pdf_file()))
    
    print("\n" + "=" * 60)
    print("  RIEPILOGO")
    print("=" * 60)
    
    all_ok = True
    for name, status in checks:
        symbol = "✅" if status else "❌"
        print(f"{symbol} {name}")
        if not status:
            all_ok = False
    
    print()
    
    if all_ok:
        print("🎉 Tutto OK! Puoi eseguire: python extract_pdf_images.py")
    else:
        print("⚠️  Alcuni controlli sono falliti. Segui le istruzioni sopra.")
        print()
        print("📝 Passi per risolvere:")
        if not checks[0][1]:
            print("   1. Installa Python >= 3.7 da https://www.python.org/downloads/")
        if not checks[1][1]:
            print("   2. Esegui: pip install PyMuPDF")
        if not checks[2][1]:
            print("   3. Assicurati che il file PDF sia nella cartella corretta")
    
    print()

if __name__ == "__main__":
    main()

