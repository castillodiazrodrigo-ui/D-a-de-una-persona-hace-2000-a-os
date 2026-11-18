import json, sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "medium", device="cpu", compute_type="int8")
import wave, numpy as np
wf=wave.open(sys.argv[1]); a=np.frombuffer(wf.readframes(wf.getnframes()),np.int16).astype(np.float32)/32768
segs, info = m.transcribe(a, language="es", word_timestamps=True, beam_size=5)
out=[]
for s in segs:
    out.append({"start":s.start,"end":s.end,"text":s.text.strip(),"words":[{"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}")
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False, indent=1)
