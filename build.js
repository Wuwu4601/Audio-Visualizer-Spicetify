const esbuild = require('esbuild');
const envPlugin = require('esbuild-plugin-env');

esbuild.build({
    entryPoints: ['Versiones-del-Visualizer/spotify-audio.js'],                 // Archivo de entrada
    bundle: true,                              // Hacer bundling de todas las dependencias
    outfile: 'dist/audio-visualizer.js',       // Archivo de salida
    format: 'iife',                            // Formato autoejecutable para navegador
    target: ['es2020'],                        // Compatibilidad con navegadores modernos
    plugins: [
        envPlugin(),                           // Plugin para variables de entorno
    ],
    logLevel: 'info'                           // Muestra errores y advertencias
}).catch((err) => {
    console.error('❌ Error al compilar:', err);
    process.exit(1);
});
