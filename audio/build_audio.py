#!/usr/bin/env python3
# =====================================================================
#  DISEÑO DE AUDIO: música original + efectos de sonido sintetizados,
#  sincronizados con la animación (audio/cues.json exportado por el
#  motor) y mezclados bajo la narración original (sin alterarla).
#  Salida: out/mix.wav  (48 kHz estéreo)  + stems en out/stems/
# =====================================================================
import json, os, subprocess, sys, wave
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out'); os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
rng = np.random.default_rng(7)

# ---------------------------------------------------------------------
# utilidades
# ---------------------------------------------------------------------
def load_narration():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, 'audio/narracion.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, r=.1, curve=4.0):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n) / SR; e *= np.exp(-np.maximum(0, tt - a) * curve / max(r, 1e-3)); return e
def adsr(n, a, d, s, r):
    e = np.zeros(n); na, nd, nr = int(a * SR), int(d * SR), int(r * SR); ns = max(0, n - na - nd - nr)
    seg = [np.linspace(0, 1, na, endpoint=False), np.linspace(1, s, nd, endpoint=False), np.full(ns, s), np.linspace(s, 0, nr)]
    x = np.concatenate(seg)[:n]; e[:len(x)] = x; return e
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, order=2): b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, order=2): b, a = signal.butter(order, min(f / (SR / 2), .99), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, order=2): b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def norm(x, p=1.0): m = np.max(np.abs(x)) + 1e-9; return x / m * p
def sweep_bp(x, f0, f1, q=3.0, steps=40):
    # filtro paso banda con frecuencia central variable (por bloques con solapamiento)
    n = len(x); out = np.zeros(n); blk = max(256, n // steps); win = np.hanning(blk * 2)
    for i in range(0, n, blk):
        k = i / max(1, n - 1); fc = f0 * (f1 / f0) ** k; bw = fc / q
        seg = x[max(0, i - blk // 2): i + blk + blk // 2]
        y = bp(seg, max(30, fc - bw / 2), fc + bw / 2)
        s0 = max(0, i - blk // 2); w = np.hanning(len(y)); out[s0:s0 + len(y)] += y * w
    return out
def sine(f, d, ph=0): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (int(d * SR),)) / SR) + ph)
def saw(f, d):
    ph = np.cumsum(np.broadcast_to(np.asarray(f, float), (int(d * SR),)) / SR) % 1.0; return 2 * ph - 1
def pluck(f, d, bright=.5, decay=.996):  # Karplus-Strong (lira / arpa)
    n = int(d * SR); N = max(2, int(SR / f)); buf = rng.uniform(-1, 1, N) * 1.0
    buf = lp(buf, 1500 + bright * 6000, 1)
    out = np.zeros(n); idx = 0
    for i in range(n):
        out[i] = buf[idx]; nxt = (idx + 1) % N; buf[idx] = decay * .5 * (buf[idx] + buf[nxt]); idx = nxt
    return out * env(n, .002, d, 3)
def ir(d=2.2, damp=4000, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); tt = np.arange(n) / SR
    L = r.standard_normal(n) * np.exp(-tt * 6.9 / d); R = r.standard_normal(n) * np.exp(-tt * 6.9 / d)
    return lp(L, damp), lp(R, damp)
IR_HALL = ir(2.6, 5000, 1); IR_ROOM = ir(.6, 6000, 2); IR_BATH = ir(3.4, 3500, 4)
def reverb(x, irr=IR_HALL, wet=.3):
    L = signal.fftconvolve(x, irr[0])[:len(x)]; R = signal.fftconvolve(x, irr[1])[:len(x)]
    s = np.max(np.abs(L)) + 1e-9; k = np.max(np.abs(x)) / s if np.max(np.abs(x)) > 0 else 1
    return np.stack([x * (1 - wet) + L * k * wet, x * (1 - wet) + R * k * wet])
def stereo(x, pan=0.):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.41, x * r * 1.41]) if x.ndim == 1 else x
def place(bus, x, t, gain=1., pan=0.):
    x = stereo(x, pan) if x.ndim == 1 else x
    i = int(round(t * SR)); n = min(x.shape[1], bus.shape[1] - i)
    if n > 0 and i >= 0: bus[:, i:i + n] += x[:, :n] * gain

def addat(buf, c, s, g=1.):
    if s >= len(buf): return
    n = min(len(c), len(buf) - s); buf[s:s + n] += c[:n] * g

