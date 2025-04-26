# EMDR Bilateral Stimulation Tool

A simple, elegant site that provides bilateral visual and auditory stimulation for EMDR.

Published on [https://snickerton.github.io/emdr](https://snickerton.github.io/emdr) via GitHub Pages.

## What is EMDR?

[Eye Movement Desensitization and Reprocessing (EMDR)](https://en.wikipedia.org/wiki/Eye_movement_desensitization_and_reprocessing) is a psychotherapy treatment designed to alleviate the distress associated with traumatic memories. Developed by Francine Shapiro in the late 1980s, EMDR therapy involves the use of bilateral stimulation (visual, auditory, and/or tactile) while the client focuses on traumatic memories.

The bilateral stimulation is thought to facilitate the processing of traumatic memories, helping the brain to store them differently and reduce their emotional impact. EMDR has been recognized as an effective treatment for Post-Traumatic Stress Disorder (PTSD) by many organizations including the American Psychological Association and the World Health Organization.

## Important Disclaimer

This application is intended as an educational tool, not as a replacement for proper therapy. Using bilateral stimulation techniques without professional guidance may cause discomfort, distress, or other adverse psychological effects.

## Features

- **Customization**:
  - Adjustable duration of each round (seconds)
  - Configurable number of rounds
  - Variable speed control
  - Selectable sounds from the sounds directory

- **Accessibility Features**:
  - Spacebar can be used to start/pause/continue
  - Clean, high-contrast interface
- **Privacy-Focused**:
  - No data collection
  - Works offline
  - No external dependencies

## Technical Details

- Built with vanilla HTML5, CSS3, and JavaScript
- Uses Web Audio API for stereo sound effects
- Implements CSS animations for smooth visual movement

## Installation

Simply clone or download this repository and serve the files using any web server:

```bash
# Example using Python's built-in HTTP server
python -m http.server

# Or with Node.js http-server if installed
npx http-server
```

Or open `index.html` directly in your browser.

## Sound Files

The application looks for audio files in the `/sounds` directory. By default, it includes:
- tick.wav
- ping.wav 
- bing.wav

You can add your own .wav, .mp3, or .ogg files to this directory, and they will automatically appear in the sound selector dropdown.

## License

This project is provided as-is without any warranties. See the disclaimer in the application for full terms of use.

## Acknowledgments

This tool was created to provide therapists and their clients with a simple, accessible bilateral stimulation aid. It is intended to be used responsibly and only under appropriate professional guidance.
