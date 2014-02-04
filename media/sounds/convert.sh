#!/bin/bash

for a in *.mp3; do
  #< /dev/null ffmpeg -i "$a" -qscale:a 0 "${a[@]/%flac/mp3}"
	cp "$a" "${a[@]/\s/_}"
done