def mx(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)

def sum_(gen): return mx(*list(gen))

def midi(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------------
#  EFECTOS DE SONIDO (cada uno es un generador -> mono o estéreo)
# ---------------------------------------------------------------------
def fx_step(kind, i):
    v = 1 + .15 * np.sin(i * 1.7)
    if kind == 'stone':
        x = bp(noise(.09), 500 * v, 3500, 2) * env(int(.09 * SR), .001, .05, 5) * .8
        x = mx(x, sine(110 * v * np.linspace(1.2, .8, int(.09 * SR)), .09) * env(int(.09 * SR), .001, .04, 4) * .6)
    elif kind == 'wood':
        x = mx(bp(noise(.12), 180, 1500) * env(int(.12 * SR), .001, .07, 5), sine(150 * v, .12) * env(int(.12 * SR), .001, .05, 5) * .8)
    elif kind == 'hoof':
        x = np.zeros(int(.22 * SR))
        for off, f in ((0, 1150 * v), (.09, 900 * v)):
            c = bp(noise(.06), f * .7, f * 1.4, 2) * env(int(.06 * SR), .0005, .025, 6); s = int(off * SR); addat(x, c, s)
        x = mx(x, sine(90, .1) * env(int(.1 * SR), .001, .05, 5) * .5)
    return norm(x, .5)
def whoosh(d=.6, f0=300, f1=3000):
    x = sweep_bp(noise(d), f0, f1, 2.0); return norm(x * adsr(len(x), d * .55, .05, .8, d * .4), .7)
def clink(fs=(2100, 3420, 5230, 7100), d=.6, dec=(5, 7, 9, 12)):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) / (j + 1) for j, (f, k) in enumerate(zip(fs, dec)))
    x[:int(.002 * SR)] *= np.linspace(0, 1, int(.002 * SR)); return norm(x + bp(noise(d), 3000, 9000)[:len(tt)] * np.exp(-tt * 80) * .5, .6)
def bell(f=880, d=2.0):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (1.5 + m)) / (1 + m) for m in (1, 2.01, 2.76, 4.07, 5.43)); return norm(x, .6)
def thud(f=70, d=.35, n=.3):
    tt = t_(d); x = mx(np.sin(2 * np.pi * np.cumsum(f * np.exp(-tt * 8) + f * .5) / SR) * np.exp(-tt * 9), lp(noise(d), 800)[:len(tt)] * np.exp(-tt * 30) * n); return norm(x, .8)
def babble(d, dens=8, lo=250, hi=2500, seed=1):
    r = np.random.default_rng(seed); n = int(d * SR); x = np.zeros(n)
    for k in range(dens):
        rate = r.uniform(3, 6); ph = r.uniform(0, 6); tt = np.arange(n) / SR
        am = np.clip(np.sin(2 * np.pi * rate * tt + ph) * .5 + .5 + r.normal(0, .1), 0, 1) ** 2 * (np.sin(2 * np.pi * r.uniform(.1, .3) * tt + ph) * .5 + .5)
        f = r.uniform(lo, hi * .6); y = bp(r.standard_normal(n), f, f * 1.8) * am; x += y
    return norm(lp(x, 3000), .5)
def wind(d, f=500, q=1.5, seed=2, howl=False):
    r = np.random.default_rng(seed); x = r.standard_normal(int(d * SR))
    y = sweep_bp(x, f * .7, f * 1.3, q, 30) if howl else lp(x, f)
    am = .6 + .4 * np.sin(2 * np.pi * .23 * t_(d) + 1) * np.sin(2 * np.pi * .11 * t_(d)); return norm(y * am, .5)
def birds(d, n=6, seed=3):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(n):
        st = r.uniform(0, max(.01, d - .4)); f0 = r.uniform(2500, 5000); nn = r.integers(2, 6)
        for k in range(nn):
            dd = r.uniform(.04, .1); tt = t_(dd); f = f0 * (1 + .3 * np.sin(np.pi * tt / dd)) * r.uniform(.9, 1.1)
            c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dd) ** 2; s = int((st + k * .12) * SR); addat(out, c, s, .5)
    return out
