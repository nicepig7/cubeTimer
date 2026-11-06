import os
from PIL import Image

solve_dir = r"d:\temp\ferdyTemp\qqtimer\solve"
scratch = r"C:\Users\SDS\.gemini\antigravity-ide\brain\be2688f9-e873-458b-b5b9-03d67a9c4283\scratch"
os.makedirs(scratch, exist_ok=True)

oll = Image.open(os.path.join(solve_dir, "oll_yshoon17.jpg"))
w, h = oll.size

# Let's crop text strips for OLL rows to read the formulas clearly
# Row height = 100
# Left col text: x: 104 to 365
# Right col text: x: 465 to 725
for r in range(0, 10):
    y1 = 4 + r * 100
    y2 = y1 + 100
    c1 = oll.crop((104, y1, 365, y2))
    c2 = oll.crop((465, y1, 725, y2))
    c1.save(os.path.join(scratch, f"oll_text_r{r+1:02d}_c1.png"))
    c2.save(os.path.join(scratch, f"oll_text_r{r+1:02d}_c2.png"))

print("Saved first 10 rows of OLL text crops.")
