#!/usr/bin/env bash
# Codifica los fotogramas + la mezcla de audio en el MP4 final (1080x1920, 30 fps, H.264 + AAC)
set -euo pipefail
cd "$(dirname "$0")/.."
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 audio/narracion.mp3)
ffmpeg -y -v warning -framerate 30 -i out/frames/f%05d.jpg -i out/mix.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -level 4.2 \
  -r 30 -c:a aac -b:a 256k -ar 48000 -t "$DUR" -movflags +faststart \
  -metadata title="Un día en Roma hace 2000 años" out/roma_2000_short.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact out/roma_2000_short.mp4
