module.exports = {
  apps: [{
    name: "dedushka-drema",
    script: "servak.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "300M",
    env: {
      NODE_ENV: "production",
      PORT: 3000          // или другой порт, который открыт
    }
  }]
};
