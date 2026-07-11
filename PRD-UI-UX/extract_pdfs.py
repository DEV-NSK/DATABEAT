import pymupdf
import sys
import os

for part in ['PART-01.pdf', 'PART-02.pdf', 'PART-03.pdf']:
    path = os.path.join(os.path.dirname(__file__), part)
    doc = pymupdf.open(path)
    out_path = os.path.join(os.path.dirname(__file__), part.replace('.pdf', '.txt'))
    with open(out_path, 'w', encoding='utf-8') as f:
        for i in range(len(doc)):
            f.write(f"=== PAGE {i+1} ===\n")
            f.write(doc[i].get_text())
            f.write("\n\n")
    print(f"Extracted {part} -> {out_path} ({len(doc)} pages)")
