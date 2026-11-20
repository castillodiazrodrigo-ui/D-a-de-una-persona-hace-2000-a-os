#!/usr/bin/env python3
# =====================================================================
#  AUDIO DEL EPISODIO 1 — música original + SFX sintetizados (sin
#  muestras de terceros), sincronizados con ep1/audio/cues.json y
#  mezclados por debajo de la narración original (ganancia 1,0).
# =====================================================================
import json, os, sys, subprocess, wave
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.path.dirname(EP), 'audio'))
import build_audio as B   # sintetizadores del proyecto anterior (mismo repositorio)
from build_audio import (SR, noise, bp, lp, hp, sine, saw, pluck, adsr, env, norm, t_, midi, mx, sum_, addat, reverb, place,
                         whoosh, clink, bell, thud, babble, wind, creak, sweep_bp, fx_step, IR_HALL, IR_ROOM)
rng = np.random.default_rng(11)
IR_MALL = B.ir(3.0, 4500, 21); IR_SMALL = B.ir(.45, 6000, 22)

def narration():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'narracion.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

# ---------------- efectos de sonido ----------------
def drone(d, f=55, dark=1.0, seed=1):
    tt = t_(d); x = sum(lp(saw(f * m * (1 + .003 * np.sin(2 * np.pi * .1 * tt + m)), d), 400 * dark) / m for m in (1, 1.5, 2.01))
    return norm(x * (.7 + .3 * np.sin(2 * np.pi * .13 * tt)), .5)
def riser(d=1.2, f0=200, f1=2400):
    return norm(mx(sweep_bp(noise(d), f0, f1, 3) * np.linspace(0, 1, int(d * SR)) ** 2, sine(np.linspace(80, 160, int(d * SR)), d) * np.linspace(0, .5, int(d * SR))), .7)
def sting(d=1.4, big=False):
    tt = t_(d); fs = [55, 58.3, 82.4, 116.5, 233] if big else [110, 116.5, 164.8]
    x = sum(saw(f, d) for f in fs) / len(fs); x = lp(x, 2500 if big else 1800) * np.exp(-tt * (1.6 if big else 2.4))
    return norm(mx(x, thud(48, d, .3) * (.9 if big else .5), hp(noise(d), 3000) * np.exp(-tt * 9) * .3), .95)
def heartbeat(d=2.0, bpm=70):
    d = max(d, .8)
    out = np.zeros(int(d * SR)); per = 60 / bpm
    for k in range(int(d / per) + 1):
        for off, g in ((0, 1), (.16, .7)): addat(out, thud(55, .25, .05) * g, int((k * per + off) * SR))
    return norm(lp(out, 300), .9)
def glitch(d=.5):
    n = int(d * SR); x = np.zeros(n); pos = 0
    while pos < n:
        L = int(rng.uniform(.01, .06) * SR); kind = rng.integers(0, 3)
        seg = sine(rng.uniform(200, 3000), L / SR) if kind == 0 else (np.sign(saw(rng.uniform(60, 400), L / SR)) if kind == 1 else hp(noise(L / SR), 2000))
        addat(x, seg * rng.uniform(.4, 1), pos); pos += L + int(rng.uniform(0, .02) * SR)
    return norm(x * adsr(n, .005, .05, .9, .05), .6)
def static(d): return norm(bp(noise(d), 1200, 9000) * (.6 + .4 * np.sin(2 * np.pi * 50 * t_(d))), .35)
def hum(d, f=60): tt = t_(d); return norm(sine(f, d) + .5 * sine(f * 2, d) + .25 * sine(f * 3, d) + bp(noise(d), 4000, 8000) * .05, .35)
def beep(f=880, d=.12): return norm(sine(f, d) * adsr(int(d * SR), .005, .02, .8, .03), .4)
def chain(d=.8):
    out = np.zeros(int(d * SR))
    for k in range(14): addat(out, clink((2600 + rng.uniform(-400, 600), 4100, 6200), .2, (14, 18, 22)) * rng.uniform(.3, 1), int(rng.uniform(0, d - .2) * SR))
    return norm(out, .7)
