import os
import glob

log_dir = r"C:\Users\rakes\.gemini\antigravity\brain\e4b875f7-cd85-423a-9e15-098e22bc98bb\.system_generated\logs"
index_path = r"C:\Users\rakes\Downloads\portfolio-v9-fixed\index.html"

log_files = glob.glob(os.path.join(log_dir, "*.txt"))
log_files.sort(key=os.path.getmtime, reverse=True)

hero_html = None

for lf in log_files:
    try:
        with open(lf, "r", encoding="utf-8") as f:
            content = f.read()

        marker = "i want this to be in my portfolio after loding page then in hero section"
        idx = content.rfind(marker)
        
        if idx != -1:
            start_tag = "<!-- ========================================================\n     HERO\n======================================================== -->"
            # Some platforms might have \r\n
            start_tag_alt = "<!-- ========================================================\r\n     HERO\r\n======================================================== -->"
            
            idx_start = content.find(start_tag, idx)
            if idx_start == -1:
                idx_start = content.find(start_tag_alt, idx)
            if idx_start == -1:
                # Fallback to straight <section>
                idx_start = content.find('<section class="hero"', idx)

            idx_end = content.find("</html>", idx_start)

            if idx_start != -1 and idx_end != -1:
                hero_html = content[idx_start:idx_end + len("</html>")]
                print(f"Extracted hero_html length: {len(hero_html)}")
                break
    except Exception as e:
        print(f"Error reading {lf}: {e}")

if not hero_html:
    print("Failed to find payload in logs.")
    exit(1)

with open(index_path, "r", encoding="utf-8") as f:
    old_content = f.read()

cut_idx = old_content.find("<!-- ========================================================\n     HERO")
if cut_idx == -1:
    cut_idx = old_content.find("<!-- ========================================================\r\n     HERO")
if cut_idx == -1:
    cut_idx = old_content.find('<section class="hero"')

if cut_idx == -1:
    print("Could not find insertion point in index.html")
    exit(1)

new_content = old_content[:cut_idx] + hero_html + "\n"

with open(index_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully spliced html.")
