/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  webpack: (config, { isServer }) => {
    // Exclude ONNX runtime binary files from webpack bundling
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Exclude problematic binary files
    config.externals.push({
      'onnxruntime-node': 'onnxruntime-node'
    });

    // Handle .node files (native binaries)
    config.externals.push({
      'utf-8-validate': 'utf-8-validate',
      'bufferutil': 'bufferutil',
    });

    // Simple externals configuration for ONNX
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };
    }

    // Skip processing of .node files
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
      options: {
        name: '[name].[ext]',
      },
    });

    return config;
  },
};

module.exports = nextConfig;