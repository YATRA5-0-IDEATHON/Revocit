"""Extract ordered Nepali text from rendered PDF pages using local PaddleOCR models."""

import json
import os
import sys
import types
from pathlib import Path

import cv2
import numpy as np

os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
sys.stdout.reconfigure(encoding="utf-8")


def install_langchain_compat():
    try:
        from langchain_classic.docstore.document import Document

        docstore_module = types.ModuleType("langchain.docstore")
        document_module = types.ModuleType("langchain.docstore.document")
        splitter_module = types.ModuleType("langchain.text_splitter")
        document_module.Document = Document

        class RecursiveCharacterTextSplitter:
            def __init__(self, *args, **kwargs):
                pass

            def split_text(self, text):
                return [text]

        splitter_module.RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter
        sys.modules.setdefault("langchain.docstore", docstore_module)
        sys.modules.setdefault("langchain.docstore.document", document_module)
        sys.modules.setdefault("langchain.text_splitter", splitter_module)
    except ImportError:
        pass


def enhance(image):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    light, a_channel, b_channel = cv2.split(lab)
    light = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(light)
    enhanced = cv2.cvtColor(cv2.merge([light, a_channel, b_channel]), cv2.COLOR_LAB2BGR)
    kernel = np.array([[0, -0.5, 0], [-0.5, 3, -0.5], [0, -0.5, 0]], dtype=np.float32)
    return cv2.filter2D(enhanced, -1, kernel)


def ordered_text(ocr, image_path):
    image = cv2.imread(str(image_path))
    if image is None:
        raise RuntimeError(f"Could not read image: {image_path}")
    lines = []
    for result in ocr.predict(enhance(image)):
        data = dict(result)
        for polygon, text, score in zip(data.get("dt_polys", []), data.get("rec_texts", []), data.get("rec_scores", [])):
            if not str(text).strip() or float(score) < 0.5:
                continue
            points = np.asarray(polygon)
            lines.append((float(points[:, 1].min()), float(points[:, 0].min()), str(text).strip()))
    lines.sort(key=lambda line: (line[0], line[1]))
    return "\n".join(line[2] for line in lines)


def main():
    arguments = sys.argv[1:]
    if arguments[:1] == ["--image-list"]:
        if len(arguments) != 2:
            raise SystemExit("Usage: paddle_ocr_pages.py --image-list pages.txt")
        arguments = [line.strip() for line in Path(arguments[1]).read_text(encoding="utf-8").splitlines() if line.strip()]
    if not arguments:
        raise SystemExit("Usage: paddle_ocr_pages.py page.png [page2.png ...]")
    install_langchain_compat()
    from paddleocr import PaddleOCR

    ocr = PaddleOCR(
        text_detection_model_name="PP-OCRv5_mobile_det",
        text_recognition_model_name="PP-OCRv5_server_rec",
        use_textline_orientation=False,
        det_db_thresh=0.3,
        det_db_box_thresh=0.5,
        det_db_unclip_ratio=1.3,
    )
    print(json.dumps([ordered_text(ocr, Path(value)) for value in arguments], ensure_ascii=False))


if __name__ == "__main__":
    main()