def shutter_rattle(d=.9): out = np.zeros(int(d * SR)); [addat(out, bp(noise(.06), 300, 3000) * env(int(.06 * SR), .002, .04) * rng.uniform(.4, 1), int(k * .05 * SR)) for k in range(int(d / .05))]; return norm(lp(out, 3500), .5)
def curtain(): x = bp(noise(.6), 900, 6000) * adsr(int(.6 * SR), .02, .1, .7, .3); return norm(mx(x, clink((3200, 5100), .1) * .2), .55)
def snore(): tt = t_(1.0); return norm(lp(saw(np.linspace(85, 70, len(tt)), 1.0) * (np.sin(np.pi * tt) ** 2) * (1 + .5 * np.sin(2 * np.pi * 28 * tt)), 600), .4)
def spin_down(d=1.2): tt = t_(d); f = 90 * np.exp(-tt * 2.2) + 8; return norm(mx(sine(f, d) * np.exp(-tt * 1.2), bp(noise(d), 300, 1500) * np.exp(-tt * 3) * .3), .5)
def clunk(): return norm(mx(thud(70, .35, .5), clink((900, 1600), .2, (20, 30)) * .4), .8)
def power_down(): tt = t_(1.3); return norm(mx(saw(np.linspace(220, 30, len(tt)), 1.3) * np.exp(-tt * 2) * .4, thud(45, 1.0, .3)), .8)
def music_box_track(d, start_t):
    # melodía original de caja musical (vals en La menor, 3/4) con timbre de celesta
    mel = [(76, 1), (72, .5), (69, .5), (71, 1), (68, 1), (69, .5), (71, .5), (72, 1), (64, 1.5), (76, 1), (77, .5), (76, .5), (74, 1), (71, 1), (72, .5), (71, .5), (69, 2)]
    beat = .34; out = np.zeros(int(d * SR)); t = 0.; i = 0
    while t < d - .1:
        m, l = mel[i % len(mel)]; tt = t_(1.6)
        tone = sum(np.sin(2 * np.pi * midi(m) * h * tt) * np.exp(-tt * (3 + h * 2)) / h for h in (1, 2.0, 3.01, 4.2))
        tone *= 1 + .004 * np.sin(2 * np.pi * 6 * tt)
        addat(out, tone * .5, int(t * SR))
        if i % 3 == 0: addat(out, np.sin(2 * np.pi * midi(m - 24) * tt) * np.exp(-tt * 3) * .25, int(t * SR))
        t += l * beat * (1 + .03 * np.sin(i * .7)); i += 1   # leve irregularidad: mecanismo que se va desajustando
    return norm(out, .6)