def crickets(d, seed=4, rate=1.0):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for c in range(3):
        f = r.uniform(4200, 5200); per = r.uniform(.5, .9) / rate; t0 = r.uniform(0, per)
        while t0 < d - .2:
            for k in range(3):
                dd = .025; tt = t_(dd); ch = np.sin(2 * np.pi * f * tt) * np.sin(np.pi * tt / dd); s = int((t0 + k * .04) * SR)
                addat(out, ch, s, .3)
            t0 += per * r.uniform(.8, 1.2)
    return out
def fire(d, seed=5, crack=12):
    r = np.random.default_rng(seed); x = lp(r.standard_normal(int(d * SR)), 600) * .6
    for _ in range(int(d * crack)):
        s = int(r.uniform(0, d - .02) * SR); c = hp(r.standard_normal(int(.01 * SR)), 2000) * r.uniform(.3, 1); addat(x, c, s)
    return norm(x, .5)
def water_flow(d, seed=6, bright=1.):
    r = np.random.default_rng(seed); x = bp(r.standard_normal(int(d * SR)), 300, 6000 * bright) * .4
    for _ in range(int(d * 40)):
        s = int(r.uniform(0, d - .05) * SR); f = r.uniform(400, 1800); dd = r.uniform(.01, .04); tt = t_(dd)
        b = np.sin(2 * np.pi * f * (1 + tt * 30) * tt) * np.sin(np.pi * tt / dd); addat(x, b, s, r.uniform(.1, .4))
    return norm(x, .5)
def waves(d, seed=7):
    tt = t_(d); x = lp(np.random.default_rng(seed).standard_normal(len(tt)), 900) * (0.35 + .65 * (np.sin(2 * np.pi * tt / 4.2) * .5 + .5) ** 2); return norm(x, .5)
def creak(d=.5, f=180):
    tt = t_(d); fm = f * (1 + .25 * np.sin(2 * np.pi * 7 * tt) + .1 * np.sin(2 * np.pi * 23 * tt)); x = bp(saw(fm, d), 300, 2500) * adsr(len(tt), .05, .1, .7, .2); return norm(x, .4)
def gull(d=.5):
    tt = t_(d); f = 1400 * (1 + .5 * np.sin(np.pi * tt / d)) ; x = bp(saw(f, d), 1200, 4500) * np.sin(np.pi * tt / d) ** 1.5; return norm(x, .5)
def splash(d=.8, big=1.):
    tt = t_(d); x = mx(bp(noise(d), 300, 6000) * np.exp(-tt[:int(d * SR)] * (5 / big)), water_flow(d, 9)[:len(tt)] * np.exp(-tt * 3) * .4); return norm(x, .8)
def rumble_cart(d, seed=8):
    r = np.random.default_rng(seed); tt = t_(d); x = lp(r.standard_normal(len(tt)), 160) * 2.0
    for _ in range(int(d * 7)):
        s = int(r.uniform(0, d - .1) * SR); c = thud(r.uniform(60, 110), .12, .6) * r.uniform(.3, .8); addat(x, c, s)
    for _ in range(int(d * 1.2)):
        s = int(r.uniform(0, d - .6) * SR); c = creak(r.uniform(.3, .6), r.uniform(140, 260)) * .5; addat(x, c, s)
    return norm(x, .7)

