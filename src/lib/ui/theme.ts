export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "control360.theme";

/**
 * Script en línea que aplica el tema guardado antes del primer pintado (sin parpadeo).
 * Se mantiene mínimo y sin dependencias.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