SFX = {
    'riser': lambda d: riser(1.3), 'clunk': lambda d: clunk(), 'power_down': lambda d: power_down(),
    'whoosh': lambda d: whoosh(.45, 300, 3500), 'whoosh_long': lambda d: whoosh(1.2, 200, 3000), 'whoosh_up': lambda d: whoosh(.6, 300, 6000),
    'whoosh_fast': lambda d: whoosh(.28, 400, 5000), 'zoom': lambda d: whoosh(.7, 200, 2500),
    'sting': lambda d: sting(1.4), 'sting_small': lambda d: sting(.9) * .6, 'sting_big': lambda d: sting(2.2, True), 'reveal_hit': lambda d: sting(2.5, True),
    'heartbeat': lambda d: heartbeat(min(d, 2.4), 75), 'phone_tap': lambda d: beep(1400, .05), 'tick': lambda d: norm(hp(noise(.012), 3000) * env(int(.012 * SR), .0005, .005), .35),
    'snore': lambda d: snore(), 'curtain': lambda d: curtain(), 'shutter_rattle': lambda d: shutter_rattle(), 'chain_rattle': lambda d: chain(.8),
    'door_thud': lambda d: thud(95, .4, .6), 'door_bang': lambda d: norm(mx(thud(80, .5, 1.0), creak(.3, 300) * .4), .9),
    'beep': lambda d: beep(980, .1), 'error': lambda d: norm(np.concatenate([beep(520, .14), np.zeros(int(.05 * SR)), beep(390, .25)]), .5),
    'jump': lambda d: whoosh(.25, 600, 3000) * .5, 'land': lambda d: thud(110, .2, .5),
    'sparkle': lambda d: norm(sum_(np.pad(bell(midi(m), 1.0), (int(k * .05 * SR), 0)) for k, m in enumerate([88, 91, 95, 100])), .45),
    'pop': lambda d: norm(sine(np.linspace(300, 1000, int(.08 * SR)), .08) * env(int(.08 * SR), .002, .05, 3), .5),
    'crunch': lambda d: norm(sum_(np.pad(bp(noise(.03), 1500, 7000) * env(int(.03 * SR), .001, .02), (int(k * .05 * SR), 0)) for k in range(6)), .4),
    'slurp': lambda d: norm(sweep_bp(noise(.6), 400, 1600, 5) * adsr(int(.6 * SR), .05, .1, .8, .2), .4),
    'boom': lambda d: norm(mx(thud(42, 2.2, .1), lp(noise(2.2), 200) * np.exp(-t_(2.2) * 2) * .5), .9),
    'counter': lambda d: norm(sum_(np.pad(beep(1500 + 40 * k, .03), (int(k * .045 * SR), 0)) for k in range(22)), .35),
    'ding': lambda d: bell(midi(88), 1.6), 'switch': lambda d: norm(mx(thud(200, .08, .9), hp(noise(.02), 3000) * .5), .7), 'spin_down': lambda d: spin_down(),
    'shiver': lambda d: norm(sum_(np.pad(hp(noise(.008), 2500) * env(int(.008 * SR), .0005, .004), (int(k * .045 * SR), 0)) for k in range(24)), .35),
    'breath': lambda d: norm(bp(noise(.8), 500, 3000) * adsr(int(.8 * SR), .2, .1, .6, .4), .35),
    'clock_tick': lambda d: norm(mx(clink((3000, 4500), .06, (60, 80)), thud(400, .05, .1) * .3), .4),
    'clock_chime': lambda d: norm(mx(bell(midi(69), 2.5), bell(midi(64), 2.5) * .6), .6),
    'creak_small': lambda d: creak(.5, 240) * .6, 'chair_creak': lambda d: norm(mx(creak(.8, 210), creak(.6, 260)), .5), 'cloth': lambda d: norm(bp(noise(.5), 1200, 6000) * adsr(int(.5 * SR), .05, .1, .6, .2), .25),
    'static': lambda d: static(.7), 'glitch': lambda d: glitch(.5), 'hit': lambda d: norm(mx(thud(60, .8, .6), sting(.8)), .95), 'cut_out': lambda d: glitch(.4),
}
LOOPS = {
    'amb_night_out': lambda d: mx(wind(d, 350) * .5, B.crickets(d, 3) * .4),
    'amb_mall_night': lambda d: mx(lp(noise(d), 120) * .3, hum(d, 50) * .15, wind(d, 250) * .2),
    'amb_store': lambda d: mx(lp(noise(d), 150) * .3, hum(d, 60) * .1),
    'amb_foodcourt': lambda d: mx(lp(noise(d), 150) * .25, hum(d, 60) * .2),
    'amb_security': lambda d: mx(hum(d, 60) * .6, static(d) * .15),
    'drone_low': lambda d: drone(d, 41), 'drone_tension': lambda d: mx(drone(d, 46.2, .8), sweep_bp(noise(d), 300, 3000, 6) * np.linspace(0, .4, int(d * SR))),
    'escalator': lambda d: mx(hum(d, 55) * .6, lp(noise(d), 300) * .4 * (1 + .2 * np.sin(2 * np.pi * 3 * t_(d)))),
    'ac_hum': lambda d: mx(lp(noise(d), 600) * .6, hum(d, 100) * .3), 'emergency_hum': lambda d: hum(d, 50) * .6, 'monitor_hum': lambda d: mx(hum(d, 60) * .4, sine(15700, d) * .03),
    'wind_cold': lambda d: wind(d, 650, 3, 4, True), 'silence_tone': lambda d: norm(sine(880, d) * .02 + lp(noise(d), 200) * .1, .15),
}

# ---------------- música original por secciones ----------------
BPM = 120; BEAT = 60 / BPM
def pad(ch, d, cut=1200, vol=.15):
    x = sum(saw(midi(m) * (1 + .1 * k / 100), d) for m in ch for k in (-1, 0, 1)) / (3 * len(ch)); return lp(x, cut) * adsr(int(d * SR), min(1, d * .3), .2, .85, min(1.2, d * .3)) * vol