def make_sfx(name, i, dur):
    d = dur
    if name.startswith('step_'): return fx_step(name[5:], i)
    S = {
        'whoosh': lambda: whoosh(.45, 400, 3500), 'whoosh_long': lambda: whoosh(1.2, 200, 4000),
        'dark_whoosh': lambda: mx(whoosh(1.6, 3000, 120), thud(45, 1.5, .1) * .6),
        'tick': lambda: norm(hp(noise(.01), 3000) * env(int(.01 * SR), .0005, .004), .3),
        'pop': lambda: norm(sine(np.linspace(300, 1100, int(.09 * SR)), .09) * env(int(.09 * SR), .002, .06, 3), .6),
        'poof': lambda: norm(mx(lp(noise(.6), 1800) * adsr(int(.6 * SR), .01, .1, .4, .45), thud(80, .4, .2) * .5), .8),
        'stamp': lambda: thud(90, .25, .6),
        'shutter': lambda: np.concatenate([creak(.35, 220), thud(140, .2, .8) * .7]),
        'shimmer': lambda: norm(sum_(np.pad(bell(midi(m), 1.5) * .5, (int(k * .07 * SR), 0))[:int(1.8 * SR)] for k, m in enumerate([86, 90, 93, 98, 102])), .5),
        'stretch': lambda: norm(bp(noise(.7), 800, 5000) * (np.sin(np.pi * t_(.7) / .7) * (.6 + .4 * np.sin(2 * np.pi * 9 * t_(.7)))), .3),
        'birds': lambda: birds(2.5, 6, i + 3), 'rooster': lambda: birds(2.0, 8, 11),
        'chime': lambda: bell(midi(81), 2.5), 'ding': lambda: bell(midi(88), 1.5),
        'boom_soft': lambda: norm(mx(thud(42, 2.5, .15), lp(noise(2.5), 200) * np.exp(-t_(2.5) * 2) * .5), .9),
        'fan': lambda: norm(sum_(np.pad(whoosh(.18, 600, 2500), (int(k * .22 * SR), 0))[:int(.9 * SR)] for k in range(4)), .3),
        'wind_cold': lambda: wind(1.9, 700, 3, 5, True),
        'shiver': lambda: norm(sum_(np.pad(hp(noise(.008), 2500) * env(int(.008 * SR), .0005, .004), (int(k * .045 * SR), 0))[:int(1.1 * SR)] for k in range(24)), .35),
        'blink': lambda: norm(sine(2400, .05) * env(int(.05 * SR), .001, .03, 5), .25),
        'rumble_lift': lambda: norm(mx(lp(noise(1.0), 220) * adsr(int(SR), .2, .2, .7, .5) * 2, whoosh(1.0, 200, 2500) * .6), .8),
        'coin_stack': lambda: norm(sum_(np.pad(clink((2400 + k * 130, 3700, 5600, 7400), .5), (int(k * .06 * SR), 0))[:int(.8 * SR)] for k in range(3)), .6),
        'coin': lambda: clink(), 'coin_drop': lambda: norm(sum_(np.pad(clink(d=.3) * (.8 ** k), (int((.12 * k - .006 * k * k) * SR), 0))[:int(.9 * SR)] for k in range(6)), .6),
        'jar_shake': lambda: norm(sum_(np.pad(thud(220, .12, .8), (int(k * .1 * SR), 0))[:int(.6 * SR)] for k in range(5)), .5),
        'drip': lambda: norm(sine(np.linspace(500, 1700, int(.07 * SR)), .07) * env(int(.07 * SR), .001, .05, 4), .6),
        'sad_horn': lambda: norm(lp(saw(np.concatenate([np.full(int(.3 * SR), 233.), np.linspace(220, 196, int(.6 * SR))]), .9), 1200) * adsr(int(.9 * SR), .03, .1, .8, .3), .35),
        'fountain': lambda: water_flow(d, 6), 'jar_fill': lambda: norm(sweep_bp(water_flow(.9, 3), 500, 1600, 4) * adsr(int(.9 * SR), .05, .1, .9, .2), .6),
        'stool': lambda: creak(.3, 260), 'pop_plate': lambda: norm(mx(thud(330, .15, .4), clink((1600, 2900, 4100), .15) * .3), .5),
        'crunch': lambda: norm(sum_(np.pad(bp(noise(.03), 1500, 7000) * env(int(.03 * SR), .001, .02), (int(k * .05 * SR), 0))[:int(.35 * SR)] for k in range(6)), .4),
        'sparkle': lambda: norm(sum_(np.pad(bell(midi(m), 1.0), (int(k * .05 * SR), 0))[:int(1.4 * SR)] for k, m in enumerate([93, 97, 100, 105])), .4),
        'yum': lambda: bell(midi(84), 1.0) * .5,
        'door': lambda: np.concatenate([creak(.5, 160), thud(110, .25, .7)]),
        'gull': lambda: np.concatenate([gull(.35), np.zeros(int(.1 * SR)), gull(.3) * .7]),
        'creak': lambda: creak(.6, 150), 'anvil': lambda: norm(mx(clink((520, 1380, 2310, 3720, 5100), 1.4, (2.5, 3.5, 4.5, 6, 8)), thud(120, .2, 1) * .6), 1.0),
        'wheel': lambda: norm(sine(55, d) * .3 + lp(noise(d), 300) * .5 * (1 + .3 * np.sin(2 * np.pi * 1.4 * t_(d))), .35),
        'clay': lambda: norm(lp(noise(.5), 700) * np.sin(np.pi * t_(.5) / .5) ** 2, .3),
        'sizzle': lambda: norm(hp(noise(d), 3000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 13 * t_(d)))) * .5 + fire(d, 4) * .3, .3),
        'bowl': lambda: norm(mx(clink((1200, 2600, 3900), .4, (8, 10, 12)), thud(250, .1, .3) * .3), .5),
        'splash': lambda: splash(1.0, 1.2), 'splash_small': lambda: splash(.5, .6) * .6,
        'murmur': lambda: babble(1.6, 6, seed=i + 2), 'handshake': lambda: norm(bp(noise(.05), 800, 5000) * env(int(.05 * SR), .001, .025), .6),
        'pot': lambda: thud(160, .3, .8), 'cutlery': lambda: norm(sum_(np.pad(clink((2600 + 300 * k, 4100, 6000), .25), (int(k * .13 * SR), 0))[:int(.8 * SR)] for k in range(4)), .35),
        'crickets': lambda: crickets(d, 4), 'owl': lambda: norm(np.concatenate([sine(380, .35) * adsr(int(.35 * SR), .05, .1, .7, .15), np.zeros(int(.12 * SR)), sine(360, .55) * adsr(int(.55 * SR), .05, .1, .7, .3)]), .3),
        'strike': lambda: norm(mx(hp(noise(.04), 2500) * env(int(.04 * SR), .0005, .02), clink((3000, 5200), .1) * .3), .5),
        'ignite': lambda: norm(mx(sweep_bp(noise(.7), 200, 1500, 1.5) * adsr(int(.7 * SR), .05, .15, .5, .45), thud(70, .5, .2) * .7), .8),
        'flame_loop': lambda: fire(d, 5, 8), 'torch_loop': lambda: fire(d, 6, 10),
        'dog': lambda: norm(np.concatenate([bp(saw(np.linspace(520, 300, int(.12 * SR)), .12), 400, 1800) * env(int(.12 * SR), .005, .1, 3), np.zeros(int(.18 * SR)), bp(saw(np.linspace(480, 290, int(.12 * SR)), .12), 400, 1800) * env(int(.12 * SR), .005, .1, 3)]), .35),
        'cart_far': lambda: norm(rumble_cart(d, 3) * adsr(int(d * SR), d * .4, .1, .8, d * .4), .5),
        'cart_roll': lambda: rumble_cart(d, 8), 'cart_roll2': lambda: rumble_cart(d, 9),
        'mule_snort': lambda: norm(bp(noise(.35), 600, 2500) * adsr(int(.35 * SR), .02, .05, .6, .25), .5),
        'cicadas': lambda: norm(bp(noise(d), 4000, 7000) * (.5 + .5 * np.sin(2 * np.pi * 38 * t_(d))) ** 2, .35),
    }
    if name in S: return S[name]()
    # --- ambientes (duración = hasta el final del plano) ---
    A = {
        'amb_dawn': lambda: mx(wind(d, 400) * .5, birds(d, int(d * 2.5), 21) * .5),
        'amb_day': lambda: mx(wind(d, 500) * .4, birds(d, int(d * 1.2), 22) * .35, babble(d, 4, seed=5) * .15),
        'amb_street': lambda: mx(babble(d, 10, seed=i + 7) * .6, wind(d, 300) * .25, birds(d, 2, i + 30) * .15),
        'amb_market': lambda: mx(babble(d, 16, seed=i + 9) * .9, np.zeros(1)),
        'amb_room': lambda: mx(lp(noise(d), 300) * .05, babble(d, 4, seed=i + 13) * .12, birds(d, 2, i + 40) * .15),
        'amb_forge': lambda: mx(fire(d, i + 3, 6) * .7, lp(noise(d), 120) * .3),
        'amb_port': lambda: mx(waves(d, i) * .7, babble(d, 6, seed=i + 2) * .25, np.pad(gull(.4), (int(min(d - .5, .9) * SR), 0))[:int(d * SR)] * .4),
        'amb_baths_out': lambda: mx(babble(d, 10, seed=i + 3) * .5, water_flow(d, i + 1) * .25, birds(d, 3, 50) * .2),
        'amb_baths_in': lambda: mx(water_flow(d, i + 4, .4) * .5, babble(d, 8, seed=i + 5) * .35),
        'amb_dusk': lambda: mx(crickets(d, 6, .6) * .5, wind(d, 350) * .3),
        'amb_night': lambda: mx(crickets(d, 7) * .6, wind(d, 300) * .35),
        'amb_night_room': lambda: mx(crickets(d, 8, .7) * .45, rumble_cart(d, 12) * .12),
        'amb_night_city': lambda: mx(crickets(d, 9) * .5, rumble_cart(d, 13) * .3, wind(d, 300) * .3),
    }
    if name in A:
        x = A[name](); n = len(x); fade = min(int(.25 * SR), n // 4)
        x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade); return x
    print('  (sfx desconocido)', name); return np.zeros(10)

