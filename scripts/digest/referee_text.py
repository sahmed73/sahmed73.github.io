#!/usr/bin/env python3
"""Download a referee (peer review) file PDF and save its text.

    python3 scripts/digest/referee_text.py PDF_URL --out /tmp/referee.txt

Tries `pdftotext` (poppler) first, then the `pypdf` package. If neither is available
it says so and exits 2; the routine then reads the PDF with WebFetch instead.
Never commit the downloaded PDF or the text file.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("url", help="https URL of the referee file PDF")
    parser.add_argument("--out", required=True, help="where to write the extracted text")
    args = parser.parse_args()
    if not args.url.startswith("https://"):
        sys.exit("url must start with https://")

    pdf = Path(tempfile.mkdtemp(prefix="referee_")) / "referee.pdf"
    request = urllib.request.Request(args.url, headers={"User-Agent": "research-digest/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        pdf.write_bytes(response.read())
    if pdf.read_bytes()[:5] != b"%PDF-":
        sys.exit("download is not a PDF")

    text = None
    if shutil.which("pdftotext"):
        text = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True).stdout
    else:
        try:
            from pypdf import PdfReader
            text = "\n".join(page.extract_text() or "" for page in PdfReader(str(pdf)).pages)
        except ImportError:
            pass
    if not text or not text.strip():
        print("No PDF text tool available (pdftotext or pypdf), or the PDF has no text layer.", file=sys.stderr)
        sys.exit(2)
    Path(args.out).write_text(text)
    print(f"Wrote {len(text.split())} words to {args.out}.")


if __name__ == "__main__":
    main()
