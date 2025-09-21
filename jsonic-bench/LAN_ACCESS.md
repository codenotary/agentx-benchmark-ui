# 🌐 LAN Access Guide for JSONIC Benchmarks

Access the JSONIC benchmark suite from any device on your local network - phones, tablets, laptops, or other computers!

## 🚀 Quick Start

### 1. Start the Server

```bash
cd benchmarks
npm start
```

### 2. Access from Any Device

After starting the server, you'll see output like this:

```
📱 Network (access from any device on your LAN):
   http://192.168.1.100:8080 (Wi-Fi)
   http://10.0.0.5:8080 (Ethernet)
```

Simply open any of these URLs on your other devices!

## 📱 Testing from Mobile Devices

1. **Ensure devices are on the same network**
   - Connect your phone/tablet to the same Wi-Fi network as your computer

2. **Open the URL in your mobile browser**
   - Type the network URL (e.g., `http://192.168.1.100:8080`)
   - Bookmark it for easy access

3. **Run benchmarks**
   - The interface is mobile-responsive
   - All features work on mobile browsers

## 🔒 Firewall Configuration

If you can't access the server from other devices, you may need to allow the port through your firewall:

### Windows
```powershell
# Allow port 8080
netsh advfirewall firewall add rule name="JSONIC Benchmark" dir=in action=allow protocol=TCP localport=8080

# Remove rule when done
netsh advfirewall firewall delete rule name="JSONIC Benchmark"
```

### macOS
```bash
# Check if firewall is enabled
sudo pfctl -s info

# Usually, macOS will prompt to allow incoming connections
# If not, you can temporarily disable firewall in System Preferences > Security & Privacy
```

### Linux (Ubuntu/Debian)
```bash
# Allow port 8080
sudo ufw allow 8080/tcp

# Check status
sudo ufw status

# Remove rule when done
sudo ufw delete allow 8080/tcp
```

### Linux (Fedora/RHEL)
```bash
# Allow port 8080
sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
sudo firewall-cmd --reload

# Remove when done
sudo firewall-cmd --zone=public --remove-port=8080/tcp --permanent
sudo firewall-cmd --reload
```

## 🎯 Use Cases

### 1. Mobile Performance Testing
Test how JSONIC performs on mobile devices:
- Real device performance metrics
- Mobile browser compatibility
- Memory constraints testing

### 2. Cross-Device Comparison
Compare performance across different devices:
- Desktop vs Mobile
- Different browsers
- Various operating systems

### 3. Team Collaboration
Share benchmark results with your team:
- Live demonstrations
- Performance reviews
- Real-time testing sessions

### 4. Client Presentations
Show performance metrics to clients:
- Live benchmarks during meetings
- Interactive demonstrations
- Real device testing

## 🛠️ Advanced Configuration

### Custom Port
```bash
# Use a different port
PORT=3000 npm start
```

### Specific Network Interface
```bash
# Bind to specific IP
HOST=192.168.1.100 PORT=8080 npm start
```

### HTTPS Support
For production use, consider using a reverse proxy like nginx:

```nginx
server {
    listen 443 ssl;
    server_name benchmark.local;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Benchmark Tips for LAN Testing

### 1. Network Considerations
- Wired connections are more stable than Wi-Fi
- Close proximity to router improves consistency
- Avoid running benchmarks during network-heavy activities

### 2. Device Preparation
- Close unnecessary apps/tabs
- Ensure adequate battery (for mobile devices)
- Use consistent browser settings

### 3. Testing Strategy
- Run warmup iterations first
- Test at different times of day
- Compare same device types for fairness

## 🔍 Troubleshooting

### Can't Access from Other Devices

1. **Check IP address**
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   # or
   ip addr
   ```

2. **Verify same network**
   - Ensure all devices are on the same subnet
   - Check router settings for client isolation

3. **Test connectivity**
   ```bash
   # From other device
   ping 192.168.1.100  # Replace with your server IP
   ```

4. **Check server is running**
   ```bash
   # Should see process listening
   netstat -an | grep 8080
   ```

### Performance Issues

1. **Reduce concurrent connections**
   - Test one device at a time
   - Close other browser tabs

2. **Use smaller datasets**
   - Start with "small" dataset size
   - Gradually increase if needed

3. **Monitor resources**
   ```bash
   # Check CPU and memory
   top
   # or
   htop
   ```

## 🎉 Examples

### Running from iPad
1. Start server on laptop: `npm start`
2. Note the IP: `http://192.168.1.100:8080`
3. Open Safari on iPad
4. Enter the URL
5. Run benchmarks!

### Team Testing Session
1. Start server on presentation computer
2. Share URL with team via Slack/email
3. Everyone accesses simultaneously
4. Compare results in real-time

### Mobile-First Testing
1. Start server on development machine
2. Test on various phones:
   - iPhone (Safari)
   - Android (Chrome)
   - Android (Firefox)
3. Compare mobile performance metrics

## 🔐 Security Notes

- The server allows connections from any IP on your LAN
- Don't expose to the internet without proper security
- Use for development and testing only
- Consider authentication for sensitive data

## 📝 Quick Commands

```bash
# Start server (LAN accessible)
npm start

# Start on custom port
PORT=3000 npm start

# Start advanced server (with API endpoints)
npm run start:advanced

# Python alternative (if Node issues)
npm run serve

# Command-line benchmarks
npm run benchmark
```

## 💡 Pro Tips

1. **Use QR codes** for easy mobile access:
   - Generate QR code for your benchmark URL
   - Team members scan to instantly access

2. **Create shortcuts** on mobile devices:
   - Add to home screen for app-like access
   - Works offline once cached

3. **Monitor multiple devices**:
   - Open on several devices simultaneously
   - Compare real-time results

4. **Network optimization**:
   - Use 5GHz Wi-Fi for better performance
   - Minimize interference from other devices

---

Happy benchmarking across all your devices! 🚀