# Colocación espacial / reverberación por tipo de lugar (según el plano)
def space_for(t, shots):
    sh = next((s for s in reversed(shots) if t >= s['t0'] - 1e-6), shots[0])
    return {'bathsInt': IR_BATH, 'bedroom': IR_ROOM, 'workshop': IR_ROOM}.get(sh['set'], IR_HALL), sh

LOOPS = {'fountain', 'flame_loop', 'torch_loop', 'cart_roll', 'cart_roll2', 'cicadas', 'crickets', 'wheel', 'sizzle', 'cart_far'}

# ---------------------------------------------------------------------
#  MÚSICA ORIGINAL POR SECCIONES (modo dórico en Re, 100 BPM)
# ---------------------------------------------------------------------
BPM = 100; BEAT = 60 / BPM
def pad(chord, d, cutoff=1400, det=.12, vol=.18):
    tt = t_(d); x = sum(saw(midi(m) * (1 + det * k / 100), d) for m in chord for k in (-1, 0, 1)) / (3 * len(chord))
    x = lp(x, cutoff, 2); return x * adsr(len(tt), min(1.2, d * .3), .3, .85, min(1.5, d * .35)) * vol
def flute(m, d, vol=.16):
    tt = t_(d); f = midi(m) * (1 + .006 * np.sin(2 * np.pi * 5.2 * tt) * np.clip(tt * 2, 0, 1))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + .25 * np.sin(4 * np.pi * np.cumsum(f) / SR) + bp(noise(d), midi(m), midi(m) * 3) * .08
    return x * adsr(len(tt), .08, .1, .8, min(.4, d * .4)) * vol
