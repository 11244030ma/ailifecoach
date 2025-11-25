# App Icons

To generate proper icons, you can:

1. Use an online tool: https://realfavicongenerator.net/
2. Upload a 512x512 PNG image
3. Download the generated icons
4. Replace the files in this directory

For now, you can use the SVG icon (icon.svg) as a placeholder.

To convert SVG to PNG (if you have ImageMagick):
```bash
for size in 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} icon.svg icon-${size}x${size}.png
done
```

Or use an online converter: https://cloudconvert.com/svg-to-png
