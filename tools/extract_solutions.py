#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Speedcubing CFOP Cheat Sheet Solution Extractor for qqTimer
Extracts individual case icons from cheat sheet images (F2L, OLL, PLL),
normalizes them to uniform square PNG assets, and compiles a comprehensive
solutions.json database with verified formulas.
"""

import os
import json
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLVE_DIR = os.path.join(BASE_DIR, "solve")
ICONS_DIR = os.path.join(SOLVE_DIR, "icons")
JSON_OUTPUT = os.path.join(SOLVE_DIR, "solutions.json")

# Target icon dimension for uniform UI display
ICON_SIZE = (128, 128)

def normalize_icon(cropped_img, target_size=ICON_SIZE, padding=6):
    """
    Fits the cropped image into target_size square with centered padding and white background.
    """
    # Create white canvas
    canvas = Image.new("RGBA", target_size, (255, 255, 255, 255))
    
    # Calculate fit ratio
    w, h = cropped_img.size
    max_w = target_size[0] - (padding * 2)
    max_h = target_size[1] - (padding * 2)
    ratio = min(max_w / w, max_h / h)
    
    new_w = max(1, int(w * ratio))
    new_h = max(1, int(h * ratio))
    resized = cropped_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    paste_x = (target_size[0] - new_w) // 2
    paste_y = (target_size[1] - new_h) // 2
    
    canvas.paste(resized, (paste_x, paste_y))
    return canvas

# ==========================================
# 1. PLL Definitions (21 Cases)
# ==========================================
PLL_DATA = [
    {"num": 1, "case": "Case 1 A(a)", "name": "Aa-Perm", "group": "Corners Only", "alg": "R2 F2 R' B' R F2 R' B R'"},
    {"num": 2, "case": "Case 2 A(b)", "name": "Ab-Perm", "group": "Corners Only", "alg": "R B' R F2 R' B R F2 R2"},
    {"num": 3, "case": "Case 3 E",    "name": "E-Perm",  "group": "Corners Only", "alg": "F R' F' r U R U' r' - F R F' r U R' U' r'"},
    {"num": 4, "case": "Case 4 U(a)", "name": "Ua-Perm", "group": "Edges Only",   "alg": "R' U R' U' R' U' R' U R U R2"},
    {"num": 5, "case": "Case 5 U(b)", "name": "Ub-Perm", "group": "Edges Only",   "alg": "R2 U' R' U' R U R U R U' R"},
    {"num": 6, "case": "Case 6 Z",    "name": "Z-Perm",  "group": "Edges Only",   "alg": "R' U' R U' R U - R U' R' U R U R2 U' R' U2"},
    {"num": 7, "case": "Case 7 H",    "name": "H-Perm",  "group": "Edges Only",   "alg": "M2 U' M2 U2 M2 U' M2"},
    {"num": 8, "case": "Case 8 J(b)", "name": "Jb-Perm", "group": "Adjacent Swap", "alg": "R U R' F' - R U R' U' - R' F R2 U' R' U'"},
    {"num": 9, "case": "Case 9 J(a)", "name": "Ja-Perm", "group": "Adjacent Swap", "alg": "R' U2 R U R' U2 L U' R U L'"},
    {"num": 10, "case": "Case 10 R(b)","name": "Rb-Perm","group": "Adjacent Swap", "alg": "R' U2 R U2 R' F R U R' U' R' F' R2 U'"},
    {"num": 11, "case": "Case 11 R(a)","name": "Ra-Perm","group": "Adjacent Swap", "alg": "R U R' - F' R U2 R' U2 R' F - R U R U2 R' U'"},
    {"num": 12, "case": "Case 12 T",   "name": "T-Perm", "group": "Adjacent Swap", "alg": "R U R' U' - R' F R2 U' R' U' R U R' F'"},
    {"num": 13, "case": "Case 13 F",   "name": "F-Perm", "group": "Adjacent Swap", "alg": "R' U' F' - R U R' U'- R' F R2 U' R' U' R U R' U R"},
    {"num": 14, "case": "Case 14 G(d)","name": "Gd-Perm","group": "G-Permutations","alg": "R U R' y' R2 u' R U' R' U R' u R2"},
    {"num": 15, "case": "Case 15 G(c)","name": "Gc-Perm","group": "G-Permutations","alg": "R2 u' R U' R U R' u R2 y R U' R'"},
    {"num": 16, "case": "Case 16 G(b)","name": "Gb-Perm","group": "G-Permutations","alg": "R' U' R y R2 u R' U R U' R u' R2"},
    {"num": 17, "case": "Case 17 G(a)","name": "Ga-Perm","group": "G-Permutations","alg": "R2 u R' U R' U' R u' R2 - F' U F"},
    {"num": 18, "case": "Case 18 V",   "name": "V-Perm", "group": "Diagonal Swap", "alg": "R' U R' d' - R' F' R2 U' R' U R' - F R F"},
    {"num": 19, "case": "Case 19 Y",   "name": "Y-Perm", "group": "Diagonal Swap", "alg": "F R U' R' U' R U R' F' - R U R' U' - R' F R F'"},
    {"num": 20, "case": "Case 20 N(b)","name": "Nb-Perm","group": "Diagonal Swap", "alg": "L' U R' U2 L U' R - L' U R' U2 L U' R - U"},
    {"num": 21, "case": "Case 21 N(a)","name": "Na-Perm","group": "Diagonal Swap", "alg": "L U' R U2 L' U R' - L U' R U2 L' U R' - U'"}
]

def extract_pll(out_dir):
    img_path = os.path.join(SOLVE_DIR, "pll_vr2_yshoon17.jpg")
    img = Image.open(img_path)
    os.makedirs(out_dir, exist_ok=True)
    results = []
    
    # 21 rows of height 80, starts at y = 49
    # The 1st box (yellow top-view arrow) is located at x: 20~79, y: y1+11~y1+70
    # Note: 2nd box (3D cube) is completely skipped per user requirement!
    for i, meta in enumerate(PLL_DATA):
        y1 = 49 + i * 80
        # Precision crop of the 1st yellow arrow diagram
        crop_box = (19, y1 + 10, 80, y1 + 71)
        icon_img = img.crop(crop_box)
        
        normalized = normalize_icon(icon_img)
        file_name = f"pll_case_{meta['num']:02d}.png"
        rel_path = f"solve/icons/pll/{file_name}"
        normalized.save(os.path.join(out_dir, file_name))
        
        results.append({
            "stage": "PLL",
            "id": f"pll_{meta['num']:02d}",
            "case": meta["case"],
            "name": meta["name"],
            "group": meta["group"],
            "algorithm": meta["alg"],
            "icon": rel_path
        })
    return results

# ==========================================
# 2. F2L Definitions (42 Cases = 41 Algs + 1 Solved)
# ==========================================
# Row index 0 to 20: Left Col, Right Col
F2L_ROWS = [
    # Row 0
    {"c1": {"num": "01A", "case": "Case 1A", "group": "Basic Inserts", "alg": "U R U' R'"},
     "c2": {"num": "01B", "case": "Case 1B", "group": "Basic Inserts", "alg": "F R' F' R"}},
    # Row 1
    {"c1": {"num": "02",  "case": "Case 2",  "group": "Basic Inserts", "alg": "R2 U2 F R2 F' U2 R' U R'"},
     "c2": {"num": "03",  "case": "Case 3",  "group": "Basic Inserts", "alg": "Solved (기본 완성)"}},
    # Row 2
    {"c1": {"num": "04A", "case": "Case 4A", "group": "Corner in Slot", "alg": "R2 U2 R' U' R U' R' U2 R'"},
     "c2": {"num": "04B", "case": "Case 4B", "group": "Corner in Slot", "alg": "y' R2 U2 R U R' U R U2 R"}},
    # Row 3
    {"c1": {"num": "05A", "case": "Case 5A", "group": "Corner in Slot", "alg": "R U' R U B U' B' R2"},
     "c2": {"num": "05B", "case": "Case 5B", "group": "Corner in Slot", "alg": "y' R' U R' U' F' U F R2"}},
    # Row 4
    {"c1": {"num": "06",  "case": "Case 6",  "group": "Both in Slot", "alg": "R2 U R2 U R2 U2 R2"},
     "c2": {"num": "07",  "case": "Case 7",  "group": "Both in Slot", "alg": "R U' R' F' U2 F"}},
    # Row 5
    {"c1": {"num": "08A", "case": "Case 8A", "group": "Separation", "alg": "U' R U' R' U2 - R U' R'"},
     "c2": {"num": "08B", "case": "Case 8B", "group": "Separation", "alg": "d R' U R U2 - R' U R"}},
    # Row 6
    {"c1": {"num": "09A", "case": "Case 9A", "group": "Separation", "alg": "U' R U R' - U F' U' F"},
     "c2": {"num": "09B", "case": "Case 9B", "group": "Separation", "alg": "U F' U' F - U' R U R'"}},
    # Row 7
    {"c1": {"num": "10A", "case": "Case 10A", "group": "Separation", "alg": "U R U' R' - F R' F' R"},
     "c2": {"num": "10B", "case": "Case 10B", "group": "Separation", "alg": "U' F' U F - U R U' R'"}},
    # Row 8
    {"c1": {"num": "11A", "case": "Case 11A", "group": "Corner Pointing Up", "alg": "R U' R' - U R U' R'"},
     "c2": {"num": "11B", "case": "Case 11B", "group": "Corner Pointing Up", "alg": "y' R' U R - U' R' U R"}},
    # Row 9
    {"c1": {"num": "12A", "case": "Case 12A", "group": "Corner Pointing Up", "alg": "y' R' U' R U - R' U' R"},
     "c2": {"num": "12B", "case": "Case 12B", "group": "Corner Pointing Up", "alg": "R U R' U' - R U R'"}},
    # Row 10
    {"c1": {"num": "13A", "case": "Case 13A", "group": "Edge in Slot", "alg": "d - R' U' R"},
     "c2": {"num": "13B", "case": "Case 13B", "group": "Edge in Slot", "alg": "U' R U R'"}},
    # Row 11
    {"c1": {"num": "14A", "case": "Case 14A", "group": "Edge in Slot", "alg": "R U2 R' U2 - R U' R'"},
     "c2": {"num": "14B", "case": "Case 14B", "group": "Edge in Slot", "alg": "y' R' U2 R U2 - R' U R"}},
    # Row 12
    {"c1": {"num": "15A", "case": "Case 15A", "group": "Edge in Slot", "alg": "U2 R U R2 F R F' - R U' R'"},
     "c2": {"num": "15B", "case": "Case 15B", "group": "Edge in Slot", "alg": "U2 R U' R' U' R U' R'- U R U' R'"}},
    # Row 13
    {"c1": {"num": "16A", "case": "Case 16A", "group": "Edge in Slot", "alg": "R U2 R' - U' R U R'"},
     "c2": {"num": "16B", "case": "Case 16B", "group": "Edge in Slot", "alg": "y' R' U2 R - U R' U' R"}},
    # Row 14
    {"c1": {"num": "17A", "case": "Case 17A", "group": "Easy Cases", "alg": "U F' U2 F - U' R U R'"},
     "c2": {"num": "17B", "case": "Case 17B", "group": "Easy Cases", "alg": "U' R U2 R' - U F' U' F"}},
    # Row 15
    {"c1": {"num": "18A", "case": "Case 18A", "group": "Easy Cases", "alg": "R U' R' - U2 - F' U' F"},
     "c2": {"num": "18B", "case": "Case 18B", "group": "Easy Cases", "alg": "F' U F - U2 - R U R'"}},
    # Row 16
    {"c1": {"num": "19A", "case": "Case 19A", "group": "Easy Cases", "alg": "U' R U' R' U - R U R'"},
     "c2": {"num": "19B", "case": "Case 19B", "group": "Easy Cases", "alg": "d R' U R U' - R' U R"}},
    # Row 17
    {"c1": {"num": "20A", "case": "Case 20A", "group": "Special Form", "alg": "R U R' - U R U' R'"},
     "c2": {"num": "20B", "case": "Case 20B", "group": "Special Form", "alg": "y' R' U' R - U' R' U R"}},
    # Row 18
    {"c1": {"num": "21A", "case": "Case 21A", "group": "Special Form", "alg": "R U2 R' - U R U' R'"},
     "c2": {"num": "21B", "case": "Case 21B", "group": "Special Form", "alg": "y' R' U2 R - U' R' U R"}},
    # Row 19
    {"c1": {"num": "22A", "case": "Case 22A", "group": "Special Form", "alg": "R U R' U - R U R'"},
     "c2": {"num": "22B", "case": "Case 22B", "group": "Special Form", "alg": "R U R' U2 F' U' F"}},
    # Row 20
    {"c1": {"num": "23A", "case": "Case 23A", "group": "Advanced", "alg": "y' R' U' R U2 R' U R"},
     "c2": {"num": "23B", "case": "Case 23B", "group": "Advanced", "alg": "R U R' U2 R U' R'"}}
]

def extract_f2l(out_dir):
    img_path = os.path.join(SOLVE_DIR, "f2l_yshoon17.jpg")
    img = Image.open(img_path)
    os.makedirs(out_dir, exist_ok=True)
    results = []
    
    # 21 rows, y starts at 25, step 80
    for r, row in enumerate(F2L_ROWS):
        y1 = 25 + r * 80
        y2 = y1 + 80
        
        # Col 1 icon: x 21~98 (avoid left border line)
        c1_meta = row["c1"]
        c1_crop = img.crop((21, y1 + 2, 98, y2 - 2))
        c1_norm = normalize_icon(c1_crop)
        c1_file = f"f2l_case_{c1_meta['num']}.png"
        c1_norm.save(os.path.join(out_dir, c1_file))
        results.append({
            "stage": "F2L",
            "id": f"f2l_{c1_meta['num'].lower()}",
            "case": c1_meta["case"],
            "name": c1_meta["case"],
            "group": c1_meta["group"],
            "algorithm": c1_meta["alg"],
            "icon": f"solve/icons/f2l/{c1_file}"
        })
        
        # Col 2 icon: x 301~378 (avoid left border line)
        c2_meta = row["c2"]
        c2_crop = img.crop((301, y1 + 2, 378, y2 - 2))
        c2_norm = normalize_icon(c2_crop)
        c2_file = f"f2l_case_{c2_meta['num']}.png"
        c2_norm.save(os.path.join(out_dir, c2_file))
        results.append({
            "stage": "F2L",
            "id": f"f2l_{c2_meta['num'].lower()}",
            "case": c2_meta["case"],
            "name": c2_meta["case"],
            "group": c2_meta["group"],
            "algorithm": c2_meta["alg"],
            "icon": f"solve/icons/f2l/{c2_file}"
        })
        
    return results

# ==========================================
# 3. OLL Definitions (57 Cases)
# ==========================================
OLL_DATA = {
    1: {"name": "Dot - Runaway", "group": "Dot Cases", "alg": "R U'2 R'2 F R F' U2 - R' F R F'"},
    2: {"name": "Dot - Zamboni", "group": "Dot Cases", "alg": "F - R U R' U' - S - R U R' U' - f'"},
    3: {"name": "Dot - Anti-Squeegee", "group": "Dot Cases", "alg": "F U R U' R' F' - U' - F R U R' U' F'"},
    4: {"name": "Dot - Squeegee", "group": "Dot Cases", "alg": "F U R U' R' F' - U - F R U R' U' F'"},
    5: {"name": "Square - Right", "group": "Square Cases", "alg": "R U R' U - R' F R F' - U2 - R' F R F'"},
    6: {"name": "Square - Left", "group": "Square Cases", "alg": "r - U R' U R U'2 - r'2 - U' R U' R' U2 r"},
    7: {"name": "Lightning - Wide Left", "group": "Small Lightning", "alg": "r' - U'2 R U R' U - r2 - U2 R' U' R U' r'"},
    8: {"name": "Lightning - Wide Right", "group": "Small Lightning", "alg": "M U - R U R' U' - M'2 U R U' r'"},
    9: {"name": "Fish - Kite", "group": "Fish Shapes", "alg": "R' U2 R'2 U R' U R U'2 - B' R' B"},
    10: {"name": "Fish - Streetlights", "group": "Fish Shapes", "alg": "F - R U R' U'- R F' r U R' U' r'"},
    11: {"name": "Lightning - Down Right", "group": "Small Lightning", "alg": "f - R U R' U' - R U R' U' - f'"},
    12: {"name": "Lightning - Down Left", "group": "Small Lightning", "alg": "R' U' R U' R' U - y' R' U R B"},
    13: {"name": "Gun - Gunman", "group": "Knight Move", "alg": "r U2 R' U' - R U R' U' - R U' r'"},
    14: {"name": "Gun - Anti-Gunman", "group": "Knight Move", "alg": "r' U2 - R U R' U' - R U R' U r"},
    15: {"name": "Knight - Squeegee", "group": "Knight Move", "alg": "R B' R'2 F R2 B R'2 F' R"},
    16: {"name": "Knight - Anti-Squeegee", "group": "Knight Move", "alg": "R' F R2 B' R'2 F' R2 B R'"},
    17: {"name": "Slash - Diagonal", "group": "Dot Cases", "alg": "F - R U R' U' - R U R' U' - F'"},
    18: {"name": "Crown - Crown", "group": "Dot Cases", "alg": "F' - L' U' L U - L' U' L U - F"},
    19: {"name": "Shield - Left", "group": "Dot Cases", "alg": "r U R' U R U'2 r'"},
    20: {"name": "Shield - Right", "group": "Dot Cases", "alg": "r' U' R U' R' U2 r"},
    21: {"name": "Cross - Double H", "group": "All Edges Oriented", "alg": "r R2 U' R U' R' U2 R U' M"},
    22: {"name": "Cross - Pi", "group": "All Edges Oriented", "alg": "r' R'2 U R' U R U'2 R' U M'"},
    23: {"name": "Cross - Headlights", "group": "All Edges Oriented", "alg": "R U R' U' - R' F R2 U R' U' F'"},
    24: {"name": "Cross - Chameleon", "group": "All Edges Oriented", "alg": "R U R' U - R' F R F' - R U'2 R'"},
    25: {"name": "Cross - Triple Bowtie", "group": "All Edges Oriented", "alg": "r' U'2 R U R' U r"},
    26: {"name": "Cross - Anti-Sune", "group": "All Edges Oriented", "alg": "r U'2 R' U' R U' r'"},
    27: {"name": "Cross - Sune", "group": "All Edges Oriented", "alg": "F U R U'2 - R' U' R U R' F'"},
    28: {"name": "Corners - Stealth", "group": "All Corners Oriented", "alg": "R' F R U - R' F' R F - U' F'"},
    29: {"name": "Awkward - Spoon", "group": "Awkward Shapes", "alg": "r U r' - R U R' U' - r U' r'"},
    30: {"name": "Awkward - Anti-Spoon", "group": "Awkward Shapes", "alg": "r' U' r - R' U' R U - r' U r"},
    31: {"name": "Couch - Left", "group": "L Shapes", "alg": "R U R' U R U'2 R' - F R U R' U' F'"},
    32: {"name": "Couch - Right", "group": "L Shapes", "alg": "R' U' R U' R' U2 R - F R U R' U' F'"},
    33: {"name": "T-Shape - Right", "group": "T Shapes", "alg": "l' U' R D' R' U2 R' U' R2 D - x'"},
    34: {"name": "T-Shape - Left", "group": "T Shapes", "alg": "l U R' D R U'2 R U R2 D' - x"},
    35: {"name": "Fish - Right", "group": "Fish Shapes", "alg": "R U - B' U' R' U R B - R'"},
    36: {"name": "Fish - Left", "group": "Fish Shapes", "alg": "R' U' - F U R U' R' F' - R"},
    37: {"name": "Manta Ray - Right", "group": "Fish Shapes", "alg": "F R' F' R - U R U' R'"},
    38: {"name": "Manta Ray - Left", "group": "Fish Shapes", "alg": "f - R U R' U' - f'"},
    39: {"name": "Big Lightning - Right", "group": "Big Lightning", "alg": "F' - U' L' U L - F"},
    40: {"name": "Big Lightning - Left", "group": "Big Lightning", "alg": "R U'2 - R'2 F R F' - R U'2 R'"},
    41: {"name": "Awkward - Squeegee Left", "group": "Awkward Shapes", "alg": "F - R U R' U' - F'"},
    42: {"name": "Awkward - Squeegee Right","group": "Awkward Shapes", "alg": "R U R' U' - R' F R F'"},
    43: {"name": "P-Shape - Left Anti", "group": "P Shapes", "alg": "R - B' R' U' R U B - U' R'"},
    44: {"name": "P-Shape - Right Anti", "group": "P Shapes", "alg": "R' - F R U R' U' F' - U R"},
    45: {"name": "T-Shape - Right Pure", "group": "T Shapes", "alg": "R U R' U' - B' - R' F R F' - B"},
    46: {"name": "C-Shape - Right Pure", "group": "C Shapes", "alg": "R' U' - R' F R F' - U R"},
    47: {"name": "L-Shape - Anti Breakneck", "group": "L Shapes", "alg": "R U R' U - R U' R' U' - R' F R F'"},
    48: {"name": "L-Shape - Breakneck", "group": "L Shapes", "alg": "R' U' R U' - R' U R U - R B' R' B"},
    49: {"name": "L-Shape - Anti-L", "group": "L Shapes", "alg": "R U'2 R' U' - R U R' U' - R U' R'"},
    50: {"name": "L-Shape - L", "group": "L Shapes", "alg": "R U'2 R'2 U' R2 U' R'2 U'2 R"},
    51: {"name": "I-Shape - Bottle Cap", "group": "I Shapes", "alg": "R2 D' R U'2 R' D R U'2 R"},
    52: {"name": "I-Shape - Anti-Bottle", "group": "I Shapes", "alg": "F R F' r U R' U' r'"},
    53: {"name": "L-Shape - Frying Pan", "group": "L Shapes", "alg": "F R' F' r U R U' r'"},
    54: {"name": "L-Shape - Anti-Frying", "group": "L Shapes", "alg": "R' U' R U' R' U'2 R"},
    55: {"name": "I-Shape - Highway", "group": "I Shapes", "alg": "R U R' U R U'2 R'"},
    56: {"name": "I-Shape - Street", "group": "I Shapes", "alg": "r U R' U' - M - U R U' R'"},
    57: {"name": "Corners - Pure H", "group": "All Corners Oriented", "alg": "R U R' U' - M' - U R U' r'"}
}

def extract_oll(out_dir):
    img_path = os.path.join(SOLVE_DIR, "oll_yshoon17.jpg")
    img = Image.open(img_path)
    os.makedirs(out_dir, exist_ok=True)
    results = []
    
    # 29 rows, y starts at 4, step 100
    for r in range(29):
        y1 = 4 + r * 100
        y2 = y1 + 100
        
        # Col 1: odd cases (1, 3, 5, ..., 57)
        c1_num = r * 2 + 1
        if c1_num in OLL_DATA:
            meta = OLL_DATA[c1_num]
            c1_crop = img.crop((5, y1 + 2, 102, y2 - 2))
            c1_norm = normalize_icon(c1_crop)
            c1_file = f"oll_case_{c1_num:02d}.png"
            c1_norm.save(os.path.join(out_dir, c1_file))
            results.append({
                "stage": "OLL",
                "id": f"oll_{c1_num:02d}",
                "case": f"Case {c1_num}",
                "name": meta["name"],
                "group": meta["group"],
                "algorithm": meta["alg"],
                "icon": f"solve/icons/oll/{c1_file}"
            })
            
        # Col 2: even cases (2, 4, 6, ..., 56)
        c2_num = (r + 1) * 2
        if c2_num in OLL_DATA:
            meta = OLL_DATA[c2_num]
            c2_crop = img.crop((366, y1 + 2, 463, y2 - 2))
            c2_norm = normalize_icon(c2_crop)
            c2_file = f"oll_case_{c2_num:02d}.png"
            c2_norm.save(os.path.join(out_dir, c2_file))
            results.append({
                "stage": "OLL",
                "id": f"oll_{c2_num:02d}",
                "case": f"Case {c2_num}",
                "name": meta["name"],
                "group": meta["group"],
                "algorithm": meta["alg"],
                "icon": f"solve/icons/oll/{c2_file}"
            })
            
    # Sort by case number
    results.sort(key=lambda x: int(x["id"].split("_")[1]))
    return results

def main():
    print("=" * 60)
    print(" Speedcubing CFOP Cheat Sheet Extractor for qqTimer")
    print("=" * 60)
    
    os.makedirs(ICONS_DIR, exist_ok=True)
    
    print("\n[1/3] Extracting PLL cases (1st yellow-arrow diagram only)...")
    pll_icons_dir = os.path.join(ICONS_DIR, "pll")
    pll_list = extract_pll(pll_icons_dir)
    print(f" -> Processed {len(pll_list)} PLL cases successfully.")
    
    print("\n[2/3] Extracting F2L cases (42 cells: 41 formulas + 1 solved)...")
    f2l_icons_dir = os.path.join(ICONS_DIR, "f2l")
    f2l_list = extract_f2l(f2l_icons_dir)
    print(f" -> Processed {len(f2l_list)} F2L cases successfully.")
    
    print("\n[3/3] Extracting OLL cases (57 formulas across 29 rows)...")
    oll_icons_dir = os.path.join(ICONS_DIR, "oll")
    oll_list = extract_oll(oll_icons_dir)
    print(f" -> Processed {len(oll_list)} OLL cases successfully.")
    
    database = {
        "metadata": {
            "title": "CFOP Solution Database for qqTimer",
            "version": "1.0.0",
            "total_cases": len(f2l_list) + len(oll_list) + len(pll_list),
            "stages": {
                "f2l": len(f2l_list),
                "oll": len(oll_list),
                "pll": len(pll_list)
            }
        },
        "stages": {
            "F2L": f2l_list,
            "OLL": oll_list,
            "PLL": pll_list
        }
    }
    
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
        
    js_output = os.path.join(SOLVE_DIR, "solutions_data.js")
    with open(js_output, "w", encoding="utf-8") as f:
        f.write("window.CFOP_SOLUTIONS = " + json.dumps(database, ensure_ascii=False, indent=2) + ";\n")
        
    print("\n" + "=" * 60)
    print(f" Extraction complete!")
    print(f" Total cases processed: {database['metadata']['total_cases']}")
    print(f" JSON Database: {JSON_OUTPUT}")
    print(f" JS Database:   {js_output}")
    print(f" Icons Directory: {ICONS_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