def drum(kind):
    if kind == 'doum': return thud(75, .45, .25) * .8
    if kind == 'tek': return norm(bp(noise(.08), 1800, 8000) * env(int(.08 * SR), .001, .04, 6), .35) + sine(320, .08) * env(int(.08 * SR), .001, .03, 6) * .2
    if kind == 'ka': return norm(bp(noise(.05), 900, 4000) * env(int(.05 * SR), .001, .02, 6), .25)
    if kind == 'taiko': return norm(thud(52, 1.0, .35) + lp(noise(1.0), 300) * np.exp(-t_(1.0) * 6) * .4, 1.0)
DM = [62, 65, 69, 72]; C = [60, 64, 67, 71]; BB = [58, 62, 65, 69]; F = [53, 60, 65, 69]; GM = [55, 62, 67, 70]; AM = [57, 64, 69, 72]; DMAJ = [62, 66, 69, 74]

def build_music(D):
    n = int(D * SR); mus = np.zeros((2, n)); drums = np.zeros((2, n))
    def add(x, t, g=1., pan=0., bus=None): place(mus if bus is None else bus, x, t, g, pan)
    # secciones: (inicio, fin, acordes por compás, patrón de batería, intensidad)
    sections = [
        (0.0, 6.3, [DM, BB], None, .6, 'dawn'),
        (6.3, 11.75, [DM, C, BB, C], 'light', .8, 'day'),
        (11.75, 13.4, [F, C], 'light', .8, 'summer'),
        (13.4, 15.35, [DM, AM], None, .6, 'winter'),
        (15.35, 34.5, [DM, C, BB, C], 'groove', 1.0, 'city'),
        (34.5, 39.75, [DM, C, DM, AM], 'work', 1.1, 'work'),
        (39.75, 42.25, [F, C], 'groove', .9, 'noon'),
        (42.25, 50.0, [F, C, DM, BB], 'soft', .85, 'baths'),
        (50.0, 52.3, [BB, F], None, .7, 'dusk'),
        (52.3, 56.55, [DM, GM], None, .55, 'dark'),
        (56.55, 59.1, [DM, BB], 'pulse', .75, 'tension'),
        (59.1, 63.75, [DM, BB, GM, AM], 'night', 1.0, 'carts'),
        (63.75, D, [BB, F, DMAJ], None, .65, 'sleep'),
    ]
    bar = BEAT * 4
    for (s0, s1, chords, dr, inten, tag) in sections:
        L = s1 - s0; nb = max(1, int(np.ceil(L / bar)))
        # pads con fundido entre secciones
        for b in range(nb):
            ch = chords[b % len(chords)]; t0 = s0 + b * bar; dd = min(bar + .8, s1 - t0 + .9)
            if dd <= .1: continue
            cut = {'winter': 2600, 'dark': 700, 'tension': 900, 'carts': 1100, 'sleep': 1300, 'dawn': 1100}.get(tag, 1700)
            add(pad(ch, dd, cut, vol=.16 * inten), t0, pan=0)
            # bajo
            if tag not in ('dawn', 'winter', 'sleep'): add(pluck(midi(ch[0] - 24), min(bar, s1 - t0) + .3, .2, .997) * .45 * inten, t0)
            else: add(lp(saw(midi(ch[0] - 24), min(bar + .5, s1 - t0 + .5)), 300) * adsr(int(min(bar + .5, s1 - t0 + .5) * SR), .6, .2, .8, .5) * .12, t0)
        # lira: arpegios
        step = BEAT / (2 if tag in ('city', 'work', 'noon', 'day', 'summer') else 1)
        if tag in ('carts', 'tension', 'dark'): step = BEAT
        k = 0; t = s0
        while t < s1 - .05:
            b = int((t - s0) / bar); ch = chords[b % len(chords)]
            pattern = [0, 2, 1, 3, 2, 1, 3, 1] if tag != 'sleep' else [0, 1, 2, 3, 2, 1]
            note = ch[pattern[k % len(pattern)]] + (12 if tag in ('summer', 'baths', 'sleep', 'winter') else 0)
            if tag == 'dark' and k % 2: k += 1; t += step; continue
            v = (.22 if k % 4 == 0 else .14) * inten
            add(pluck(midi(note), 1.6, .55, .9965) * v, t, pan=.25 * np.sin(k * .9))
            k += 1; t += step
        # batería
        if dr:
            t = s0; k = 0
            while t < s1 - .05:
                pos = k % 8
                if dr in ('groove', 'work', 'light', 'soft'):
                    if pos in (0, 3) or (dr == 'work' and pos == 6): add(drum('doum'), t, .7 * inten, bus=drums)
                    if pos in (2, 6) and dr != 'soft': add(drum('tek'), t, .55 * inten, bus=drums)
                    if dr in ('groove', 'work') and pos in (1, 5, 7): add(drum('ka'), t, .4 * inten, pan=.3, bus=drums)
                    if dr == 'soft' and pos == 4: add(drum('tek'), t, .25, bus=drums)
                if dr == 'pulse' and pos in (0, 4): add(drum('taiko'), t, .55, bus=drums)
                if dr == 'night':
                    if pos in (0, 3, 6): add(drum('taiko'), t, .7, bus=drums)
                    if pos in (2, 7): add(drum('ka'), t, .35, bus=drums)
                k += 1; t += BEAT / 2
        # flauta: motivo en secciones clave
        motifs = {'dawn': [(69, 1.5), (72, .75), (74, 1.5)], 'city': [(74, .5), (72, .5), (69, 1), (67, .5), (69, 1.5)], 'baths': [(77, 1), (76, .5), (74, 1.5)],
                  'sleep': [(74, 1), (73, .5), (74, 2)], 'day': [(69, .5), (72, .5), (74, 1)], 'carts': [(62, 1), (63, .5), (62, 1.5)]}
        if tag in motifs:
            starts = [s0 + .4] if tag != 'city' else [s0 + .2, s0 + 8.2, s0 + 15.6]
            for st in starts:
                t = st
                for (m, l) in motifs[tag]:
                    dd = l * BEAT * 2
                    if t + dd > s1 + .3: break
                    add(flute(m, dd, .12 * inten), t, pan=-.2); t += dd
        if tag == 'winter': add(norm(sum(sine(midi(m), 2.0) * (.5 + .5 * np.sin(2 * np.pi * 6 * t_(2.0))) for m in (86, 89, 93)), .08) * adsr(int(2 * SR), .3, .3, .8, .8), s0)
    # acorde final y cola
    add(pad(DMAJ, 3.0, 1600, vol=.2), D - 3.0)
    add(pluck(midi(74), 3.0, .6, .9975) * .3, D - 2.2); add(pluck(midi(78), 3.0, .6, .9975) * .25, D - 2.0); add(pluck(midi(81), 3.0, .6, .9975) * .22, D - 1.8)
    mus = np.stack([reverb(mus[0], IR_HALL, .35)[0], reverb(mus[1], IR_HALL, .35)[1]])
    drums = np.stack([reverb(drums[0], IR_ROOM, .2)[0], reverb(drums[1], IR_ROOM, .2)[1]])
    return mus + drums * .8

