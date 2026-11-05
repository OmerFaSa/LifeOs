# ADTS AAC -> duz (parcasiz) MP4/M4A, moov basta. Kullanim: mux.py girdi.aac cikti.mp4
import struct, sys

FREQ = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350]

def kutu(tur, *govde):
    g = b"".join(govde)
    return struct.pack(">I", 8 + len(g)) + tur + g

def tam(tur, surum, bayrak, *govde):
    return kutu(tur, struct.pack(">I", (surum << 24) | bayrak), *govde)

def adts(veri):
    i, kareler, bilgi = 0, [], None
    while i + 7 <= len(veri):
        assert veri[i] == 0xFF and (veri[i + 1] & 0xF6) == 0xF0, "senkron yok: %d" % i
        korumasiz = veri[i + 1] & 1
        profil = (veri[i + 2] >> 6) + 1
        fi = (veri[i + 2] >> 2) & 0xF
        kanal = ((veri[i + 2] & 1) << 2) | (veri[i + 3] >> 6)
        boy = ((veri[i + 3] & 3) << 11) | (veri[i + 4] << 3) | (veri[i + 5] >> 5)
        bas = 7 if korumasiz else 9
        kareler.append(veri[i + bas:i + boy])
        bilgi = (profil, fi, kanal)
        i += boy
    assert i == len(veri), "artik bayt"
    return kareler, bilgi

def mux(kareler, profil, fi, kanal):
    hz, n = FREQ[fi], len(kareler)
    sure_ms = n * 1024 * 1000 // hz
    asc = struct.pack(">H", (profil << 11) | (fi << 7) | (kanal << 3))
    tanim = lambda tag, g: bytes([tag, len(g)]) + g
    ort = sum(map(len, kareler)) * 8 * hz // (1024 * n)
    dcd = tanim(4, bytes([0x40, 0x15]) + b"\x00\x18\x00" + struct.pack(">II", ort, ort) + tanim(5, asc))
    esds = tam(b"esds", 0, 0, tanim(3, struct.pack(">HB", 1, 0) + dcd + tanim(6, b"\x02")))
    mp4a = kutu(b"mp4a", b"\x00" * 6, struct.pack(">H", 1), b"\x00" * 8, struct.pack(">HHHHI", kanal, 16, 0, 0, hz << 16), esds)
    matris = struct.pack(">9I", 0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000)

    def moov(ofset):
        stbl = kutu(b"stbl",
            tam(b"stsd", 0, 0, struct.pack(">I", 1), mp4a),
            tam(b"stts", 0, 0, struct.pack(">III", 1, n, 1024)),
            tam(b"stsc", 0, 0, struct.pack(">IIII", 1, 1, n, 1)),
            tam(b"stsz", 0, 0, struct.pack(">II", 0, n), b"".join(struct.pack(">I", len(k)) for k in kareler)),
            tam(b"stco", 0, 0, struct.pack(">II", 1, ofset)))
        minf = kutu(b"minf", tam(b"smhd", 0, 0, b"\x00" * 4),
                    kutu(b"dinf", tam(b"dref", 0, 0, struct.pack(">I", 1), tam(b"url ", 0, 1))), stbl)
        mdia = kutu(b"mdia", tam(b"mdhd", 0, 0, struct.pack(">IIIIHH", 0, 0, hz, n * 1024, 0x55C4, 0)),
                    tam(b"hdlr", 0, 0, b"\x00" * 4, b"soun", b"\x00" * 12, b"SoundHandler\x00"), minf)
        tkhd = tam(b"tkhd", 0, 7, struct.pack(">IIIII", 0, 0, 1, 0, sure_ms), b"\x00" * 8, struct.pack(">HHHH", 0, 0, 0x100, 0), matris, struct.pack(">II", 0, 0))
        mvhd = tam(b"mvhd", 0, 0, struct.pack(">IIIIIH", 0, 0, 1000, sure_ms, 0x10000, 0x100), b"\x00" * 10, matris, b"\x00" * 24, struct.pack(">I", 2))
        return kutu(b"moov", mvhd, kutu(b"trak", tkhd, mdia))

    ftyp = kutu(b"ftyp", b"M4A ", struct.pack(">I", 0), b"M4A isommp42")
    m = moov(0)
    ofset = len(ftyp) + len(m) + 8
    return ftyp + moov(ofset) + kutu(b"mdat", *kareler)

if __name__ == "__main__":
    kareler, (p, fi, k) = adts(open(sys.argv[1], "rb").read())
    cikti = mux(kareler, p, fi, k)
    open(sys.argv[2], "wb").write(cikti)
    print("kare", len(kareler), "hz", FREQ[fi], "kanal", k, "sure %.2f sn" % (len(kareler) * 1024 / FREQ[fi]), "bayt", len(cikti))
