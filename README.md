# profilefetch

Generate a fastfetch-style SVG card for your GitHub profile README.

![preview](profilefetch.svg)

## Setup

```bash
git clone https://github.com/3p5ilon/profilefetch
cd profilefetch
node src/generate.js
```

Edit `src/config.js` and `src/theme.js`, then re-run to regenerate.

## Adding to your profile

In your `YOUR_USERNAME/YOUR_USERNAME` repo:

```html
<div align="center">
  <img
    src="https://raw.githubusercontent.com/YOUR_USERNAME/profilefetch/main/profilefetch.svg"
  />
</div>
```

## `src/config.js`

### info rows

```js
user: "Ɛpsilon",
host: "3p5ilon",

info: [
  { key: "OS",    value: "Arch Linux",  color: "red"   },
  { key: "Shell", value: "zsh 5.9",     color: "red"   },
  { key: "Langs", value: "Python · TS", color: "green" },
],
```

Each row takes `{ key, value, color }`. Use `null` to insert a blank line.

**Example:**

```js
info: [
  { key: "Shell", value: "zsh 5.9",     color: "red"   },
  null, // Explicit spacer
  { key: "Langs", value: "Python · TS", color: "green" },
],
```

Set `blankBetweenGroups: true` in `options` to automatically insert blank lines when the item `color` changes.

### Logo

**Text mode** — put any ASCII art in `src/logo.txt`:

```js
logo: {
  type: "text",
  text: { file: "logo.txt", color: "sky", fontSize: 13 },
}
```

**Image mode** — put a PNG or JPG in `src/`:

```js
logo: {
  type: "image",
  image: { path: "logo.png", width: 250, height: 250 },
}
```

## `src/theme.js`

### Colors

The default palette is [Catppuccin Mocha](https://github.com/catppuccin/catppuccin). Change any hex value in `palette` to retheme everything.

### Font

Any monospace Google Font works. Update `import`, `family`, and `charRatio` in theme.js.

### Layout

```js
layout: {
  width:       820,  // 800–820px fits GitHub profile
  columnGap:   32,   // gap between logo and info column
  lineHeight:  19,
}
```

## License

MIT
