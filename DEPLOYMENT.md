# Deployment Guide - Standalone Executable

Since you cannot install Node.js on your remote desktop, you'll need to build the standalone executable on another machine and then transfer it to your remote desktop.

## Option 1: Build on Another Machine

### Step 1: Build the Executable

On a machine **WITH** Node.js installed:

```bash
# Clone the repository
git clone <repository-url> Projetex-Fortnox
cd Projetex-Fortnox
git checkout claude/projetex-fortnox-connector-AACgi

# Install dependencies
npm install

# Build the executable for your target platform
# For Windows:
npm run build:win

# For Linux:
npm run build:linux

# For macOS:
npm run build:macos
```

The executable will be created in the `./build/` directory:
- Windows: `build/projetex-fortnox-win.exe`
- Linux: `build/projetex-fortnox-linux`
- macOS: `build/projetex-fortnox-macos`

### Step 2: Transfer to Remote Desktop

Transfer these files to your remote desktop:
1. The executable file (`projetex-fortnox-win.exe` or `projetex-fortnox-linux`)
2. The `.env.example` file (rename to `.env` and configure)

**Example file transfer methods:**
```bash
# Using SCP (Linux/Mac)
scp build/projetex-fortnox-linux user@remote-desktop:/path/to/destination/
scp .env.example user@remote-desktop:/path/to/destination/.env

# Using RDP file copy (Windows)
# Just copy-paste the files via Remote Desktop Connection

# Using SFTP
sftp user@remote-desktop
put build/projetex-fortnox-win.exe /path/to/destination/
put .env.example /path/to/destination/.env
```

### Step 3: Configure on Remote Desktop

On your remote desktop:

1. Edit the `.env` file with your API credentials:
```bash
# Linux
nano .env

# Windows
notepad .env
```

2. Make the executable runnable (Linux only):
```bash
chmod +x projetex-fortnox-linux
```

### Step 4: Run the Executable

**On Windows:**
```cmd
projetex-fortnox-win.exe bill PRJ-2024-001
```

**On Linux:**
```bash
./projetex-fortnox-linux bill PRJ-2024-001
```

## Option 2: Use Pre-built Binaries (If Available)

If the project provides pre-built binaries in GitHub Releases:

1. Download the appropriate executable for your platform from the Releases page
2. Transfer to your remote desktop
3. Follow Step 3 and 4 from Option 1 above

## Usage Examples

### Preview billing before creating invoice:
```bash
# Windows
projetex-fortnox-win.exe bill PRJ-2024-001 --preview

# Linux
./projetex-fortnox-linux bill PRJ-2024-001 --preview
```

### Create invoice:
```bash
# Windows
projetex-fortnox-win.exe bill PRJ-2024-001

# Linux
./projetex-fortnox-linux bill PRJ-2024-001
```

### Validate configuration:
```bash
# Windows
projetex-fortnox-win.exe validate

# Linux
./projetex-fortnox-linux validate
```

## File Structure on Remote Desktop

Your remote desktop should have:
```
/path/to/billing/
├── projetex-fortnox-linux     # or projetex-fortnox-win.exe
└── .env                        # Your API credentials
```

## Environment Variables

The `.env` file must contain:

```env
# Projetex API Configuration
PROJETEX_API_URL=https://your-company.projetex.com/api
PROJETEX_API_KEY=your-actual-projetex-api-key
PROJETEX_USERNAME=your-projetex-username

# Fortnox API Configuration
FORTNOX_API_URL=https://api.fortnox.se/3
FORTNOX_ACCESS_TOKEN=your-actual-fortnox-access-token
FORTNOX_CLIENT_SECRET=your-actual-fortnox-client-secret
```

## Important Notes

- The executable is **self-contained** and includes Node.js runtime
- Size: ~50-80 MB (compressed executable with embedded Node.js)
- No external dependencies required on the remote desktop
- The `.env` file must be in the same directory as the executable
- Firewall: Ensure outbound HTTPS connections are allowed for API calls

## Troubleshooting

### "Permission denied" error (Linux)
```bash
chmod +x projetex-fortnox-linux
```

### "Cannot find .env file" error
Make sure the `.env` file is in the same directory as the executable.

### "Missing environment variable" error
Check that all required variables are set in the `.env` file. Use the `.env.example` as a template.

### API connection errors
- Check firewall settings
- Verify API credentials are correct
- Test API connectivity: `curl -I https://api.fortnox.se` and `curl -I https://your-company.projetex.com`

## Security

- Keep the `.env` file secure - it contains sensitive API credentials
- Set appropriate file permissions (Linux):
  ```bash
  chmod 600 .env  # Only owner can read/write
  chmod 755 projetex-fortnox-linux  # Owner can execute, others can read
  ```
- Never commit the `.env` file to version control
- Rotate API keys regularly

## Alternative: Docker (If Docker is Available)

If your remote desktop has Docker but not Node.js:

1. Create a `Dockerfile` (included in the repository)
2. Build the Docker image on a machine with Docker
3. Export the image: `docker save projetex-fortnox > projetex-fortnox.tar`
4. Transfer to remote desktop
5. Load the image: `docker load < projetex-fortnox.tar`
6. Run: `docker run -v $(pwd)/.env:/app/.env projetex-fortnox bill PRJ-2024-001`

## Need Help?

If you encounter issues during deployment, check:
1. The executable matches your operating system (Windows vs Linux vs macOS)
2. The `.env` file is properly configured
3. Network connectivity to Projetex and Fortnox APIs
4. File permissions (Linux/macOS)

For build issues, ensure the build machine has:
- Node.js 18 or later
- At least 4GB free disk space (for Node.js source compilation)
- Good internet connection (downloads Node.js source)
