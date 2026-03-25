import sys
import glob

# Try reading all log files
log_files = glob.glob(r'C:\Users\rakes\.gemini\antigravity\brain\e4b875f7-cd85-423a-9e15-098e22bc98bb\.system_generated\logs\*.txt')
hero_html = ""

for lf in log_files:
    with open(lf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We know the prompt contains this exact string
    if "i want this to be in my portfolio after loding page then in hero section" in content:
        # Start of HTML
        idx_start = content.find('<section class="hero" id="hero">')
        if idx_start == -1:
            continue
            
        # The user provided the HTML down to </html>
        idx_end = content.find('</html>', idx_start)
        if idx_end == -1:
            continue
            
        hero_html = content[idx_start:idx_end + len('</html>')]
        print(f"Found HTML snippet of length {len(hero_html)} in {lf}")
        break

if not hero_html:
    print("Could not find the HTML snippet.")
    sys.exit(1)

# Now read index.html
index_file = r'C:\Users\rakes\Downloads\portfolio-v9-fixed\index.html'
with open(index_file, 'r', encoding='utf-8') as f:
    idx_content = f.read()

# We need everything before <section class="hero" id="hero">
# including the intro comments if possible
split_pts = [
    '<!-- ========================================================\n     HERO',
    '<!-- ========================================================\r\n     HERO',
    '<section class="hero" id="hero">'
]

cut_idx = -1
for pt in split_pts:
    cut_idx = idx_content.find(pt)
    if cut_idx != -1:
        break

if cut_idx == -1:
    print("Could not find where to split index.html")
    sys.exit(1)

new_index_content = idx_content[:cut_idx] + hero_html + "\n"

with open(index_file, 'w', encoding='utf-8') as f:
    f.write(new_index_content)
    
print("Successfully wrote new index.html!")
