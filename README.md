# ProfileFetch

A terminal fastfetch style SVG generator for your GitHub Profile readme.
![preview](output/profilefetch.svg)

## Quick Setup

1. Fork or use as template (repo name = your GitHub username)
2. Edit the source files in `src/` (see Customization below).
3. Generate your SVG with one command:
   ```bash
   node src/generate.js
   ```

## 🛠️ Customization

### 📝 Content (`src/config.js`)

| Option               | Description                                   |
| -------------------- | --------------------------------------------- |
| `info`               | Array of stats with custom keys & colors      |
| `ascii.type`         | `"text"` or `"image"`                         |
| `ascii.fontSize`     | Scale ASCII art independently                 |
| `"break"`            | Manual gap (add anywhere in array)            |
| `blankBetweenGroups` | Auto-gap when colors change (`true`/`false`)  |
| **Text Mode**        | ASCII file at `src/ascii.txt`                 |
| **Image Mode**       | Image at `src/profile.png` (PNG/JPG → Base64) |

### 🎨 Theme (`src/theme.js`)

| Option    | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `palette` | Full hex control (default: [Catppuccin Mocha](https://github.com/catppuccin/catppuccin)) |
| `layout`  | `width`, `padding`, `columnGap`                                                          |
| `font`    | Any Google Font (default: [JetBrains Mono](https://www.jetbrains.com/lp/mono/))          |

## 🖇️ Deployment

Add to `username/README.md` (repo must match your GitHub username)

```md
<div align="center">
  <img
    src="https://raw.githubusercontent.com/YOUR_USERNAME/profilefetch/main/output/profilefetch.svg"
    alt="ProfileFetch"
  />
</div>
```

## License

MIT