def marimba(m, d=.5, v=.3): tt = t_(d); return (np.sin(2 * np.pi * midi(m) * tt) + .3 * np.sin(2 * np.pi * midi(m) * 4 * tt) * np.exp(-tt * 20)) * np.exp(-tt * 9) * v
def kick(): return thud(60, .3, .2)
def snare(): return norm(mx(bp(noise(.15), 1500, 7000) * env(int(.15 * SR), .001, .08, 5), sine(190, .1) * env(int(.1 * SR), .001, .05) * .5), .5)
def hat(): return norm(hp(noise(.04), 7000) * env(int(.04 * SR), .001, .02, 6), .2)
AM = [57, 60, 64]; F = [53, 57, 60]; G = [55, 59, 62]; EM = [52, 55, 59]; C = [48, 52, 55]; DM = [50, 53, 57]
def music(D):
    n = int(D * SR); out = np.zeros(n)
    def add(x, t, g=1.): addat(out, x * g, int(t * SR))
    # 0–2.5 gancho oscuro
    add(drone(2.6, 41), 0, .6); add(riser(1.25), .05, .4)
    # 2.5–9.0 misterio (pad menor + notas sueltas de piano)
    for i, ch in enumerate([AM, F, EM, AM]): add(pad(ch, 1.9, 900, .12), 2.5 + i * 1.6)
    for k, m in enumerate([76, 72, 74, 71, 72, 69]): add(pluck(midi(m), 1.6, .3, .996) * .18, 4.3 + k * .78)
    # 9.0–18.35 desorientación: pulso grave + tic-tac
    for i, ch in enumerate([AM, DM, AM, EM, F, EM]): add(pad(ch, 1.8, 700, .1), 9.0 + i * 1.56)
    t = 9.0
    while t < 18.3: add(pluck(midi(45), .5, .2, .995) * .25, t); add(hat() * .5, t + BEAT); t += BEAT * 2
    # 18.35–26.20 sección DIVERTIDA (Do mayor, marimba + batería ligera)
    prog = [C, G, AM, F]; t = 18.35; k = 0; mel = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 72, 76, 74, 72, 71]
    while t < 26.15:
        ch = prog[(k // 8) % 4]
        if k % 2 == 0: add(kick(), t, .5)
        if k % 4 == 2: add(snare(), t, .35)
        add(hat(), t, .35)
        add(marimba(ch[k % 3] + 12, .4, .22), t); add(marimba(mel[k % 16], .45, .26), t + BEAT / 4 if k % 2 else t)
        if k % 8 == 0: add(pluck(midi(ch[0] - 12), 1.8, .3, .997) * .35, t); add(pad(ch, BEAT * 8 + .2, 1500, .08), t)
        t += BEAT / 2; k += 1
    # 26.20: corte abrupto -> silencio (sólo una nota con eco)
    add(pluck(midi(76), 2.5, .5, .998) * .2, 26.25)
    # 27.6–32.7 asombro (arpegios brillantes)
    t = 27.6; k = 0
    while t < 32.6: ch = [F, C, G, AM][(k // 8) % 4]; add(marimba(ch[k % 3] + 24, .5, .16), t); t += BEAT / 2; k += 1
    for i, ch in enumerate([F, C, G, AM]): add(pad(ch, 1.4, 2200, .09), 27.6 + i * 1.27)
    # 32.7–40.1 enfriamiento: pad grave que baja
    for i, ch in enumerate([AM, F, DM, EM, AM]): add(pad([m - 12 for m in ch], 1.7, 600, .14), 32.7 + i * 1.48)
    # 40.1–48.45 caja musical diegética (se suma aparte) + drone
    add(drone(8.4, 36.7, .7), 40.1, .45)
    # 48.45–50.75 carrera: ostinato rápido + taikos
    t = 48.45; k = 0
    while t < 50.7: add(pluck(midi([45, 45, 52, 45, 53, 45, 52, 48][k % 8]), .3, .3, .993) * .35, t); add(kick(), t, .6 if k % 2 == 0 else .2); t += BEAT / 2.4; k += 1
    # 50.75–59.5 inquietud: drone + latido del bajo
    add(drone(8.8, 43.6, .6), 50.75, .5)
    for i in range(10): add(pluck(midi(40), 1.2, .2, .995) * .25, 50.9 + i * .87)
    # 59.5–63.3 horror; 63.3–64.6 casi silencio; 64.6–70.6 crescendo
    add(drone(3.8, 46.2, .9), 59.55, .6)
    cres = 6.0; tt = t_(cres); add(mx(drone(cres, 41.2, 1.2), sweep_bp(noise(cres), 200, 5000, 4) * .5) * (tt / cres) ** 2, 64.6, .9)
    for i in range(14): add(thud(55, .25, .05), 64.8 + i * (.42 - i * .012), .5 + i * .03)
    return reverb(out, IR_HALL, .3)

def main():
    narr = narration(); D = len(narr) / SR; n = len(narr); print('narración', round(D, 3), 's')
    cues = json.load(open(os.path.join(HERE, 'cues.json'))); shots = json.load(open(os.path.join(EP, 'out', 'shots.json')))
    sfx = np.zeros((2, n)); amb = np.zeros((2, n)); cnt = {}
    def shot_at(t): return next(s for s in reversed(shots) if t >= s['t0'] - 1e-6)
    for c in cues:
        name, t, g = c['name'], c['t'], c.get('gain', 1)
        if g <= 0: continue
        sh = shot_at(t + .001); dur = max(.3, sh['t1'] - t + .2); i = cnt.get(name, 0); cnt[name] = i + 1
        small = sh['place'] in ('security', 'fitting', 'phone', 'clock')
        if name.startswith('step_'): x = fx_step('wood' if name == 'step_carpet' else 'stone', i) * (.5 if name == 'step_carpet' else 1); wet = .35
        elif name == 'musicbox': x = music_box_track(48.6 - t, t); dur = 48.6 - t; wet = .25
        elif name in LOOPS: x = LOOPS[name](dur); f = min(int(.25 * SR), len(x) // 3); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f); wet = .3
        elif name in SFX: x = SFX[name](dur); wet = .25
        else: print('  sin sonido:', name); continue
        y = reverb(x, IR_SMALL if small else IR_MALL, wet)
        if name == 'musicbox':  # volumen según el plano: lejos -> cerca -> lejos
            tt = t + np.arange(y.shape[1]) / SR; gk = np.interp(tt, [41.3, 42.9, 45.2, 45.6, 47.7, 48.45, 48.6], [.45, .6, .7, 1.0, 1.0, .5, 0]); y = y * gk
        place(amb if name in LOOPS or name == 'musicbox' else sfx, y, t, g)
    mus = music(D)[:, :n]; mus = np.pad(mus, ((0, 0), (0, max(0, n - mus.shape[1]))))[:, :n]
    e = signal.lfilter([1 - np.exp(-1 / (.03 * SR))], [1, -np.exp(-1 / (.03 * SR))], np.abs(narr)); lvl = e / (np.percentile(e, 98) + 1e-9)
    duck = signal.lfilter([1 - np.exp(-1 / (.15 * SR))], [1, -np.exp(-1 / (.15 * SR))], 1 - .45 * np.clip(lvl * 2.5, 0, 1))
    pk = np.max(np.abs(narr))
    mus *= pk * .66 / (np.max(np.abs(mus)) + 1e-9) * duck; amb *= pk * .4 / (np.max(np.abs(amb)) + 1e-9) * (.6 + .4 * duck); sfx *= pk * .78 / (np.max(np.abs(sfx)) + 1e-9)
    mix = np.stack([narr, narr]) + mus + amb + sfx
    # final: silencio total en el último instante (corte a negro)
    tail = int((D - .1) * SR); mix[:, tail:] *= np.linspace(1, 0, n - tail)
    pkm = np.max(np.abs(mix))
    if pkm > .97: g = np.minimum(1, .97 / (np.abs(mix).max(axis=0) + 1e-9)); g = signal.lfilter([1 - np.exp(-1 / (.004 * SR))], [1, -np.exp(-1 / (.004 * SR))], g); g = np.minimum(g, np.minimum(1, .97 / (np.abs(mix).max(axis=0) + 1e-9))); mix *= g
    os.makedirs(os.path.join(EP, 'out'), exist_ok=True)
    def write(p, x):
        d = (np.clip(x, -1, 1).T * 32767).astype('<i2')
        with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
    write(os.path.join(EP, 'out', 'mix.wav'), mix)
    db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    print('mezcla', round(mix.shape[1] / SR, 3), 's · pico', round(float(np.max(np.abs(mix))), 3), f'· voz {db(narr):.1f} dB · música {db(mus):.1f} · amb {db(amb):.1f} · sfx {db(sfx):.1f}')

if __name__ == '__main__': main()
