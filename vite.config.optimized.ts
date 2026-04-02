import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - run with npm run build:analyze
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  
  build: {
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Minify with Terser for better optimization
    minify: 'terser',
    
    // Generate manifest for SSR or advanced use cases
    manifest: true,
    
    // Output directory
    outDir: 'dist',
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Target modern browsers for smaller bundles
    target: 'esnext',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Assets limit for inlining
    assetsInlineLimit: 4096, // 4KB
    
    // Rollup options for fine-grained control
    rollupOptions: {
      // Input files (if you have multiple entry points)
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      
      output: {
        // Enable experimental code splitting
        manualChunks: {
          // Vendor chunks - separate large dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Utility chunks
          'vendor-utils': ['lodash-es'], // if you use lodash
          
          // Component library chunks (if applicable)
          // 'vendor-ui': ['@radix-ui/react-dialog', ...],
        },
        
        // Chunk file naming pattern
        chunkFileNames: 'assets/js/[name]-[hash].js',
        
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // Asset file naming
        assetFileNames: ({ name }) => {
          // Separate fonts for better caching
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(name!)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          // Separate images
          if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(name!)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          // Separate styles
          if (/\.(css)$/.test(name!)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          // Default
          return 'assets/[name]-[hash][extname]';
        },
        
        // Optimize chunk size
        inlineDynamicImports: false,
        
        // Enable tree shaking
        treeshake: true,
        
        // Preserve modules for better code splitting
        preserveModules: false,
        
        // Split chunks by size
        experimentalMinChunkSize: 2500, // 2.5KB minimum
      },
    },
    
    // Terser options for better minification
    terserOptions: {
      compress: {
        // Drop console logs in production
        drop_console: true,
        drop_debugger: true,
        
        // More aggressive optimizations
        pure_getters: true,
        passes: 3,
        unused: true,
        dead_code: true,
      },
      format: {
        comments: false, // Remove license comments
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
    },
  },
  
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'motion',
      '@supabase/supabase-js',
    ],
    exclude: [],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  
  // ESBuild options for faster builds
  esbuild: {
    loader: 'tsx',
    target: 'esnext',
    legalComments: 'none',
    
    // Tree shaking
    treeShaking: true,
    
    // Drop console in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true,
    
    // Enable HMR (Hot Module Replacement)
    hmr: {
      overlay: true,
    },
    
    // Proxy API requests if needed
    proxy: {},
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true,
  },
  
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500KB
    maxAssetSize: 512000, // 500KB
  },
});
