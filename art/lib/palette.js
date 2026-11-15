// Mirrors ../../colors.toml so every wallpaper is painted from the theme palette.
(function () {
  const J = (window.J = window.J || {});
  J.P = {
    darker_background: '#050e07',
    dark_background: '#09140c',
    background: '#0e1d12',
    lighter_background: '#17281b',
    selection: '#223e2a',
    muted: '#617c68',
    dark_foreground: '#768f7c',
    light_foreground: '#b8c5a9',
    foreground: '#dbe2c7',
    bright_foreground: '#f3f5e5',

    accent: '#85d867',
    red: '#f06c61',
    orange: '#f89b4c',
    yellow: '#efcc5d',
    green: '#85d867',
    cyan: '#5fd2ba',
    blue: '#5cb3e9',
    magenta: '#df86c7',
    brown: '#765135',

    bright_red: '#fe8c80',
    bright_yellow: '#fbe387',
    bright_green: '#a3ed8a',
    bright_cyan: '#88e6d1',
    bright_blue: '#81cbfa',
    bright_magenta: '#f2a4db',
  };

  // Extended foliage ramp derived from the palette (deep shade -> sunlit leaf).
  J.LEAF = {
    abyss: '#030805',
    shade: '#08130c',
    deep: '#0f2416',
    dark: '#173a20',
    mid: '#24562c',
    leaf: '#3a7a37',
    fresh: '#5ea843',
    sun: '#85d867',
    glow: '#c5f0a0',
  };
})();
