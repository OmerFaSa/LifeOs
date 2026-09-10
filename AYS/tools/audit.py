#!/usr/bin/env python3
"""Kod tabani denetimi: satir sayilari, HTML string yogunlugu, tekrar eden kaliplar."""
import io, glob, re, collections, os

SEP = os.sep

def norm(p):
    return p.replace("\\", "/")

def main():
    rows = []
    files = sorted(glob.glob('src/**/*.js', recursive=True)
                   + glob.glob('src/**/*.css', recursive=True)
                   + ['src/index.html'])
    for f in files:
        n = norm(f)
        if '/tests/' in n:
            continue
        s = io.open(f, encoding='utf-8').read()
        lines = s.count('\n') + 1
        concat = len(re.findall(r"\+\s*'<", s))
        esc = s.count('U.esc(')
        rows.append((n, lines, concat, esc, len(s)))

    rows.sort(key=lambda r: -r[1])
    print(f"{'dosya':44} {'satir':>6} {'concat':>7} {'esc':>5} {'kb':>6}")
    tot = [0, 0, 0, 0]
    for f, l, c, e, b in rows:
        print(f"{f:44} {l:6} {c:7} {e:5} {b/1024:6.1f}")
        tot[0] += l; tot[1] += c; tot[2] += e; tot[3] += b
    print(f"{'TOPLAM':44} {tot[0]:6} {tot[1]:7} {tot[2]:5} {tot[3]/1024:6.1f}")

    cls = collections.Counter()
    for f in glob.glob('src/js/**/*.js', recursive=True):
        if '/tests/' in norm(f):
            continue
        s = io.open(f, encoding='utf-8').read()
        for m in re.findall(r'class="([a-z][\w\- ]{2,40})"', s):
            cls[m.split()[0]] += 1
    print('\nen sik class:', cls.most_common(12))

    # tekrar eden yapisal kaliplar
    pats = {
        "card__head bloklari": r"card__head",
        "UI.stat cagrilari": r"UI\.stat\(",
        "UI.badge cagrilari": r"UI\.badge\(",
        "UI.table cagrilari": r"UI\.table\(",
        "UI.notice cagrilari": r"UI\.notice\(",
        "UI.hint cagrilari": r"UI\.hint\(",
        "inline style": r'style="',
        "data-act": r'data-act="',
        "data-change": r'data-change="',
    }
    counts = collections.Counter()
    for f in glob.glob('src/js/**/*.js', recursive=True):
        if '/tests/' in norm(f):
            continue
        s = io.open(f, encoding='utf-8').read()
        for k, rx in pats.items():
            counts[k] += len(re.findall(rx, s))
    print('\ntekrar eden kaliplar:')
    for k, v in counts.most_common():
        print(f"  {k:26} {v}")

    if os.path.exists('dist/rota.html'):
        d = io.open('dist/rota.html', encoding='utf-8').read()
        print(f"\ndist/rota.html: {d.count(chr(10))+1} satir, {len(d)/1024:.0f} KB")

if __name__ == '__main__':
    main()