# ---------------------------------------------------------------------
def main():
    narr = load_narration(); D = len(narr) / SR
    print('narración:', round(D, 3), 's')
    cues = json.load(open(os.path.join(ROOT, 'audio/cues.json')))
    shots = json.load(open(os.path.join(OUT, 'shots.json')))
    n = len(narr)
    sfx = np.zeros((2, n)); amb = np.zeros((2, n))
    counts = {}
    for c in cues:
        name, t, g = c['name'], c['t'], c.get('gain', 1)
        if g <= 0: continue
        irr, sh = space_for(t + .001, shots)
        end = sh['t1']; dur = max(.3, end - t + .25)
        i = counts.get(name, 0); counts[name] = i + 1
        x = make_sfx(name, i, dur)
        if name in LOOPS:
            x = x[:int(dur * SR)]; f = min(int(.3 * SR), len(x) // 3); x[-f:] *= np.linspace(1, 0, f); x[:min(f, int(.05 * SR))] *= np.linspace(0, 1, min(f, int(.05 * SR)))
        pan = 0.
        if name.startswith('step_'): pan = .15 * np.sin(i * 1.3)
        wet = .35 if irr is IR_BATH else .18
        y = reverb(x, irr, wet)
        bus = amb if name.startswith('amb_') else sfx
        place(bus, y, t, g)
    music = build_music(D)[:, :n]
    if music.shape[1] < n: music = np.pad(music, ((0, 0), (0, n - music.shape[1])))
    # --- ducking: la música y los ambientes bajan cuando habla el narrador ---
    e = np.abs(narr); e = signal.lfilter([1 - np.exp(-1 / (.03 * SR))], [1, -np.exp(-1 / (.03 * SR))], e)
    lvl = e / (np.percentile(e, 98) + 1e-9)
    duck = 1 - .45 * np.clip(lvl * 2.5, 0, 1)
    duck = signal.lfilter([1 - np.exp(-1 / (.12 * SR))], [1, -np.exp(-1 / (.12 * SR))], duck)
    # niveles relativos a la narración (que se deja intacta, ganancia 1.0)
    pk = np.max(np.abs(narr))
    music *= pk * .62 / (np.max(np.abs(music)) + 1e-9)
    amb *= pk * .30 / (np.max(np.abs(amb)) + 1e-9)
    sfx *= pk * .62 / (np.max(np.abs(sfx)) + 1e-9)
    music *= duck; amb *= (.55 + .45 * duck)
    voice = np.stack([narr, narr])
    mix = voice + music + amb + sfx
    # limitador suave sólo si hay picos (la voz no se altera fuera de los picos de la mezcla)
    peak = np.max(np.abs(mix))
    if peak > .97:
        g = np.minimum(1, .97 / (np.abs(mix).max(axis=0) + 1e-9)); g = signal.lfilter([1 - np.exp(-1 / (.004 * SR))], [1, -np.exp(-1 / (.004 * SR))], g)
        g = np.minimum(g, np.minimum(1, .97 / (np.abs(mix).max(axis=0) + 1e-9))); mix *= g
    def write(path, x):
        x = np.clip(x, -1, 1); d = (x.T * 32767).astype('<i2')
        with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
    write(os.path.join(OUT, 'mix.wav'), mix)
    write(os.path.join(OUT, 'stems/music.wav'), music); write(os.path.join(OUT, 'stems/sfx.wav'), sfx); write(os.path.join(OUT, 'stems/amb.wav'), amb)
    print('mezcla escrita:', round(mix.shape[1] / SR, 3), 's  pico', round(float(np.max(np.abs(mix))), 3), ' sfx:', sum(counts.values()))

if __name__ == '__main__':
    main()
