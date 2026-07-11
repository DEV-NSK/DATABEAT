import pymupdf
import os

path = os.path.join(os.path.dirname(__file__), 'PART-02.pdf')
doc = pymupdf.open(path)
out_path = os.path.join(os.path.dirname(__file__), 'PART-02.txt')
with open(out_path, 'w', encoding='utf-8') as f:
    for i in range(len(doc)):
        f.write(f"=== PAGE {i+1} ===\n")
        f.write(doc[i].get_text())
        f.write("\n\n")
print(f"Extracted PART-02.pdf ({len(doc)} pages)")
