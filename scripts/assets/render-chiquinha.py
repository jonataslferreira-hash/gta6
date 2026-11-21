"""Render an original radio performance of Chiquinha Gonzaga's public-domain score.
Usage: python scripts/assets/render-chiquinha.py input.krn output.mp3
Requires music21, numpy and imageio-ffmpeg in the Python environment.
"""
import sys
import subprocess
import numpy as np
from music21 import converter
from imageio_ffmpeg import get_ffmpeg_exe

source, target = sys.argv[1:]
score = converter.parse(source)
try:
    score = score.expandRepeats()
except Exception:
    pass  # Some **kern editions express sections using named variants, not repeat bars.

rate = 32000
beat = 60 / (112 if 'gaucho' in source else 103)
out = np.zeros((int(rate * (score.highestTime * beat + 1.65)), 2), dtype=np.float32)
for staff, part in enumerate(reversed(list(score.parts))):
    for i, item in enumerate(part.flatten().notes):
        when = int(rate * item.offset * beat)
        length = min(len(out) - when, int(rate * (float(item.quarterLength) * beat + .20)))
        if length <= 4:
            continue
        t = np.arange(length) / rate
        sustain = float(item.quarterLength) * beat
        env = np.minimum(1, t * (84 if staff == 0 else 180)) * np.exp(-t * (2.8 if staff == 0 else 4.2)) * np.exp(-np.maximum(0, t - sustain) * 17)
        for pitch in item.pitches:
            f = 440 * 2**((pitch.midi-69)/12)
            phase = np.pi * 2 * f * (t + (.00026*np.sin(t*31) if staff == 0 else 0))
            voice = (np.sin(phase) + .46*np.sin(2*phase+.09)*np.exp(-t*3) + .18*np.sin(3*phase)*np.exp(-t*7)) * env
            level = (.113 if staff == 0 else .096) / len(item.pitches)**.46
            pan = (-.16 if staff == 0 else .13) + (pitch.midi - 60)*.003
            for side in range(2):
                out[when:when+length, side] += voice * level * (1 + pan*(side*2-1))
for ms, gain in [(31,.048),(58,.039),(92,.021)]:
    d = int(ms * rate / 1000)
    out[d:] += out[:-d, ::-1].copy()*gain
out = np.tanh(out * (0.76 / np.max(np.abs(out))))
out[-rate // 2:] *= np.linspace(1,0,rate//2)[:,None]
subprocess.run([get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-f','s16le','-ar',str(rate),'-ac','2','-i','-','-c:a','libmp3lame','-b:a','96k',target], input=(out*32767).astype('<i2').tobytes(), check=True)
print(f'{target}: {len(out)/rate:.3f}s')
